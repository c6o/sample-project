import type { Config, Context } from '@netlify/functions'
import fetch from 'node-fetch'
import { CodezeroAgent } from '@c6o/codezero-agent'

export const config: Config = {
  path: ['/api', '/sockets'],
}

// NOTE: Having the agent global ensures
// credential caching
const agent = new CodezeroAgent()

// WARNING: If not, you are exposing the endpoint to the world
// put your Auth handling here to verify the user is allowed to 
// access the API
const propagateHeaders = (headers) =>
    Object.keys(headers)
        .filter(key => key.toLowerCase().startsWith('x-'))
        .reduce((obj, key) => {
            obj[key] = headers[key]
            return obj
        }, {})
        
export default async (req: Request, context: Context): Promise<Response> => {
    console.log('Received request for', req.url, req.headers)
    const isSocketRequest = req.url.includes('/socket');
    const targetHost = isSocketRequest 
        ? "http://sample-project-socket.sample-project:8999/socket"
        : "http://sample-project-core.sample-project:3000/api";

    const headers = propagateHeaders(req.headers)
    if (Object.keys(headers).length !== 0) console.log('propagating', headers)

    const response = await fetch(targetHost, { agent, headers })
    if (!response.ok) {
        return new Response('Failed to fetch data', {
            status: response.status,
            headers: {
                'Content-Type': 'application/json'
            }
        })
    }

    return new Response(await response.text(), {
        headers: {
            'Content-Type': 'application/json'
        }
    })
}
