const express = require('express')
const http = require('http')
const WebSocket = require('ws')
const {v4: uuidv4} = require('uuid')
const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({server})
const userMessages = {}
const count = {}
const commMessages = {
    helloPrompt: 'Hello, you sent ->',
    broadcastHelloPrompt: 'Hello, broadcast message ->',
    pingHelloPrompt: 'PING! #',
    serverStartup: 'Hi there, I am a WebSocket server',
}
const pingInterval = process.env.HALYARD_PING_INTERVAL || 5000
const pingpongIntervalFail = process.env.HALYARD_PINGPONGFAIL_INTERVAL || 10000
const socketsPort = process.env.HALYARD_SOCKETS_PORT || 8999

wss.on('connection', (ws) => {

    ws.isAlive = true
    ws.id = `${uuidv4()}`
    userMessages[ws.id] = ''
    count[ws.id] = 0

    ws.on('error', function (error) {
        console.log('Cannot start server')
    })

    ws.on('message', (message) => {

        //log the received message and send it back to the client
        console.log(`received: ${message}`)

        const broadcastRegex = /^broadcast\:/
        if (broadcastRegex.test(message)) {
            message = message.replace(broadcastRegex, '')

            //send back the message to the other clients
            wss.clients
                .forEach(client => {
                    if (client != ws) {
                        userMessages[client.id] = message
                        client.send(`${commMessages.broadcastHelloPrompt} ${message}`)
                    }
                })

        } else {
            userMessages[ws.id] = message
            ws.send(`${commMessages.helloPrompt} ${message}`)
        }
    })

    ws.on('close', function (code, message) {
        console.log(`Disconnection from ${ws.id}: ${code} ${message}`)
        clearInterval(ws.timer)
    })

    ws.on('pong', () => {
        console.log(`pong: ${ws.id}`)
        ws.isAlive = true
        clearInterval(ws.timerPingPong)
    })

    ws.send(commMessages.serverStartup)

    ws.timer = setInterval(pingpong, parseInt(pingInterval), ws)
    return ws
})

const pingpongclose = (ws) => {
    console.log(`Failed to ping-pong ${ws.id}`)
    // clearInterval(ws.timer)
    clearInterval(ws.timerPingPong)
    ws.isAlive = false
}

const pingpong = (ws) => {
    if (ws?.id) {
        console.log(`ping: ${ws.id}`)
        ws.timerPingPong = setInterval(pingpongclose, pingpongIntervalFail, ws)
        ws.ping('coucou', false, 'utf8')
        ws.send(`${commMessages.pingHelloPrompt}${count[ws.id]++}. Previous message sent-> ${userMessages[ws.id]}`)
    } else {
        console.log('Web socket is undefined?', ws)
    }
}

server.listen(socketsPort, () => {
    const address = server.address()
    console.log(`Server started on port ${typeof address === 'string' ? address : address.port} :)`)
})

// export for unit tests.
module.exports = {app, server, wss, pingpong, pingpongclose, commMessages, pingInterval, pingpongIntervalFail}
