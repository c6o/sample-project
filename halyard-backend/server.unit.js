jest.mock('express', () => {
    return () => {
        return {
            use: jest.fn(),
            get: jest.fn(),
            listen: jest.fn(),
        }
    }
})

jest.mock('mongoose', () => {
    return {
        connect: jest.fn().mockResolvedValueOnce()
    }
})
jest.mock('cors', () => jest.fn())
const cors = require('cors')
const mongoose = require('mongoose')

describe('server.js', () => {
    beforeAll(() => {
        spyOn(console, 'log')
    })
    process.env.DATABASE_CONNECTION = 'some connection string'

    test('app creation', () => {
        const app = require('./server')
        expect(app.use).toBeCalled()
        expect(mongoose.connect).toBeCalledWith(process.env.DATABASE_CONNECTION,
            { useNewUrlParser: true })
        expect(app.get).toBeCalledWith('/api', expect.any(Function))
        expect(app.listen).toBeCalledWith(3000, expect.any(Function))
        expect(cors).toBeCalledWith({ origin: '*' })
    })
})
