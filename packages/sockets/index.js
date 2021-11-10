import express from 'express'
import http from 'http'
import WebSocket from 'ws'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime.js'
import { v4 as uuidv4 } from 'uuid'

dayjs.extend(relativeTime)

// Prompts. You can intercept this service and change these
const ackPrompt = 'Received: '
const broadcastSentPrompt = (m, c) => `You sent "${m} to ${c} people!`
const broadcastReceivedPrompt = 'You received a broadcast message ->'
const startupPrompt =  'Hi there, I am a WebSocket server. Send me something!'
const desperatePleas = [
    'Are you alive?',
    'Would love to hear from you soon.',
    'You don\'t come around here no more.',
    'Was it something I said?',
    'It\'s not me it\'s you.',
    'On second thoughts, it\'s probably me.',
    'Hey now, hey now don\'t dream it\'s over.',
    'Fine. Be that way.',
    'I really just need to work on myself don\'t I.',
    'It seems we\'re just on two different paths right now.',
    'You\'ve lost that friendly feeling.',
    'If you love something let it go - I can\'t seem to do that'
]

const pesterInterval = process.env.SP_SOCKET_INTERVAL || 5000
const port = 8999

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

wss.on('connection', (client) => {

    client.isAlive = true
    client.id = uuidv4()
    client.lastMessageTime = new Date()

    client.on('error', () => console.log('Cannot start server'))

    client.on('message', (message) => {
        client.lastMessageTime = new Date()
        client.lastMessage = message

        // Check to see if this is a message to
        // be broadcasted to all clients
        const broadcastRegex = /^broadcast\:/
        if (broadcastRegex.test(message)) {
            // Strip out the broadcast part or it's CHAOS
            // Sheer chaos I tell you!
            message = message.replace(broadcastRegex, '')

            // Broadcast the message to the other clients
            for(const client of wss.clients) {
                if (client != client)
                    client.send(`${broadcastReceivedPrompt} ${message}`)
            }

            client.send(broadcastSentPrompt(message, wss.clients.size - 1))
        }
        else
            client.send(`${ackPrompt} ${message}`)
    })

    // Stop pestering on close
    client.on('close', (code, message) => clearInterval(client.timer))

    client.send(startupPrompt)
    client.timer = setInterval(pester, parseInt(pesterInterval), client)
    return client
})

const pester = (client) => {
    if (client?.id) {
        const since = dayjs().to(client.lastMessageTime)
        const randomPlea = desperatePleas[Math.floor(Math.random() * desperatePleas.length)]

        if (client.lastMessage)
            client.send(`Your last message ${since} was: ${client.lastMessage}. ${randomPlea}`)
        else
            client.send(`I've been waiting to hear from you since ${since}. ${randomPlea}`)

    } else {
        console.log('Web socket is undefined?', client)
    }
}

server.listen(port, () => {
    const address = server.address()
    console.log(`Server started on port ${typeof address === 'string' ? address : address.port}`)
})