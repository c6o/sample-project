const express = require('express')
const cors = require('cors')
const http = require('http')
const { MongoClient, Server } = require('mongodb')

// To route to Echo Server: Same namespace: servicename:port, Different namespace: servicename.namespace:port
const echoURL = process.env.HALYARD_ECHO || 'http://localhost:8000'
const mongoURL = process.env.HALYARD_DATABASE || 'mongodb://localhost:27017'
const backendAPIPort = process.env.HALYARD_API_PORT || 3000
const backendAPIHost = process.env.HALYARD_API_HOST || 'localhost'
const mongoDB = new URL(mongoURL)

const mongoClient = new MongoClient(new Server(mongoDB.hostname, mongoDB.port));

const app = express()
app.use(cors({
    origin: '*'
}))

let mongodbState = 'Not connected to the Halyard database yet'
const version = 'Version 1.0'

const databaseConnectCallback = (error) => {
    if (error) {
        mongodbState = 'Bummer - unable to connected to the Halyard database: ' + mongoURL
        console.log(mongodbState)
        console.log(error)
        mongodbState = `${mongodbState}, Connect Error: ${error.message}`
    } else {
        mongodbState = 'Yay - connected to the Halyard database! ' + mongoURL
    }
    mongoClient.close()
    return mongodbState
}

mongoClient.connect(databaseConnectCallback)

const getHandler = (req, res) => {
    let retVal = ''
    const readHandler = (resp) => {
        let data = ''
        // A chunk of data has been received.
        resp.on('data', (chunk) => {
            data += chunk
        })
        // The whole response has been received. Print out the result.
        resp.on('end', () => {
            retVal = `${version} </br></br>${mongodbState} </br></br> Echo Service Response: ${
                data.replace(/[\n\r]/g,'</br>')
            }`
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

app.get('/api', getHandler)

const serviceHandler = function () {
    console.log('listening on ' + backendAPIPort)
}

// app.listen(backendAPIPort, backendAPIHost, serviceHandler)
app.listen(backendAPIPort, serviceHandler)

// export for unit tests.
module.exports = { app, databaseConnectCallback, getHandler, serviceHandler }  // Exported for unit testing.
