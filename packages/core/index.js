import express from 'express'
import cors from 'cors'
import { mongoResult } from './mongo.js'
import { leafResult } from './leaf.js'
import { fileResult } from './file.js'

const port = 3000

// This is here to demo intercept
// Intercept this service and replace this message
// when running locally
const where = 'cluster'

// Set up the express app and handle the /api endpoint
const app = express()
app.use(cors({ origin: '*' }))
app.get('/api', async (req, res) => {
    const { method, headers } = req
    res.send({
        who: 'core',
        where,
        ...await mongoResult(),
        ...await leafResult(headers),
        ...await fileResult()
        // Helpful for diagnostic
        // method,
        // headers
    })
})

// Start the server
app.listen(port, () => {
    console.log(`Core API ${where} listening on http://localhost:${port}`)
})