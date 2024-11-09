var puppeteer = require("puppeteer");

const FLAG = process.env.FLAG ?? "justCTF{fake-flag}";

module.exports = async (url) => {
    const browser = await puppeteer.launch({
        headless: "new",
        pipe: true,
        args: [
            "--disable-gpu",
            "--incognito",
            "--no-sandbox",
            "--js-flags=--noexpose_wasm,--jitless",
        ],
        executablePath: "/usr/bin/chromium-browser",
    });
    try {
        const page = await browser.newPage();
        await page.setCookie({
            name: "FLAG",
            value: FLAG,
            domain: "localhost",
            path: "/",
        });

        page.goto(url).catch(()=>{})

        await new Promise((resolve) => setTimeout(resolve, 3000));
    } finally {
        await browser.close();
    }
}