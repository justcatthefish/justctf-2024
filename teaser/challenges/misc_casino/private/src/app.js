const express = require('express')
const crypto = require('crypto')
const seedrandom = require('seedrandom')
const session = require('express-session')

let users = {}

let app = new express()
app.use(express.urlencoded( { extended: false }));
app.use(express.static("./static/"))
app.use(
    session({
      cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7,
      },
      resave: false,
      saveUninitialized: true,
      secret: crypto.randomBytes(32).toString("hex"),
    })
  );

app.post("/register", (req, res) => {
    let { username, password } = req.body;
    if (typeof username != "string" || typeof password != "string") {
        res.end("Username and password must be string")
        return
    }

    if(password.length < 8) {
        res.end("Password too short! Must be least 8 characters")
        return;
    }

    if(username.length < 4) {
        res.end("Username too short! must be least 4 characters")
        return;
    }

    if (users[username]) {
        res.end("User already exists!")
        return
    }

    users[username] = {
        username,
        password,
        balance: 1000,
        nonce: 0,
        serverSeed: crypto.randomBytes(32).toString("hex")
    }
    req.session.username = username
    res.redirect("home.html")
})


app.post("/login", (req, res) => {
    let { username, password } = req.body;

    if (typeof username != "string" || typeof password != "string") {
        res.end("Username and password must be string")
        return
    }

    if (users[username]?.password == password &&
        users[username]?.username == username
    ) {
        req.session.username = username
        res.redirect("home.html")
    } else {
        res.end("Invalid username/password!")
    }
})


app.use((req, res, next) => {
    if (!req.session.username) {
        res.json({ "error": "Unauthorized" })
    } else {
        req.user = users[req.session.username];
        next()
    }
})

app.get("/signout", (req, res) => {
    delete req.session.username;
    res.redirect("/")
})

app.get("/info", (req, res) => {
    res.json({
        username: req.user.username,
        serverSeedHash: crypto.createHash("sha256").update(req.user.serverSeed).digest("hex"),
        balance: req.user.balance,
        nonce: req.user.nonce
    })
})

app.get("/flag", (req, res) => {
    if(req.user.balance > 1e9) {
        res.end(`You are soo lucky, here is your flag: ${process.env.FLAG ?? "justCTF{fake-flag}"}`)
    } else {
        res.end("You need at least $ 1000000000 to reveal flag")
    }
})


app.get("/revealServerSeed", (req, res) => {
    let revealedServerSeed = req.user.serverSeed;
    req.user.serverSeed = crypto.randomBytes(32).toString("hex");
    req.user.nonce = 0;
    res.json({
        revealedServerSeed,
        newServerSeedHash : crypto.createHash("sha256").update(req.user.serverSeed).digest("hex")
    })
})

app.post("/bet", (req, res) => {
    let { clientSeed, guess, bet } = req.body;

    if (typeof clientSeed != "string" || clientSeed.length != 64) {
        res.json({ "error": "Invalid client seed!" })
        return
    }

    const validGuesses = ["1", "2", "3", "4", "5", "6"]
    if (typeof guess != "string" || !validGuesses.includes(guess)) {
        res.json({ "error": "Invalid guess!" })
        return
    }

    bet = parseInt(bet);
    if (!Number.isInteger(bet) || bet < 1 || bet > req.user.balance) {
        res.json({ "error": "Invalid bet!" })
        return
    }

    let roll = (seedrandom(JSON.stringify({
        serverSeed: req.user.serverSeed,
        clientSeed,
        nonce: req.user.nonce++
    })).int32() >>> 0) % 6 + 1

    if(guess == roll) {
        req.user.balance += 2 * bet;
    } else {
        req.user.balance -= bet;
    }

    res.json({
        roll,
        balance: req.user.balance,
        nonce: req.user.nonce
    })
});

app.listen(3000)