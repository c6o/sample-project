const express = require('express')
const app = express()
const mongoose = require('mongoose')
const cors = require('cors')

const mongoURL = process.env.BACKEND_MONGO_CONNECTION //'mongodb://mongo-svc/database'

app.use(cors({
    origin: '*'
}))

let retVal = 'not connected yet'
app.get('/api', (req, res) => {
    res.send({
        'data': retVal
    })
})

mongoose.connect(mongoURL, { useNewUrlParser: true })
    .then(() => {
        retVal = 'Yay - connected to mongo! ' + mongoURL
        console.log(retVal)
    })
    .catch((error) => {
        retVal = 'Bummer - unable to connected to mongo: ' + mongoURL
        console.log(retVal)
        console.log(error)
    })

app.listen(3000, function() {
    console.log('listening on 3000')
})