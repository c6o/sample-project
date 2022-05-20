import axios from 'axios'
import * as https from 'https'

// These are overridden when running in cluster
// They default to running locally
const leafURL = 'https://sample-project-leaf:3011'

// In order for intercept to work, headers need to
// be propagated to upstream requests
// In this case, we only propagate headers that start
// with x-c6o but you should use your own convention
const propagateHeaders = (headers) =>
    Object.keys(headers)
        .filter(key => key.startsWith('x-c6o-'))
        .reduce((obj, key) => {
            obj[key] = headers[key]
            return obj
        }, {})

// Calls the leaf service and obtains headers
export const leafResult = async (inHeaders) => {
    try {
        const headers = propagateHeaders(inHeaders)
        const url = `${leafURL}/api`
        const httpsAgent = new https.Agent({
            rejectUnauthorized: false,
        })
        const result = await axios({
            url,
            headers,
            httpsAgent
        })
        return { leaf: { url, ...result.data, 'propagated-headers': JSON.stringify(headers) } }
    }
    catch (error) {
        return { leaf: { error: error.message } }
    }
}