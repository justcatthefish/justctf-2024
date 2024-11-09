function generateClientSeed() {
    return [...crypto.getRandomValues(new Uint8Array(32))].map(a=>a.toString(16).padStart(2, 0)).join("")
}

document.addEventListener("DOMContentLoaded", () => {
    randomizeSeed.addEventListener("click", () => {
        clientSeed.value = generateClientSeed()
        localStorage.clientSeed = clientSeed.value
        
    })
    
    clientSeed.value = localStorage.clientSeed ?? generateClientSeed()
    localStorage.clientSeed = clientSeed.value

    play.addEventListener("click", () => {
        fetch("/bet", {
            method: "POST",
            body: new URLSearchParams({
                bet: bet.value,
                guess: guess.value,
                clientSeed: clientSeed.value
            })
        }).then(a=>a.json()).then(response => {
            if(response.error) {
                alert(response.error)
                return;
            }
            nonce.innerText = response.nonce
            result.innerText = `Roll result: ${response.roll}`
            balance.innerText = `Balance: $ ${response.balance}`

        })
    })
    
})
