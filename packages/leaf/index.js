import express from 'express'
import cors from 'cors'
import * as fs from 'fs'
import * as https from 'https'
import * as os from 'os'

const port = 3010
const httpsPort = 3443

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

const options = {
    key: fs.readFileSync("/etc/nginx/ssl/tls.key"),
    cert: fs.readFileSync("/etc/nginx/ssl/tls.crt")
}

https.createServer(options, app).listen(httpsPort, () => {
    console.log(`Leaf API ${where} secure listening on http://localhost:${httpsPort}`)
})