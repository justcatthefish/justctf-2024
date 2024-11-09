import net from 'net'
import { runningDockers } from './instancer.js';

net.createServer(socket => {
    var handshake = true;
    var client;
    
    socket.on('data', data => {
        if(handshake) {
            handshake = false;
            var packet = data.toString();
            if(!packet.match(/([0-9a-f]{16})\.minecraft-pumpkin\.nc\.jctf\.pro/)) return socket.end()
            var id = packet.match(/([0-9a-f]{16})\.minecraft-pumpkin\.nc\.jctf\.pro/)[1]
            if(!runningDockers[id]) return socket.end()

            client = net.createConnection(25565, id, () => {
                client.on('data', data => {
                    socket.write(data)
                })
                client.on('end', () => {
                    socket.end()
                })
            })
        }
        if(client) {
            client.write(data)
        }
    })

    socket.on('end', () => {
        if(client) client.end()
    })
}).listen(25565)