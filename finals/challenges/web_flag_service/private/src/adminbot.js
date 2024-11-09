var puppeteer = require("puppeteer");

const FLAG = process.env.FLAG ?? "justCTF{fake-flag}";

module.exports = async (url) => {
    console.log(`Visiting: ${url}`);
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
        let page = await browser.newPage();

        await page.goto('http://localhost:3000/admin/login');
        await page.waitForSelector('form');
        await page.type('form [name=secret]', FLAG);
        await page.click('form button');
        await page.waitForSelector('h2#flag');

        await page.close();

        page = await browser.newPage();
        
        page.goto(url).catch(()=>{})

        await new Promise((resolve) => setTimeout(resolve, 3000));
    } finally {
        await browser.close();
    }
}

