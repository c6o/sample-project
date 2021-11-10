const isLocal = window.location.hostname === 'localhost'
const wsSupported = 'WebSocket' in window

// URL's depend if we are running in cluster or not
// We can use the hostname to determine configuration
// When localhost, we are doing local development
const coreURL = isLocal ?
    'http://localhost:3000/api' :
    '/api'

const socketsURL = isLocal ?
    'ws://localhost:8999' :
    `ws://${window.location.host}/sockets`

// State
let coreCounter = 0
let wsClient
let wsLastMessage = 'Pending connection...'

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

const socketTemplate = () => {
    if (!wsSupported)
        return errorTemplate('Sockets', 'Browser issue', 'WebSockets are not supported')
    if (!wsClient)
        return errorTemplate('Sockets', 'Socket is closed')

    return `
        <div class="ui divider"></div>
        <div class="ui grid">
            <div class="row">
                <div class="column">
                    <h2>Sockets</h2>
                </div>
            </div>
            <div class="row">
                <div class="column">
                ${wsLastMessage}
                </div>
            </div>
        </div>
    `
}

const errorTemplate = (section, title, error = '') => (`
    <div class="ui divider"></div>
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
    </div><p>&nbsp;</p>
`)

const beginSockets = () => {
    if (!wsSupported) return
    if (wsClient) return

    wsClient = new WebSocket(socketsURL)
    wsClient.onopen = () => {
        $('#socket-send').removeClass('disabled')
        $('#socket-toggle').html('Disconnect')

    }
    wsClient.onclose = () => {
        $('#socket-send').addClass('disabled')
        $('#socket-broadcast').addClass('disabled')
        delete wsClient
        wsClient = null
        $('#socket-toggle').html('Connect')
    }

    wsClient.onmessage = (evt) => wsLastMessage = evt.data
}

socketToggleClicked = () => {
    wsClient ?
        wsClient.close() :
        beginSockets()
}

socketBroadcastClicked = () => {
    const element = $('#socket-input')[0]
    wsClient.send(`broadcast: ${element.value}`)
    element.value = ''
    $('#socket-broadcast').addClass('disabled')
}

socketInputKeydown = (e) =>  {
    if (e.target.value.length)
        $('#socket-broadcast').removeClass('disabled')
    if (e.keyCode === 13) {
        wsClient.send(e.target.value)
        e.target.value = ''
        $('#socket-broadcast').addClass('disabled')
    }
}

const callCore = () => {
    $.ajax({
        url: coreURL,
        type: "GET",
        data: { "Content-Type": undefined },
        success: (result) => {
            const { mongo, leaf, file, ...core } = result
            core.url = coreURL
            const content =
                socketTemplate() +
                sectionTemplate('Core', core) +
                sectionTemplate('Leaf', leaf) +
                sectionTemplate('Database', mongo) +
                sectionTemplate('File', file)
            $('#data-dump').html(content)
        },
        error: (err) =>
            $('#data-dump').html(errorTemplate('Frontend', `Failed to reach ${coreURL}`, `The sample-project-core service may have failed to start or is still spinning up.`))
    })

    $('#coreCounter').html(++coreCounter)
}

$(document).ready(() => {
    $(document).on('click', "#socket-toggle", socketToggleClicked)
    $(document).on('click', "#socket-broadcast", socketBroadcastClicked)
    $(document).on('keydown', '#socket-input', socketInputKeydown)

    // Call the core API every second
    setInterval(callCore, 1000)

    // Start a sockets connection
    beginSockets()
})