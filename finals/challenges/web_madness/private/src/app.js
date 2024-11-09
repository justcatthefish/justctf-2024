const express = require('express')
const app = express()
const minify = require('html-minifier').minify;
const fs = require('fs');
const crypto = require('crypto');
const {
    createHash
} = require('crypto');
const reportUrl = require("./adminbot.js");
const bp = require("body-parser");

app.use(bp.urlencoded({ extended: false }));

const MINIFY_OPTIONS = {
    removeComments: true,
    collapseWhitespace: true,
    minifyJS: {
        output: {
            quote_style: 3
        }
    },
    quoteCharacter: "'",
    minifyCSS: true,
}
const INDEX = minify(fs.readFileSync('index.html', {
    encoding: 'utf-8'
}), MINIFY_OPTIONS);

const REPORT = minify(fs.readFileSync('report.html', {
    encoding: 'utf-8'
}), MINIFY_OPTIONS);

function colorFromString(str) {
    const hash = createHash('md5');
    hash.update(str)
    const bytes = hash.digest();
    const mod = (256 * 256 * 256) - 1;
    let color = 137;

    for (let b of bytes) {
        color = (256 * color + b) % mod;
    }
    color = ('000000' + color.toString(16)).slice(-6)
    return '#' + color;
}

app.use('/', (req, res, next) => {
    const nonce = crypto.randomBytes(16).toString('base64');
    res.setHeader('Content-Security-Policy', [
        `default-src 'none'`,
        `form-action 'self'`,
        `script-src 'nonce-${nonce}'`,
        `style-src 'nonce-${nonce}' https://fonts.googleapis.com/`,
        `font-src https://fonts.gstatic.com/`
    ].join('; '));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    res.locals.nonce = nonce;
    return next();
});

app.get('/', (req, res) => {
    const user = req.query.user || "Visitor";
    let color = req.query.color || colorFromString(user);

    if (typeof user !== 'string' || typeof color !== 'string') {
        return res.status(500).end('wrong params');
    }

    if (color.length > '#00112233'.length) {
        return res.status(500).end('Only #{R}{G}{B}{A} is supported');
    }

    color = JSON.stringify(color);

    const index = INDEX.replaceAll('__NONCE__', res.locals.nonce)
        .replace('__USER__', user)
        .replace('__COLOR__', color);

    res.set('content-type', 'text/html; charset=utf-8');
    res.send(index);
});


app.get("/report", (req, res) => {
    let report = REPORT.replaceAll('__NONCE__', res.locals.nonce);
    report = report.replace('__MESSAGE__', "");
    report = report.replace('__COLOR__', JSON.stringify(colorFromString(res.locals.nonce)));
    res.set('content-type', 'text/html; charset=utf-8');
    res.send(report);
});


app.post("/report", (req, res) => {
    const { url } = req.body;
    let report = REPORT.replaceAll('__NONCE__', res.locals.nonce);
    let message = "";
    if (typeof url == 'string' && url.match(/^http\:\/\/localhost:3000\/\?user=/)) {
        reportUrl(url);
        message = 'Adming will visit your link shortly!';
    } else {
        message = "Invalid URL";
    }

    report = report.replace('__COLOR__', JSON.stringify(colorFromString(url)));
    report = report.replace('__MESSAGE__', `<p class="msg">${message}</p>`);
    res.set('content-type', 'text/html; charset=utf-8');
    res.send(report);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`)
});