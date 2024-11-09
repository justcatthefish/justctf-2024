import puppeteer from 'puppeteer';

const PASSWORD = process.env.FLAG_PASSWORD ?? 'FlagPassword';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const report = async (id) => {
	if (!/^[a-zA-Z0-9]+$/.test(id) || id.length > 32) {
		throw new Error('Invalid id');
	}
	const browser = await puppeteer.launch({
		headless: 'new',
		pipe: true,
		args: ['--disable-gpu', '--no-sandbox', '--js-flags=--noexpose_wasm,--jitless'],
		executablePath: '/usr/bin/chromium-browser'
	});
	const page = await browser.newPage();
	await page.goto('http://localhost');
	await page.type('input[type=text]', 'flag');
	await page.type('input[type=password]', PASSWORD);
	await page.click('button', { text: 'enter' });
	await page.waitForFunction(() => document.body.innerText.includes('Logged as'));
	await page.goto(`http://localhost/view-plant?id=${id}`);
	await sleep(15_000);
	await page.goto('http://localhost');
	await page.click('button', { text: 'Logout' });
	await browser.close();
};
