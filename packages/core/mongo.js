import mongoPkg from 'mongodb'
const { MongoClient } = mongoPkg

// These are overridden when running in cluster
// They default to running locally
const mongoURL = process.env.SP_DB_URL || 'mongodb://localhost:27017'

// Attempt to connect to mongodb and return success or error
export const mongoResult = async () => {
    let result = { url: mongoURL }
    try {
        await MongoClient.connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true })
        result.success = true
    }
    catch (error) {
        result.error = error.name
        console.log(error);
    }

    return { mongo: result }
}