'use strict'

let AWS = require('aws-sdk')
let dynamodb = new AWS.DynamoDB.DocumentClient()
let lambda = new AWS.Lambda({ apiVersion: '2015-03-31' })
var botConfig = {}

const asyncAll = (opts) => {
    let i = -1
    const next = () => {
        i++
        if (i >= opts.items.length) {
            opts.done()
            return
        }
        opts.fn(next, opts.items[i])
    }
    next()
}

const dispatch = (event, callback) => {
    var loadDynamoParams = {
        TableName: botConfig.botName + botConfig.dynamoDb.suffixTargetsTable,
        Select: 'ALL_ATTRIBUTES'
    }
    dynamodb.scan(loadDynamoParams, function (err, res) {
        if (err) {
            return callback(err)
        } else {
            asyncAll({
                items: res.Items,
                fn: (next, target) => {
                    const lambdaParams = {
                        FunctionName: botConfig.botName + botConfig.lambda.suffixHelathCheckFunction,
                        Payload: JSON.stringify({
                            uuid: target.uuid,
                            desiredStatusCode: 200,
                            options: {
                                protocol: target.protocol + ':',
                                host: target.host,
                                path: target.path,
                                port: target.port,
                                method: 'HEAD',
                                headers: {
                                    'User-Agent': botConfig.botName + '/v' + botConfig.botVersion + ' uuid:' + target.uuid,
                                    'Host': target.host
                                }
                            }
                        })
                    }
                    lambda.invoke(lambdaParams, (err) => {
                        if (err) {
                            console.error('Error: ', err)
                        }
                        next()
                    })
                },
                done: () => callback(null, {})
            })
        }
    })
}

exports.handler = (event, context, callback) => {
    botConfig = JSON.parse(require('fs').readFileSync('./config.json'))
    console.log(botConfig)
    dispatch(event, callback)
}
