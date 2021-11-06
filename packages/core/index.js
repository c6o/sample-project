import express from 'express'
import axios from 'axios'
import cors from 'cors'
import mongoPkg from 'mongodb'
const { MongoClient } = mongoPkg

// These are overridden when running in cluster
const mongoURL = process.env.SP_DATABASE || 'mongodb://localhost:27017'
const edgeURL = process.env.SP_EDGE || 'http://localhost:3010'
const port = process.env.SP_CORE_API_PORT || 3000

// This is here to demo intercept
// Intercept this service and replace this message
const where = 'cluster'

// Attempt to connect to mongodb and return success or error
const mongoResult = async () => {
    let result = { url: mongoURL }
    try {
        await MongoClient.connect(mongoURL, { useNewUrlParser: true })
        result.success = true
    }
    catch (error) {
        result.error = error.name
    }

    return { mongo: result }
}

// In order for intercept to work, headers need to
// be propagated to upstream requests
// In this case, we only propagate headers that start
// with x-c6o but you should use your own convention
const propagateHeaders = (headers) =>
    Object.keys(headers)
    .filter(key => key.startsWith('x-c6o-'))
    .reduce((obj, key) => {
        obj[key] = headers[key]
        return obj
      }, {})

// Calls the edge service and obtains headers
const edgeResult = async (inHeaders) => {
    try {
        const headers = propagateHeaders(inHeaders)
        const url = `${edgeURL}/api`
        const result = await axios({
            url,
            headers
        })
        return { edge: { url, data: result.data, 'propagated-headers': headers } }
    }
    catch (error) {
        return { edge: { error: error.message } }
    }
}

// Set up the express app and handle the /api endpoint
const app = express()
app.use(cors({ origin: '*' }))
app.get('/api', async (req, res) => {
    const { method, headers } = req
    res.send({
        who: 'core',
        where,
        ...await mongoResult(),
        ...await edgeResult(headers)
        // Helpful for diagnostic
        // method,
        // headers
    })
})

// Start the server
app.listen(port, () => {
    console.log(`Core API ${where} listening on http://localhost:${port}`)
})