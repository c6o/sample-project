const isLocal = window.location.hostname === 'localhost'
// URL's depend if we are running in cluster or not
// We can use the hostname to determine configuration
// When localhost, we are doing local development
const coreURL = isLocal ?
    'http://localhost:3000/api' :
    '/api'

const socketsURL = isLocal ?
    'ws://localhost:8999' :
    `ws://${window.location.host}/sockets`

const sectionTemplate = (section, payload) => {
    if (payload.error)
        return errorTemplate(section, 'Error', payload.error)
    return `
        <div class="ui divider"></div>
        <div class="ui two column grid">
            <div class="row">
                <div class="column">
                    <h2>${section}</h2>
                </div>
            </div>
            <div class="row">
                <div class="column">
                <table class="ui celled table">
                    <thead>
                        <tr>
                        <th>Field</th>
                        <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.keys(payload).map(key => `<tr>
                            <td>${key}</td>
                            <td>${payload[key]}</td>
                        </tr>`).join('')}
                    </tbody>
                    </table>
                </div>
                <div class="column c60-panel">
                    <h2>&nbsp;</h2>
                    <pre>${JSON.stringify(payload, null, 4)}</pre>
                </div>
            </div>
        </div>
    `
}

const errorTemplate = (section, title, error) =>
(`<div class="ui divider"></div>
        <div class="ui two column grid">
            <div class="row">
                <div class="column">
                    <h2>${section}</h2>
                </div>
            </div>
            <div class="ui icon message">
                <i class="exclamation triangle icon" style="color: red;"></i>
                <div class="content">
                    <div class="header">
                    ${title}
                    </div>
                    <p>${error}</p>
                </div>
            </div>
        </div><p>&nbsp;</p>`)

// State
let counter = 0
let wsOpened = false
let wsSupported = 'WebSocket' in window
let wsClient
const hitSockets = () => {
    if (!wsSupported) return
    if (wsClient) return

    wsClient = new WebSocket(socketsURL)
    wsClient.onopen = () => {
        // Web Socket is connected, send data using send()
        // $('#ws-sent').html("Sent Message:\"Hello World\"")
        console.log('WS Opened')
        wsOpened = true
        wsClient.send(`Hello World ${counter}`)
    }

    wsClient.onclose = () => {
        console.log('WS closed')
        delete wsClient
        wsOpened = true
        // $('#ws-closed').html(`Closed connection ${counter}...`)
    }

    wsClient.onmessage = (evt) => {
        const received_msg = evt.data
        console.log('ws onmessage', received_msg)
        // if (received_msg.includes('PING'))
        //     $('#ws-ping-messages').html("Ping received: "+received_msg)
        // else
        //     $('#ws-messages').html("Message received: "+received_msg)
    }
}

const hitCore = () => {
    $.ajax({
        url: coreURL,
        type: "GET",
        data: { "Content-Type": undefined },
        success: (result) => {
            const { mongo, leaf, file, ...core } = result
            core.url = coreURL
            let dump = sectionTemplate('Core', core)
            dump += sectionTemplate('Leaf', leaf)
            dump += sectionTemplate('Database', mongo)
            dump += sectionTemplate('File', file)
            $('#data-dump').html(dump)
        },
        error: (err) =>
            $('#data-dump').html(errorTemplate('Frontend', `Failed to reach ${coreURL}`, `The sample-project-core service may have failed to start or is still spinning up.`))
    })
}

const main = () => {
    hitCore()
    hitSockets()

    counter++
    $('#counter').html(counter)
}

$(document).ready(() => setInterval(main, 1000))
// Comment out the above and use below if you want a single call
// $(document).ready(main)