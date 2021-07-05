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

jest.mock('mongodb', () => {
    const connectMock = jest.fn().mockImplementation((callback) => callback(null))
    const closeMock = jest.fn()
    return {
        MongoClient: jest.fn().mockReturnValue({
            connect: connectMock,
            close: closeMock,
        }),
        Server: jest.fn().mockImplementation(() => ({})),
        connectMock,
        closeMock,
    }
})
jest.mock('cors', () => jest.fn())
jest.mock('http', () => {
    const getOnMock = jest.fn()
    const getMock = jest.fn().mockReturnValue({
        on: getOnMock
    })
    const createServerMock = jest.fn().mockReturnValue({
        get: getMock,
    })
    return ({
        createServer: createServerMock,
        get: getMock, // make this available to the test for a spy.
        getOnMock,
    })
})
const http = require('http')

const cors = require('cors')
const {MongoClient, Server, connectMock, closeMock } = require('mongodb')
const { app, databaseConnectCallback, getHandler, serviceHandler, echoURL, version, mongoURL } = require('./server')

describe('Halyard Backend: server.js', () => {
    const originalLog = console.log
    const testLog = jest.fn()
    beforeAll(() => {
        spyOn(console, 'log')
        console.log = testLog
    })

    afterAll(() => (console.log = originalLog))

    const SOME_ERROR = {
        message: 'error'
    }
    const SOME_HOSTNAME = 'localhost'
    const SOME_PORT = '27017'
    process.env.HALYARD_DATABASE = `mongodb://${SOME_HOSTNAME}:${SOME_PORT}`

    test('Server Starts on load.', () => {
        expect(app.use).toBeCalled()
        expect(Server).toBeCalledWith(SOME_HOSTNAME, SOME_PORT)
        expect(MongoClient).toBeCalled()
        expect(connectMock).toBeCalledWith(expect.any(Function))
        expect(closeMock).toBeCalledWith()

        expect(app.get).toBeCalledWith('/api', expect.any(Function))
        // expect(app.listen).toBeCalledWith(3000, 'localhost', expect.any(Function))
        expect(app.listen).toBeCalledWith(3000, expect.any(Function))
        expect(cors).toBeCalledWith({origin: '*'})
    })

    test('databaseConnectCallback', () => {
        const mongodbState1 = databaseConnectCallback(null)
        expect(mongodbState1).toEqual(`Yay - connected to the Halyard database! mongodb://${SOME_HOSTNAME}:${SOME_PORT}`)
        expect(connectMock).toBeCalledWith(expect.any(Function))

        const mongodbState2 = databaseConnectCallback(SOME_ERROR)
        expect(mongodbState2).toEqual(`Bummer - unable to connected to the Halyard database: mongodb://` +
        `${SOME_HOSTNAME}:${SOME_PORT}, Connect Error: ${SOME_ERROR.message}`)
    })

    test('getHandler', () => {
        const SOME_REQUEST = {}
        const response = {
            send: jest.fn(),
            writeHead: jest.fn(),
            write: jest.fn(),
            end: jest.fn()
        }
        const {readHandler, readErrorHandler} = getHandler(SOME_REQUEST, response)
        expect(http.get).toBeCalledWith(echoURL, readHandler)
        expect(http.getOnMock).toBeCalledWith('error', readErrorHandler)

        readErrorHandler(SOME_ERROR)
        expect(response.send).toBeCalledWith(
            {
                'data': `${version} </br></br> ${'Bummer - unable to connected to the Halyard database: ' + mongoURL + ', Connect Error: error'}</br></br> Echo Service Error: ${SOME_ERROR.message}`
            })

        const SOME_RESPONSE = {
            on: jest.fn(),
        }
        readHandler(SOME_RESPONSE)
        expect(SOME_RESPONSE.on).toHaveBeenNthCalledWith(1, 'data', expect.any(Function))
        const onDataCallback = SOME_RESPONSE.on.mock.calls[0][1]

        expect(SOME_RESPONSE.on).toHaveBeenNthCalledWith(2, 'end', expect.any(Function))
        const onEndCallback = SOME_RESPONSE.on.mock.calls[1][1]
        const SOME_CHUNK_1 = 'chunk-1'+'\n\r'
        const SOME_CHUNK_2 = 'chunk-2'
        onDataCallback(SOME_CHUNK_1)
        onDataCallback(SOME_CHUNK_2)
        onEndCallback()
        const data = SOME_CHUNK_1+SOME_CHUNK_2
        expect(response.send).toBeCalledWith({data: `${version} </br></br>${'Bummer - unable to connected to the Halyard database: ' + mongoURL + ', Connect Error: error'} </br></br> Echo Service Response: ${
                data.replace(/[\n\r]/g,'</br>')
            }`})

    })

    test('serviceHandler', () => {
        serviceHandler()
        expect(console.log).toHaveBeenNthCalledWith(1,
            `Bummer - unable to connected to the Halyard database: mongodb://${SOME_HOSTNAME}:${SOME_PORT}`)
        expect(console.log).toHaveBeenNthCalledWith(2, SOME_ERROR)
        // expect(console.log).toHaveBeenNthCalledWith(3, 'listening on 3000')
    })
})
