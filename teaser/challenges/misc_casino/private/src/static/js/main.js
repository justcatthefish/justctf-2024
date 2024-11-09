fetch("/info").then(a=>a.json()).then(result =>{
    if(result.error) {
        window.location = "/"
        return;
    }
    balance.innerText = `Balance: $ ${result.balance}`
    username.innerText = `Welcome ${result.username},`
    nonce.innerText = result.nonce
    serverSeedHash.innerText = result.serverSeedHash
})