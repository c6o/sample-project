import type { Config } from '@netlify/functions'
import fetch from 'node-fetch'
import { CodezeroAgent } from '@c6o/codezero-agent'

export const config: Config = {
  path: ['/api', '/sockets'],
}

export default async (req: Request, context: Context): Promise<Response> => {
    console.log('Received request for', req.url)
    const isSocketRequest = req.url.includes('/socket');
    const targetHost = isSocketRequest 
        ? "http://sample-project-socket.sample-project.svc.cluster.local:8999"
        : "http://sample-project-core.sample-project.svc.cluster.local:3000";

    const agent = new CodezeroAgent()
    return await fetch(targetHost, { agent })
}
