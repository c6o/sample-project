import express from 'express'
import cors from 'cors'

const port = 3010

// This is here to demo intercept
// Intercept this service and replace this message
// when running locally
const where = 'cluster'

// Set up the express app and handle the /api endpoint
const app = express()
app.use(cors({ origin: '*'}))
app.get('/api', async (req, res) => {
    const { method, headers } = req
    res.send({
        who: 'edge',
        where,
        // Helpful for diagnostic
        // method,
        // headers
    })
})

// Start the server
app.listen(port, () => {
    console.log(`Edge API ${where} listening on http://localhost:${port}`)
})