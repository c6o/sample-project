const express = require('express')
const app = express()
const cors = require('cors')
const http = require('http')

// To route to Echo Server: Same namespace: servicename:port, Different namespace: servicename.namespace:port
const echoURL = process.env.ECHO_CONNECTION || 'http://localhost:8000'
const mongoURL = process.env.DATABASE_CONNECTION || 'mongodb://localhost:27017'
const mongoDB = new URL(mongoURL)

const MongoClient = require('mongodb').MongoClient
    , Server = require('mongodb').Server;

const mongoClient = new MongoClient(new Server(mongoDB.hostname, mongoDB.port));

app.use(cors({
    origin: '*'
}))

let mongodbState = 'Not connected to the Halyard database yet'

mongoClient.connect((error) => {
    if (error) {
        mongodbState = 'Bummer - unable to connected to the Halyard database: ' + mongoURL
        console.log(mongodbState)
        console.log(error)
        mongodbState = `${mongodbState}, Connect Error: ${error.message}`
    } else {
        mongodbState = 'Yay - connected to the Halyard database! ' + mongoURL
    }
    mongoClient.close()
})

app.get('/api', (req, res) => {

    let retVal = ''
    http.get(echoURL, (resp) => {
        let data = ''
        // A chunk of data has been received.
        resp.on('data', (chunk) => {
            data += chunk
        })
        // The whole response has been received. Print out the result.
        resp.on('end', () => {
            retVal = `${mongodbState}</br></br> Echo Service Response: ${
                data.replace(/[\n\r]/g,'</br>')
            }`
            res.send({
                'data': retVal
            })
        })
    }).on("error", (err) => {
        retVal = `${mongodbState}</br></br> Echo Service Error: ${err.message}`
        res.send({
            'data': retVal
        })
    })

})

app.listen(3000, function () {
    console.log('listening on 3000')
})

module.exports = app  // Exported for unit testing.
