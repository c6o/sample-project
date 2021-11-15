import axios from 'axios'

// These are overridden when running in cluster
// They default to running locally
const leafURL = process.env.SP_LEAF_URL || 'http://localhost:3010'

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
        const result = await axios({
            url,
            headers
        })
        return { leaf: { url, ...result.data, 'propagated-headers': headers } }
    }
    catch (error) {
        return { leaf: { error: error.message } }
    }
}