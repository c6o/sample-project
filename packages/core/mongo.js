import mongoPkg from 'mongodb'
const { MongoClient } = mongoPkg

// These are overridden when running in cluster
// They default to running locally
const mongoURL = process.env.SP_DB_URL || 'mongodb://sample-project-database:27017'

// Attempt to connect to mongodb and return success or error
export const mongoResult = async () => {
    let result = { url: mongoURL }
    try {
        await MongoClient.connect(mongoURL, {
            useNewUrlParser: true, 
            useUnifiedTopology: true,
            connectTimeoutMS: 10000,
            serverSelectionTimeoutMS: 10000 
        })
        result.success = true
    }
    catch (error) {
        result.error = error.name
    }

    return { mongo: result }
}
