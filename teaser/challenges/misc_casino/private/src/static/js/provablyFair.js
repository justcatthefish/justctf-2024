function generateClientSeed() {
    return [...crypto.getRandomValues(new Uint8Array(32))].map(a=>a.toString(16).padStart(2, 0)).join("")
}

document.addEventListener("DOMContentLoaded", () => {

    clientSeed.innerText = localStorage.clientSeed ?? generateClientSeed()
    localStorage.clientSeed = clientSeed.innerText

    revealServerSeed.addEventListener("click", () => {
        fetch("/revealServerSeed", {
        }).then(a=>a.json()).then(response => {
            if(response.error) {
                alert(response.error)
                return;
            }
            
            result.innerHTML = `
            <p style="font-family: monospace;">Your past SERVER_SEED_HASH = "${serverSeedHash.innerText}"</p>
            <p style="font-family: monospace;">Your past SERVER_SEED = "${response.revealedServerSeed}"</p>
            `
            serverSeedHash.innerText = response.newServerSeedHash
            nonce.innerText = 0

        })
    })
    
})
