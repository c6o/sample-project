import express from 'express'
import cors from 'cors'
import http from 'http'
import mongoPkg from 'mongodb'
const { MongoClient, Server } = mongoPkg

const echoURL = process.env.SAMPLE_PROJECT_ECHO || 'http://localhost:8000'
const mongoURL = process.env.SAMPLE_PROJECT_DATABASE || 'mongodb://localhost:27017'
const serverAPIPort = process.env.SAMPLE_PROJECT_API_PORT || 3000
const mongoDB = new URL(mongoURL)
const version = 'In Cluster Version'

const mongoClient = new MongoClient(new Server(mongoDB.hostname, mongoDB.port))


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

const pingHandler = (req, res) => {
    console.log("Request: ", req.headers)
    const retVal = `Sample-Project-Server: ${version}`
    res.send({
        'data': retVal
    })
}


const app = express()
app.use(cors({ origin: '*'}))

app.get('/api', getHandler)
app.get('/', pingHandler)
app.get('/ping', pingHandler)
app.post('/ping', pingHandler)
app.put('/ping', pingHandler)
app.delete('/ping', pingHandler)

app.listen(serverAPIPort, () => {
    console.log(`API version ${version} listening on http://localhost:${serverAPIPort}`)
})