jest.mock('express', () => {
    const listenMock = jest.fn()
    return () => {
        return {
            use: jest.fn(),
            get: jest.fn(),
            listen: listenMock,
        }
    }
})

jest.mock('http', () => {
    const getMock = jest.fn().mockReturnValue({
        on: jest.fn(),
    })
    const createServerMock = jest.fn().mockReturnValue({
        get: getMock,
        listen: jest.fn(),
        address: jest.fn().mockReturnValueOnce('9888')
            .mockReturnValue({ port: 8999 } ),
    })
    return ({
        createServer: createServerMock,
        get: getMock, // make this available to the test for a spy.
    })
})

jest.mock('ws', () => {
    const serverMock = {
        on: jest.fn(),
        clients: []
    }
    return {
        Server: function () {
            return serverMock
        },
        serverMock
    }
})
jest.useFakeTimers()
jest.spyOn(global, 'setTimeout');
jest.spyOn(global, 'clearInterval');
jest.spyOn(global, 'setInterval');

const http = require('http')
const WebSocket = require('ws')

const { app, server, wss, pingpong, pingpongclose, commMessages, pingInterval, pingpongIntervalFail } = require('./server')
const serverModule = require('./server')

describe('Halyard Sockets: server.js', () => {
    const SOME_ID = '1'
    const ANOTHER_ID = '2'
    const originalLog = console.log
    const testLog = jest.fn()
    beforeAll(() => {
        spyOn(console, 'log')
        console.log = testLog
    })
    beforeEach(() => {

    })

    afterAll(() => (console.log = originalLog))

    test('Server Starts on load.', () => {
        expect(http.createServer).toBeCalled()

        // wss.on
        expect(WebSocket.serverMock.on).toBeCalledWith('connection', expect.any(Function))
        const connectionCallback = WebSocket.serverMock.on.mock.calls[0][1]

        const SOME_CODE = 'code'
        const SOME_MESSAGE = 'message'
        const ANOTHER_MESSAGE = 'message 2'
        const BROADCAST_MESSAGE = `broadcast:${ANOTHER_MESSAGE}`

        const SOME_WS = {
            id: ANOTHER_ID,
            ping: jest.fn(),
            send: jest.fn(),
            on: jest.fn(),
            timer: jest.fn(),
            timerPingPong: jest.fn(),
        }
        const ANOTHER_WS = {
            id: SOME_ID,
            send: jest.fn(),
        }
        wss.clients.push(SOME_WS)
        wss.clients.push(ANOTHER_WS)
        const ws = connectionCallback(SOME_WS)

        expect(ws.send).toBeCalledWith(commMessages.serverStartup)
        expect(setInterval).toBeCalledWith(pingpong, pingInterval, SOME_WS)

        expect(ws.on).toHaveBeenNthCalledWith(1, 'error', expect.any(Function))
        const errorCallback = ws.on.mock.calls[0][1]
        errorCallback()
        expect(console.log).toBeCalledWith('Cannot start server')

        expect(ws.on).toHaveBeenNthCalledWith(2, 'message', expect.any(Function))
        const messageCallback = ws.on.mock.calls[1][1]
        messageCallback(SOME_MESSAGE)
        expect(console.log).toBeCalledWith(`received: ${SOME_MESSAGE}`)
        expect(SOME_WS.send).toBeCalledWith(`${commMessages.helloPrompt} ${SOME_MESSAGE}`)

        messageCallback(BROADCAST_MESSAGE)
        expect(console.log).toBeCalledWith(`received: ${BROADCAST_MESSAGE}`)
        expect(ANOTHER_WS.send).toBeCalledWith(`${commMessages.broadcastHelloPrompt} ${ANOTHER_MESSAGE}`)
        expect(SOME_WS.send).not.toBeCalledWith(`${commMessages.broadcastHelloPrompt} ${ANOTHER_MESSAGE}`)


        expect(ws.on).toHaveBeenNthCalledWith(3, 'close', expect.any(Function))
        const closeCallback = ws.on.mock.calls[2][1]

        closeCallback(SOME_CODE, SOME_MESSAGE)
        expect(console.log).toBeCalledWith(`Disconnection from ${SOME_WS.id}: ${SOME_CODE} ${SOME_MESSAGE}`)
        expect(clearInterval).toHaveBeenNthCalledWith(1, SOME_WS.timer)

        expect(ws.on).toHaveBeenNthCalledWith(4, 'pong', expect.any(Function))
        const pongCallback = ws.on.mock.calls[3][1]
        pongCallback()
        expect(console.log).toBeCalledWith(`pong: ${SOME_WS.id}`)
        expect(SOME_WS.isAlive).toBe(true)
        expect(clearInterval).toBeCalledWith(SOME_WS.timerPingPong)

        // server.listen
        expect(server.listen).toBeCalledWith(8999, expect.any(Function))
        const listenrCallback = server.listen.mock.calls[0][1]
        listenrCallback()
        expect(console.log).toBeCalledWith(`Server started on port 9888 :)`)
        expect(server.address).toBeCalled()
        listenrCallback()
        expect(console.log).toBeCalledWith(`Server started on port 8999 :)`)
        expect(server.address).toBeCalled()
    })

    test('pingpongclose', () => {
        const SOME_WS = {
            id: SOME_ID,
            ping: jest.fn(),
            send: jest.fn(),
        }
        pingpongclose(SOME_WS)
        expect(console.log).toBeCalledWith(`Failed to ping-pong 1`)
    })

    test('pingpong', () => {
        jest.clearAllMocks()
        jest.clearAllTimers()
        const BOGUS_WS = {}
        pingpong(BOGUS_WS)
        expect(console.log).toBeCalledWith('Web socket is undefined?', BOGUS_WS)
        const SOME_WS = {
            id: ANOTHER_ID,
            ping: jest.fn(),
            send: jest.fn(),
        }
        pingpong(SOME_WS)
        expect(console.log).toBeCalledWith('ping: ' + ANOTHER_ID)
        expect(SOME_WS.timerPingPong).toBeDefined()
        expect(SOME_WS.ping).toBeCalledWith('coucou', false, 'utf8')
        expect(SOME_WS.send).toBeCalledWith(
            `${commMessages.pingHelloPrompt}${NaN}. Previous message sent-> ${undefined}`)

        expect(setInterval).toHaveBeenCalledTimes(1)

        expect(console.log).not.toBeCalledWith("Failed to ping-pong " + ANOTHER_ID)
        jest.advanceTimersByTime(pingpongIntervalFail + 1)
        expect(console.log).toBeCalledWith("Failed to ping-pong " + ANOTHER_ID)
    })

})