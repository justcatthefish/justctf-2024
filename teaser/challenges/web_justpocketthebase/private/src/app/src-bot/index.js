import express from 'express';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { report } from './bot.js';

// Rate limit for report endpoint - 1 request per minute
const limiter = rateLimit({
	windowMs: 60 * 1000,
	max: 1,
	standardHeaders: true,
	legacyHeaders: false
});

const app = express();

app.use(cookieParser());
app.use(express.json());

app.post('/report', limiter, async (req, res) => {
	try {
		if (!req.body.id) {
			throw new Error('Invalid input.');
		}
		if (typeof req.body.id !== 'string') {
			throw new Error('Invalid input.');
		}

		await report(req.body.id);

		return res.json({ success: true });
	} catch (err) {
		console.log(err);
		return res.status(400).json({ success: false });
	}
});

app.use((req, res) => {
	console.log(req.url, req.method);
});

app.listen(1337, () => {
	console.log('Server running on port 1337');
});
