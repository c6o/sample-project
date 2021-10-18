const express = require('express')
const cors = require('cors')
const http = require('http')
const { MongoClient, Server } = require('mongodb')

// To route to Echo Server: Same namespace: servicename:port, Different namespace: servicename.namespace:port
const echoURL = process.env.SAMPLE_PROJECT_ECHO || 'http://localhost:8000'
const mongoURL = process.env.SAMPLE_PROJECT_DATABASE || 'mongodb://localhost:27017'
const serverAPIPort = process.env.SAMPLE_PROJECT_API_PORT || 3000
const serverAPIHost = process.env.SAMPLE_PROJECT_API_HOST || 'localhost'
const mongoDB = new URL(mongoURL)
const version = process.env.SAMPLE_PROJECT_VERSION || 'Version 1.0'

const mongoClient = new MongoClient(new Server(mongoDB.hostname, mongoDB.port));

const app = express()
app.use(cors({
    origin: '*'
}))

let mongodbState = 'Not connected to the Sample Project database yet'

const databaseConnectCallback = (error) => {
    if (error) {
        mongodbState = 'Warning - unable to connected to the Sample Project database: ' + mongoURL
        console.log(mongodbState)
        mongodbState = `${mongodbState}, Connect Error: ${error.message}.`
    } else {
        mongodbState = 'Yay - connected to the Sample Project database! ' + mongoURL
    }
    mongoClient.close()
    return mongodbState
}


mongoClient.connect(databaseConnectCallback)

const getHandler = (req, res) => {
    console.log("Request: ", req.headers)
    let retVal = ''
    const readHandler = (resp) => {
        let data = ''
        // A chunk of data has been received.
        resp.on('data', (chunk) => {
            data += chunk
        })
        // The whole response has been received. Print out the result.
        resp.on('end', () => {
            // retVal = `${version} </br></br>${mongodbState} </br></br> Echo Service Response: ${
            //     data.replace(/[\n\r]/g,'</br>')
            // }`
            retVal = `${version}`

            res.send({
                'data': retVal
            })
        })
    }

    const readErrorHandler = (err) => {
        retVal = `${version} </br></br> ${mongodbState}</br></br> Echo Service Error: ${err.message}`
        res.send({
            'data': retVal
        })
    }
    http.get(echoURL, readHandler).on("error", readErrorHandler)
    return {readHandler, readErrorHandler}
}

pingHandler = (req, res) => {
    console.log("Request: ", req.headers)
    retVal = `Sample-Project-Server: ${version}`
    res.send({
        'data': retVal
    })
}

app.get('/api', getHandler)
app.get('/', pingHandler)
app.get('/ping', pingHandler)
app.post('/ping', pingHandler)
app.put('/ping', pingHandler)
app.delete('/ping', pingHandler)

const serviceHandler = function () {
    console.log('Listening on ' + serverAPIPort)
    console.log(`Version ${version}`)
}

// app.listen(serverAPIPort, serverAPIHost, serviceHandler)
app.listen(serverAPIPort, serviceHandler)

// export for unit tests.
module.exports = { app, databaseConnectCallback, getHandler, serviceHandler, echoURL, version, mongoURL }  // Exported for unit testing.
