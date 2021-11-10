import express from 'express'
import http from 'http'
import WebSocket from 'ws'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime.js'
import { v4 as uuidv4 } from 'uuid'

dayjs.extend(relativeTime)

// Prompts. You can intercept this service and change these
const ackPrompt = 'Received: '
const broadcastHelloPrompt = 'Hello, broadcast message ->'
const startupPrompt =  'Hi there, I am a WebSocket server. Send me something!'

const pingInterval = process.env.SP_PING_INTERVAL || 5000
const failInterval = process.env.SP_PING_FAIL_INTERVAL || 10000
const port = 8999

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

wss.on('connection', (ws) => {

    ws.isAlive = true
    ws.id = uuidv4()
    ws.lastMessageTime = new Date()

    ws.on('error', () => console.log('Cannot start server'))

    ws.on('message', (message) => {
        ws.lastMessageTime = new Date()
        ws.lastMessage = message
        ws.send(`${ackPrompt} ${message}`)

        // Check to see if this is a message to
        // be broadcasted to all clients
        const broadcastRegex = /^broadcast\:/
        if (broadcastRegex.test(message)) {
            // Strip out the broadcast part or it's CHAOS
            // Sheer chaos I tell you!
            message = message.replace(broadcastRegex, '')

            // Broadcast the message to the other clients
            for(const client of wss.clients) {
                if (client != ws)
                    client.send(`${broadcastHelloPrompt} ${message}`)
            }
        }
    })

    // Stop pestering on close
    ws.on('close', (code, message) => clearInterval(ws.timer))

    ws.on('pong', () => {
        //console.log(`pong: ${ws.id}`)
        ws.isAlive = true
        clearInterval(ws.timerPingPong)
    })

    ws.send(startupPrompt)

    ws.timer = setInterval(pingpong, parseInt(pingInterval), ws)
    return ws
})

const pingpongclose = (ws) => {
    clearInterval(ws.timerPingPong)
    ws.isAlive = false
}

const pingpong = (ws) => {
    if (ws?.id) {
        ws.timerPingPong = setInterval(pingpongclose, failInterval, ws)
        ws.ping('coucou', false, 'utf8')

        const since = dayjs().to(ws.lastMessageTime)
        if (ws.lastMessage)
            ws.send(`Your last message ${since} was: ${ws.lastMessage}`)
        else
            ws.send(`I've been waiting to hear from you since ${since}`)

    } else {
        console.log('Web socket is undefined?', ws)
    }
}

server.listen(port, () => {
    const address = server.address()
    console.log(`Server started on port ${typeof address === 'string' ? address : address.port}`)
})