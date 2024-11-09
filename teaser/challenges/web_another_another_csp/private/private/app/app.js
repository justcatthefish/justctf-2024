const express = require('express');
const fs = require('fs');
const { spawn } = require('child_process');

const FLAG = process.env.FLAG || "justCTF{example_flag}";
const TIMEOUT = process.env.TIMEOUT || Number("10000");

const sleep = timeout => new Promise(resolve => setTimeout(resolve, timeout));
const wait = child => new Promise(resolve => child.on('exit', resolve));

const visit = async url => {
  let stdoutChunks = [], stderrChunks = [];

  browserOpen = true;
  const proc = spawn('node', ['visit.js', FLAG, url, TIMEOUT], { detached: true });

  proc.on('exit', (code) =>
    console.log('Process exited with code', code)
  );

  proc.stdout.on('data', (data) => {
    stdoutChunks = stdoutChunks.concat(data);
  });
  proc.stdout.on('end', () => {
    const stdoutContent = Buffer.concat(stdoutChunks).toString();
    console.log('stdout chars:', stdoutContent.length);
    console.log(stdoutContent);
  });

  proc.stderr.on('data', (data) => {
    stderrChunks = stderrChunks.concat(data);
  });
  proc.stderr.on('end', () => {
    const stderrContent = Buffer.concat(stderrChunks).toString();
    console.log('stderr chars:', stderrContent.length);
    console.log(stderrContent);
  });

  await Promise.race([
    wait(proc),
    sleep(TIMEOUT + 2_000)
  ]);

  if (proc.exitCode === null) {
    process.kill(-proc.pid);
  }
}

const index = fs.readFileSync('index.html', 'utf-8');

const app = express();
const port = 80;

const headers = (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    res.set('X-Frame-Options', 'DENY');
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Referrer-Policy', 'no-referrer');
    next();
}

app.use(headers);

app.get('/', (req, res) => {
    res.set('content-type', 'text/html;charset=utf-8');
  res.end(index);
});

app.get('/bot', async (req, res) => {
    const url = req.query.url;
    if(typeof url !== 'string' || !(url.startsWith('http://') || url.startsWith('https://'))){
        return res.end("Invalid url");
    }
    visit(url);
    return res.end("Admin will visit the URL shortly");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});