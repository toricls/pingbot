'use strict'

let AWS = require('aws-sdk')
let dynamodb = new AWS.DynamoDB.DocumentClient()
let lambda = new AWS.Lambda({ apiVersion: '2015-03-31' }) // to invoke self
var botConfig = {}
// WARN: if you try to change timeout and maxRetry, you should also consider about lambda function's timeout value.
let timeout = 10000 // 10 sec 
let maxRetry = 5

const invokeSelf = (opts, context) => {
    const lambdaParams = {
        FunctionName: context.functionName,
        Payload: JSON.stringify(opts)
    }
    lambda.invoke(lambdaParams, (err) => {
        if (err) {
            console.error('Error occuerd while invoking lambda function: ', err)
        } else {
            console.log('Function re-invoked. retry: ', opts.retry)
        }
    })
}

const saveToDynamoDb = (uuid, resCode, resMessage, isPassed, callback) => {
    var result = {
        uuid: uuid,
        code: resCode+'',
        message: resMessage,
        passed: isPassed,
        updatedAt: (new Date()).getTime()
    }
    const dynamoParams = {
        TableName: botConfig.botName + botConfig.dynamoDb.suffixResultsTable,
        Item: result
    }
    dynamodb.put(dynamoParams, callback)
}

exports.handler = (event, context, callback) => {
    botConfig = JSON.parse(require('fs').readFileSync('./config.json'))
    console.log('Function started for uuid: %s', event.uuid)
    let client = event.options.protocol == 'http:' ? require('http') : require('https')
    event.retry = ('retry' in event) ? event.retry + 1 : 1
    if (event.retry > 1) {
        console.log('retry: %d', event.retry)
    }
    const req = client.request(event.options, (res) => {
        res.setEncoding('utf8')
        res.on('data', () => {})
        res.on('end', () => {
            if (res.statusCode != event.desiredStatusCode
                    && res.statusCode >= 500 // Retry only the error is due to a problem with the server.
                    && event.retry < maxRetry) {
                console.log('Function will be re-invoked because the target returned unsuccessful response code: %s', res.statusCode)
                invokeSelf(event, context)
            } else {
                saveToDynamoDb(
                    event.uuid,
                    res.statusCode,
                    res.statusMessage,
                    res.statusCode == event.desiredStatusCode,
                    callback)
            }
        })
    })
    req.on('socket', (socket) => {
        socket.setTimeout(timeout)
        socket.on('timeout', () => {
            req.abort()
            console.error('Request timed out after %d seconds', timeout/1000)
            if (event.retry >= maxRetry) {
                saveToDynamoDb(
                    event.uuid,
                    'ERR',
                    require('util').format('[Max retries exceeded] Request timed out (%d sec).', timeout/1000),
                    false,
                    callback)
            } else {
                invokeSelf(event, context)
            }
        })
        socket.on('error', (err) => {
            console.error('Detected socket error: ', err)
            if (event.retry >= maxRetry) {
                saveToDynamoDb(
                    event.uuid,
                    'ERR',
                    '[Max retries exceeded] Socket error: ' + err.message,
                    false,
                    callback)
            } else {
                invokeSelf(event, context)
            }
        })
    })
    req.on('error', (err) => {
        console.error('Request error: ', err)
        if (event.retry >= maxRetry) {
            saveToDynamoDb(
                event.uuid,
                err.code,
                '[Max retries exceeded] ' + err.message,
                false,
                callback)
        } else {
            invokeSelf(event, context)
        }
    })

    if (event.data) {
        req.write(JSON.stringify(event.data))
    }
    req.end()
}
