jest.mock('express', () => {
    const listenMock = jest.fn()
    return () => {
        return {
            use: jest.fn(),
            get: jest.fn(),
            post: jest.fn(),
            put: jest.fn(),
            delete: jest.fn(),
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
const { MongoClient, Server, connectMock, closeMock } = require('mongodb')
const { app, databaseConnectCallback, pingHandler, sailsHandler, getHandler,
    serviceHandler, echoURL, version, mongoURL, postgresConnection } = require('./server')

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
    const ANOTHER_PORT = '3000'
    process.env.HALYARD_DATABASE = `mongodb://${SOME_HOSTNAME}:${SOME_PORT}`
    process.env.HALYARD_API_PORT = ANOTHER_PORT

    test.skip('Server Starts on load.', () => {
        expect(app.use).toBeCalled()
        expect(Server).toBeCalledWith(SOME_HOSTNAME, SOME_PORT)
        expect(MongoClient).toBeCalled()
        // expect(connectMock).toBeCalledWith(expect.any(Function))
        expect(closeMock).toBeCalledWith()

        expect(app.get).toBeCalledWith('/api', expect.any(Function))
        // expect(app.listen).toBeCalledWith(3000, 'localhost', expect.any(Function))
        expect(app.listen).toBeCalledWith('3000', expect.any(Function))
        expect(cors).toBeCalledWith({origin: '*'})
    })

    test.skip('databaseConnectCallback', () => {
        const mongodbState1 = databaseConnectCallback(null)
        expect(mongodbState1).toEqual(`Yay - connected to the Halyard INTERNAL database! mongodb://${SOME_HOSTNAME}:${SOME_PORT}`)
        // expect(connectMock).toBeCalledWith(expect.any(Function))

        const mongodbState2 = databaseConnectCallback(SOME_ERROR)
        expect(mongodbState2).toEqual(`Bummer - unable to connected to the Halyard database: mongodb://` +
        `${SOME_HOSTNAME}:${SOME_PORT}, Connect Error: ${SOME_ERROR.message}.`)
    })

    test.skip('getHandler', () => {
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
                'data': `${version} </br></br> ${
                    'Yay - connected to the Halyard INTERNAL database! ' + 
                    mongoURL} </br></br> ${
                    'Not connected to the Halyard EXTERNAL database yet root:Macro7!@halyard-headless-ext-postgres:5432/postgres '
                }</br></br> Echo Service Error: error`
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
        expect(response.send).toHaveBeenNthCalledWith(1,
            {data: `${version} </br></br> ${
                'Yay - connected to the Halyard INTERNAL database! ' + 
                mongoURL } </br></br> ${
                'Not connected to the Halyard EXTERNAL database yet root:Macro7!@halyard-headless-ext-postgres:5432/postgres'
            } </br></br> Echo Service Error: error`})

    })

    test('serviceHandler', () => {
        jest.resetAllMocks()
        serviceHandler()
        expect(console.log).toHaveBeenNthCalledWith(1, "listening on "+ANOTHER_PORT)
        expect(console.log).toHaveBeenNthCalledWith(2, "version ", "Version 1.1")
    })

    test('pingHandler', () => {
        const SOME_REQUEST = {}
        const response = {
            send: jest.fn(),
        }
        pingHandler(SOME_REQUEST, response)
        expect(response.send).toBeCalledWith({
            'data': `Halyard-Backend: ${version}`
        })
    })

    test('sailsHandler down', () => {
        const SOME_REQUEST = {}
        const response = {
            send: jest.fn(),
        }
        sailsHandler(SOME_REQUEST, response)
        expect(response.send).toBeCalledWith('down')
    })
    test('sailsHandler up', () => {
        jest.resetModules()
        const SOME_REQUEST = {}
        const response = {
            send: jest.fn(),
        }
        process.env.HALYARD_VERSION = '2'
        const { sailsHandler } = require('./server')

        sailsHandler(SOME_REQUEST, response)
        expect(response.send).toBeCalledWith('up')
    })
})
