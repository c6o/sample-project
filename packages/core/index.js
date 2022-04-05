import express from 'express'
import cors from 'cors'
import * as os from 'os'
import { mongoResult } from './mongo.js'
import { leafResult } from './leaf.js'
import { fileResult } from './file.js'

// When intercepting sample-project-core and running the service locally
// this port needs to match what is set for `localPort` in your intercept command (or dev profile)
const port = 3000

// This is here to demo intercept.
// Intercept this service and replace the 'where' string
// when running locally
const where = os.hostname() || 'local'

// Set up the express app and handle the /api endpoint
const app = express()

// Enable All CORS Requests
// https://github.com/expressjs/cors
app.use(cors())

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
    console.log(`Sample Project Core API [${where}] listening on http://localhost:${port}`)
})