const logArea = document.getElementById("log");
const infoArea = document.getElementById("info");

const bg = document.getElementsByClassName("shop-container");

function setGoodBackground() {
    bg[0].className = `shop-container good-data`;
}

function setBadBackground() {
    bg[0].className = `shop-container bad-data`;
}

function setDefaultBackground() {
    bg[0].className = `shop-container`;
}

function info(serial, message) {
    infoArea.textContent += `[${serial}] ${message}\n`;
    infoArea.scrollTop = infoArea.scrollHeight;  // Auto-scroll
}
function log(arg1) {
    console.log(arg1);
}

/*
0000: 75 73 65 72 6E 61 6D 65 00 00 00 00 00 00 00 00  | Username........|	16B username field
0010: FF FF FF FF FF FF FF FF FF FF FF FF FF FF FF FF  | ................|
0020: 00 64 FF FF FF FF FF FF FF FF FF FF FF FF FF FF  | XX..............|	2B funds field
0030: FF FF FF FF FF FF FF FF FF FF FF FF FF FF FF FF  | ................|
0040: 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  | Webhook address.|	128B webhook addr
0050: 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  | ................|
0060: 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  | ................|
0070: 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  | ................|
0080: 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  | ................|
0090: 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  | ................|
00a0: 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  | ................|
00b0: 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  | ................| <--- webhook ends here
00c0: FF FF FF FF FF FF FF FF FF FF FF FF FF FF FF FF  | ................|
00d0: FF FF FF FF FF FF FF FF FF FF FF FF FF FF FF FF  | ................|
00e0: FF FF FF FF FF FF FF FF FF FF FF FF FF FF FF FF  | ................|
00f0: FF FF FF FF FF FF FF FF FF FF FF FF DE AD BE EF  | ............YYYY| <--- crc32 checksum field
                                          ^
                                          \---- 0xfc offset 
*/
const TOTAL_LENGTH = 0x100;     // 256 bytes
const USERNAME_OFFSET = 0x0;
const FUNDS_OFFSET = 0x20;
const COMMENT_OFFSET = 0x40;
const CRC_OFFSET = 0xfc;

const USERNAME_LENGTH = 16;
const FUNDS_LENGTH = 2;
const COMMENT_LENGTH = 128;

function isString(value) {
    return typeof value === 'string' || value instanceof String;
}

function makeCRCTable() {
    var c;
    var crcTable = [];
    for(var n =0; n < 256; n++){
        c = n;
        for(var k =0; k < 8; k++){
            c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        crcTable[n] = c;
    }
    return crcTable;
}

function crc32(data, length) {
    var crcTable = window.crcTable || (window.crcTable = makeCRCTable());
    var crc = 0 ^ (-1);

    for (var i = 0; i < length; i++ ) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xFF];
    }

    return (crc ^ (-1)) >>> 0;
}

class UserData {
    constructor(name, funds, comment) {
        if (!isString(name) || name.length > 16)
            throw new Error('Name must be a string of length <= 16');
        if (funds < 0 || funds >= 0xffff)
            throw new Error('Funds must be >= 0 and < 0xffff');
        if (!isString(comment) || comment.length > 128)
            throw new Error('Comment field must be a string of length <= 128');

        this.name = name;
        this.funds = funds;
        this.comment = comment;
    }

    serialize() {
        let data = new Uint8Array(TOTAL_LENGTH);
        data.fill(0xFF);

        // Zero out username field and write it
        data.fill(0x00, 0, USERNAME_LENGTH);
        for(var i=0; i<USERNAME_LENGTH; ++i)
            data[USERNAME_OFFSET+i] = this.name.charCodeAt(i);

        // Write the funds field
        data[FUNDS_OFFSET] = (this.funds >> 8) & 0xFF;
        data[FUNDS_OFFSET+1] = (this.funds) & 0xFF;

        // Write the webhook field
        data.fill(0x00, COMMENT_OFFSET, COMMENT_OFFSET+COMMENT_LENGTH);
        for(var i=0; i<COMMENT_LENGTH; ++i)
            data[COMMENT_OFFSET+i] = this.comment.charCodeAt(i);
        
        // Compute checksum and write it
        this.checksum = crc32(data, TOTAL_LENGTH-4);
        data[CRC_OFFSET + 0] = (this.checksum >> 24) & 0xff;
        data[CRC_OFFSET + 1] = (this.checksum >> 16) & 0xff;
        data[CRC_OFFSET + 2] = (this.checksum >>  8) & 0xff;
        data[CRC_OFFSET + 3] = (this.checksum >>  0) & 0xff;
        log(`Serialize computed checksum: ${this.checksum}`);

        log(`data=${data}`);
        return data;
    }

    static deserialize(data) {
        if (data.length != TOTAL_LENGTH) {
            return {'obj': null, 'err': `Data length ${data.length}!=${TOTAL_LENGTH}`};
        }

        // Validate username bytes 0-16 to be ascii letters only
        let username = '';
        for(let i=USERNAME_OFFSET; i<USERNAME_OFFSET+USERNAME_LENGTH; ++i) {
            const val = data[i];
            if (!((val >= 0x30 && val <= 0x39) || // 0-9
                  (val >= 0x41 && val <= 0x5A) || // A-Z
                  (val >= 0x61 && val <= 0x7A) || // a-z
                  val === 0x00)) { // null byte
                return {'obj': null, 'err': `Invalid name char (byte ${val}; only A-Za-z0-9 and null bytes allowed)`};
            }

            if (val == 0)
                break;

            username += String.fromCharCode(val);
        }
        if (username === '') {
            return {'obj': null, 'err': 'Empty username'};
        }

        if (!validPaddingBytes(data, USERNAME_OFFSET+USERNAME_LENGTH, FUNDS_OFFSET)) {
            return {'obj': null, 'err': 'Invalid name<>funds padding byte[s]'};
        }
        if (!validPaddingBytes(data, FUNDS_OFFSET+FUNDS_LENGTH, COMMENT_OFFSET)) {
            return {'obj': null, 'err': 'Invalid funds<>comment padding byte[s]'};
        }

        // Get funds
        const funds = (data[FUNDS_OFFSET] << 8) | data[FUNDS_OFFSET + 1];

        if (!validPaddingBytes(data, COMMENT_OFFSET+COMMENT_LENGTH, CRC_OFFSET)) {
            return {'obj': null, 'err': 'Invalid comment<>checksum padding byte[s]'};
        }

        // Get comment
        let comment = '';
        for (let i = COMMENT_OFFSET; i < COMMENT_OFFSET + COMMENT_LENGTH; i++) {
            const charCode = data[i];
            if (charCode === 0)
                break; // Stop at null terminator
            comment += String.fromCharCode(charCode);
        }

        // Deserialize the checksum from data
        const deserializedChecksum = 
            (((data[CRC_OFFSET + 0] & 0xff) << 24)  | 
            ((data[CRC_OFFSET + 1] & 0xff) << 16) | 
            ((data[CRC_OFFSET + 2] & 0xff) <<  8) | 
            ((data[CRC_OFFSET + 3] & 0xff) <<  0)) >>> 0;

        // Compute CRC32 of the data (excluding the checksum bytes)
        const computedChecksum = crc32(data, TOTAL_LENGTH - 4);
        log(`dataS=${data}`);
        // Compare deserialized checksum with computed checksum
        if (deserializedChecksum !== computedChecksum) {
            log(`Checksum mismatch ${deserializedChecksum} != ${computedChecksum}`);
            return {'obj': null, 'err': `Checksum mismatch`};
        }

        // Create and return the UserData object
	try { 
		return {
		    'obj': new UserData(username, funds, comment),
		    'err': null
		};
	}
	catch (error) {
		return {
			'obj': null,
			'err': error.message
		}
	}

    }
}

function validPaddingBytes(data, idxFrom, idxTo) {
    for(let i=idxFrom; i<idxTo; ++i) {
        if (data[i] != 0xff)
            return false;
    }
    return true;
}

async function writeUserToCard(serial, userData, resetted) {
    if (resetted) {
        msg = `Card resetted: funds=${userData.funds}`;
    }
    else {
        msg = `Card updated w/flag & funds=${userData.funds}`;
    }

    const rawData = userData.serialize();
    await ndef.write(rawData, {overwrite: true})
    .then(() => {
        log(`Write succeeded; funds=${userData.funds}`);
        info(serial, msg);
        // log(`writeUserToCard succeeded; funds=${userData.funds}`);
    })
    .catch((error) => {
        log(`[${serial}] writeUserToCard error: ${error}`);
        // updatePageTexts('', `ERROR writing to the NFC card: ${error}`);
        info(serial, `NFC write error`); //: ${error}`)
    });
}

const FLAG_PREFIX = 'https://www.youtube.com/watch?v=Sagg08DrO5U&flag=';
const DEFAULT_FAKE_FLAG = FLAG_PREFIX + 'justWTF{you_need_to_buy_the_real_flag}';
const REAL_FLAG = 'justCTF{50M3_NFC_B453D_4PP5_4R3_50_BR0K3N}'

async function resetUserData(serial) {
    const ud = new UserData(
        'User' + serial.slice(-2),
        100,
        DEFAULT_FAKE_FLAG,
    );

    await writeUserToCard(serial, ud, true);
}

function blockNfcForMoment(isGood) {
    if (isGood) setGoodBackground();
    else setBadBackground();

    ndef.removeEventListener("reading", handleReading);
    setTimeout(() => {
        setDefaultBackground();
        ndef.addEventListener("reading", handleReading);
    }, 1000);
}

function debugLog(message, serialNumber) {
    const len = message.records.length;
    log(`> Records: ${len} SN: ${serialNumber}`);
    for(var i=0; i<len; ++i) {
        const data = new Uint8Array(message.records[i].data.buffer);
        log(`len: ${data.length} data: ${data}`);
    }
}

const fake_flags = [
    "justWTF{n0_easy_f1ag_h3re}",
    "justWTF{w3lc0m3_t0_th3_g4m3}",
    "justWTF{pr0t3ct_y0ur_w34kn3ss3s}",
    "justWTF{1ts_a_tr4p!}",
    "justWTF{pwn3d_y0ur_br41n}",
    "justWTF{n0_such_luck}",
    "justWTF{u_g0t_th1s!}",
    "justWTF{0v3rcl0ck_th3_ctf}",
    "justWTF{wh0_said_th1s_was_3asy}",
    "justWTF{catch_m3_if_y0u_c4n}"
  ];

async function handleReading({ message, serialNumber }) {
    // Get the last 6 characters of serialNumber
    serialNumber = serialNumber.slice(-5);
    // debugLog(message, serialNumber);

    if (message.records.length != 1) {
        blockNfcForMoment(false);
        log(`[handleReading] message.records.length (${message.records.length}) =! 1`);

        info(serialNumber, `Data error: records.length != 1 (resetting card)`);
        await resetUserData(serialNumber);

        return;
    }

    const data = new Uint8Array(message.records[0].data.buffer);
    
    const result = UserData.deserialize(data);
    if (result.err !== null) {
        blockNfcForMoment(false);
        log(`[handleReading] err=${result.err}, resetting card`);

        info(serialNumber, `Data error: ${result.err} (resetting card)`);
        await resetUserData(serialNumber);

        return;
    }

    const ud = result.obj;

    if (ud.funds > 1000) {
        blockNfcForMoment(true);
        log(`Giving flag to ${ud.name} for ${ud.funds} funds`);

	ud.comment = FLAG_PREFIX + REAL_FLAG;
	await writeUserToCard(serialNumber, ud);
        info(serialNumber, `${ud.name} bought a justCTF{REDACTED} flag (for >1000 funds)`);

        return;
    }

    ud.funds -= 10;
    if (ud.funds < 0) {
        blockNfcForMoment(false);
        log(`[handleReading] insufficient funds: resetting card`);

        info(serialNumber, `${ud.name}: insufficient funds to buy any flag (<0). resetting card`);
        await resetUserData(serialNumber);

        return;
    }

    log(`[handleReading] user is fine, updating their funds to: ${ud.funds}`);
    blockNfcForMoment(true);

    const randomIndex = Math.floor(Math.random() * fake_flags.length);
    const randomFlag = fake_flags[randomIndex];

    ud.comment = FLAG_PREFIX + randomFlag;

    info(serialNumber, `${ud.name} buys a random flag (saving new funds: ${ud.funds})`);
    await writeUserToCard(serialNumber, ud);
}

if (!('NDEFReader' in window)) {
  info('!','window.NDEFReader is not defined. This browser seems to not support Web NFC API and this task will not work on it.');
  info('!','See https://developer.mozilla.org/en-US/docs/Web/API/Web_NFC_API');
}
const ndef = new NDEFReader();

ndef.addEventListener("readingerror", (err) => {
    const errText = `Error reading the NFC tag: ${err.toString()}`;
    log(errText);
    info('', `NFC Read error`); //: ${errText}`);
});

ndef.addEventListener("reading", handleReading);

ndef.scan();
info('!', "NFC scanner initialized");

console.log('Registering service worker');
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch(error => {
          console.log('ServiceWorker registration failed: ', error);
        });
    });
  }
  
