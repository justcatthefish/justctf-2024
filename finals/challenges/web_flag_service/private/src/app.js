const express = require('express')
const app = express()

const cookieSession = require('cookie-session');
const crypto = require('crypto');

const FLAG = process.env.FLAG || 'justCTF{admin-flag}';

const reportUrl = require("./adminbot.js");
const bp = require("body-parser");

app.set('view engine', 'ejs');

app.use(bp.urlencoded({ extended: false }));

app.use(cookieSession({
    name: 'session',
    keys: [crypto.randomBytes(32).toString('hex')],
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
}));

app.use('*', (req, res, next) =>{
    if(!req.session.flag) req.session.flag = 'justCTF{your-very-first-flag}';
    next();
});

app.get('/admin/login', (req, res) => {
    return res.render('admin');
});

app.post('/admin/login', (req, res) => {
    if(req.body.secret === FLAG){
        req.session.admin = true;
        return res.redirect('/admin/display-flag');
    }

    return res.send('Wrong password');
});

app.get('/admin/logout', (req, res) => {
    req.session.admin = false;
    res.send('Logged out');
});

app.get("/report", (req, res) => {
    res.render('report');
});

app.post("/report", (req, res) => {
    const { url } = req.body;
    if (typeof url == 'string' && url.startsWith('http://localhost:3000/')) {
        reportUrl(url);
        return res.end('Adming will visit your link shortly!');
    } else {
        return res.end("Invalid URL");
    }
});


app.get('/admin/:service', async (req, res, next) => {
    const url = new URL(req.baseUrl + req.url, 'http://localhost');
    if(req.session.admin && !url.searchParams.get('flag')){
        url.searchParams.set('flag', FLAG);
        await new Promise(r=>setTimeout(r,500));
        return res.redirect(`${url.pathname}${url.search}`);
    }

    if(!req.session.admin){
        url.pathname = req.params.service; 
        return res.redirect(url.pathname + url.search);
    }
    
    next();
});

app.get('/:service', (req, res, next) => {
    const url = new URL(req.baseUrl + req.url, 'http://localhost');
    if(!url.searchParams.get('flag')){
        url.searchParams.set('flag', req.session.flag);
        const service = req.params.service.replace(/^\/*/, '');
        return res.redirect(`/${service}${url.search}`);
    }
    next();
});

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/admin/display-flag', (req, res, next) => {
    res.render('flag');
});

app.get('/display-flag', (req, res) => {
    res.render('flag');
});

app.get('/change-flag', (req, res) => {
    res.render('change-flag');
});

app.post("/set-flag", (req, res) => {
    req.session.flag = req.body.flag;
    res.redirect('/display-flag');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`)
});