'use strict'

var botConfig = {}

const getFullUrl = (protocol, host, port, path) => {
    var prefix = protocol + '://' + host
    if ((protocol === 'http' && port === 80)
        || (protocol === 'https' && port === 443)) {
        return prefix + path
    }
    return prefix + ':' + port + path
}

const buildMessage = (target, result) => {
    var fullUrl = getFullUrl(target.protocol, target.host, target.port, target.path)
    var resultAsString = result.passed.BOOL === true ? 'UP' : 'DOWN'
    var attachmentColor = result.passed.BOOL === true ? 'good' : 'danger'
    var text = '`' + result.code.S + ' ' + result.message.S + '` at ' + (new Date(Number(result.updatedAt.N))).toISOString() + '\n<' + fullUrl + '|Click to open ' + fullUrl + '>'
    var message = {
        channel: '#' + target.slackChannel,
        attachments: [
            {
                fallback: target.displayName + ' is ' + resultAsString + ': ' + fullUrl,
                fields: [
                    {
                        title: '"' + target.displayName + '" is ' + resultAsString,
                        value: text,
                        short: false
                    }
                ],
                color: attachmentColor,
                mrkdwn_in: ['text', 'pretext', 'fields']
            }
        ],
        username: botConfig.botName,
        icon_emoji: ':robot_face:',
        unfurl_links: false
    }
    return message
}

const postMessage = (message, hookUrl, callback) => {
    var body = JSON.stringify(message)
    var options = require('url').parse(hookUrl)
    options.method = 'POST'
    options.headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
    }

    const req = require('https').request(options, (res) => {
        let chunks = []
        res.setEncoding('utf8')
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () => {
            const body = chunks.join('')
            if (callback) {
                callback({
                    body: body,
                    statusCode: res.statusCode,
                    statusMessage: res.statusMessage
                })
            }
        })
        return res
    })
    req.on('error', (err) => {
        if (err) {
            // TODO: Execute fallback process
            console.error('Error: ', err)
        }
    })
    req.write(body)
    req.end()
}

exports.handler = (event, context, callback) => {
    botConfig = JSON.parse(require('fs').readFileSync('./config.json'))
    var target = event.target
    var result = event.result
    
    var message = buildMessage(target, result)
    postMessage(message, target.slackWebhook, function(res) {
        if (res.statusCode < 400) {
            callback(null, 'Message posted successfully')
        } else if (res.statusCode < 500) {
            var log = 'Error posting message to Slack API: ' + res.statusCode + ' - ' + res.statusMessage
            console.error(log)
            context.succeed(null, log) // Don't retry because the error is due to a problem with the request
        } else {
            // Let Lambda retry
            callback('Server error when processing message: ' + res.statusCode + ' - ' + res.statusMessage)
        }
    })
}
