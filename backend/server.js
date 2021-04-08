const express = require('express')
const app = express()
const mongoose = require('mongoose')
const cors = require('cors')

const monngoURL = process.env.BACKEND_MONGO_CONNECTION //'mongodb://mongo-svc/database'

app.use(cors({
    origin: '*'
}))

let retVal = 'not connected yet'
app.get('/api', (req, res) => {
    res.send({
        'data': retVal
    })
})

mongoose.connect(monngoURL, { useNewUrlParser: true })
    .then(
        () => {
            console.log('connected to mongo')
            retVal = 'Yay - connected to mongo! ' + monngoURL
        }
    ).catch((error) => {
        retVal = 'Bummer - unable to connected to mongo: ' + monngoURL
        console.log(retVal)
    })

app.listen(3000, function() {
    console.log('listening on 3000')
})