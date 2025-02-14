import type { Config } from '@netlify/functions'
import fetch from 'node-fetch'
import { CodezeroAgent } from '@c6o/codezero-agent'

export const config: Config = {
  path: ['/api', '/sockets'],
}

const agent = new CodezeroAgent()

export default async (req: Request, context: Context): Promise<Response> => {
    console.log('Received request for', req.url)
    const isSocketRequest = req.url.includes('/socket');
    const targetHost = isSocketRequest 
        ? "http://sample-project-socket.sample-project:8999/socket"
        : "http://sample-project-core.sample-project:3000/api";

    const response = await fetch(targetHost, { agent })
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
