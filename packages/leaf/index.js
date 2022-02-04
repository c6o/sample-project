import express from 'express'
import cors from 'cors'
import * as os from 'os'

const port = 3010

// This is here to demo intercept
// Intercept this service and replace this message
// when running locally
const where = os.hostname() || 'local'

// Set up the express app and handle the /api endpoint
const app = express()
app.use(cors({ origin: '*' }))
app.get('/api', async (req, res) => {
    const { method, headers } = req
    res.send({
        who: 'leaf',
        where,
        // Helpful for diagnostic
        // method,
        // headers
    })
})

// Start the server
app.listen(port, () => {
    console.log(`Leaf API ${where} listening on http://localhost:${port}`)
})