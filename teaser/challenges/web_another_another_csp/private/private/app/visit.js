const puppeteer = require('puppeteer');

const [FLAG, url, timeout] = process.argv.slice(2);
const sleep = d => new Promise(r=>setTimeout(r,d));
(async () => {
    
    const browser = await puppeteer.launch({
        pipe: true,
        args: [
            '--incognito',
            "--disable-gpu",
			"--no-sandbox",
			"--js-flags=--noexpose_wasm,--jitless",
        ],
        dumpio: true,
        headless: true,
        executablePath: "/usr/bin/google-chrome",
    });

    try {
        const context = await browser.createBrowserContext();
        const page = await context.newPage();
        await page.goto('http://localhost');
        await page.evaluate((flag) => {
        	localStorage.setItem('flag', flag);
        }, FLAG);
        await sleep(500);

        await page.close();
        const playerPage = await context.newPage();
        playerPage.goto(url).catch(()=>{});
        await sleep(Number(timeout));
        
    } catch(e) {
        console.error(e);
    };
    
    await browser.close();
})();