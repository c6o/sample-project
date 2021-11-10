import express from 'express'
import http from 'http'
import WebSocket from 'ws'
import { v4 as uuidv4 } from 'uuid'

const commMessages = {
    helloPrompt: 'Hello, you sent ->',
    broadcastHelloPrompt: 'Hello, broadcast message ->',
    pingHelloPrompt: 'PING! #',
    serverStartup: 'Hi there, I am a WebSocket server',
}
const pingInterval = process.env.SP_PING_INTERVAL || 5000
const failInterval = process.env.SP_PING_FAIL_INTERVAL || 10000
const port = 8999

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })
const userMessages = []
const count = []

wss.on('connection', (ws) => {

    ws.isAlive = true
    ws.id = uuidv4()
    userMessages[ws.id] = ''
    count[ws.id] = 0

    ws.on('error', () => console.log('Cannot start server'))

    ws.on('message', (message) => {
        // console.log(`received: ${message}`)

        // Check to see if this is a message to
        // be broadcasted to all clients
        const broadcastRegex = /^broadcast\:/
        if (broadcastRegex.test(message)) {
            message = message.replace(broadcastRegex, '')

            //send back the message to the other clients
            for(const client of wss.clients) {
                if (client != ws) {
                    userMessages[client.id] = message
                    client.send(`${commMessages.broadcastHelloPrompt} ${message}`)
                }
            }

        } else {
            userMessages[ws.id] = message
            ws.send(`${commMessages.helloPrompt} ${message}`)
        }
    })

    ws.on('close', (code, message) => {
        //console.log(`Disconnection from ${ws.id}: ${code} ${message}`)
        clearInterval(ws.timer)
    })

    ws.on('pong', () => {
        //console.log(`pong: ${ws.id}`)
        ws.isAlive = true
        clearInterval(ws.timerPingPong)
    })

    ws.send(commMessages.serverStartup)

    ws.timer = setInterval(pingpong, parseInt(pingInterval), ws)
    return ws
})

const pingpongclose = (ws) => {
    //console.log(`Failed to ping-pong ${ws.id}`)
    // clearInterval(ws.timer)
    clearInterval(ws.timerPingPong)
    ws.isAlive = false
}

const pingpong = (ws) => {
    if (ws?.id) {
        // console.log(`ping: ${ws.id}`)
        ws.timerPingPong = setInterval(pingpongclose, failInterval, ws)
        ws.ping('coucou', false, 'utf8')
        ws.send(`${commMessages.pingHelloPrompt}${count[ws.id]++}. Previous message sent-> ${userMessages[ws.id]}`)
    } else {
        console.log('Web socket is undefined?', ws)
    }
}

server.listen(port, () => {
    const address = server.address()
    console.log(`Server started on port ${typeof address === 'string' ? address : address.port}`)
})