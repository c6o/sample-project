const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');

var monngoURL = 'mongodb://mongo-service/database'

app.use(cors({
    origin: '*'
}))


app.get('/api', (req, res) => {
    res.send({
        "data": "hello world!"
    })
})


mongoose.connect(monngoURL, { useNewUrlParser: true })
    .then(
        () => {
            console.log("connected to mongo");
        }
    ).catch((error) => {
        console.log("unable to connect to mongoDB")
        console.log(monngoURL);
    });


app.listen(3000, function() {
    console.log('listening on 3000')
});