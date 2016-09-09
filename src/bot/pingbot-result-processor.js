'use strict'

let AWS = require('aws-sdk')
let dynamodb = new AWS.DynamoDB.DocumentClient()
let lambda = new AWS.Lambda({ apiVersion: '2015-03-31' })
var botConfig = {}

const sendNotification = (opts) => {
    const params = {
        FunctionName: botConfig.botName + botConfig.lambda.suffixSlackNotificationFunction,
        Payload: JSON.stringify(opts)
    }
    lambda.invoke(params, (err) => {
        if (err) {
            console.error('Error occuerd while invoking lambda function: ', err)
        } else {
            console.log('Invoked notification function')
        }
    })
}

exports.handler = (event, context, callback) => {
    botConfig = JSON.parse(require('fs').readFileSync('./config.json'))
    event.Records.forEach((record) => {
        var notify = false
        if (record.eventName === 'INSERT') {
            if (record.dynamodb.NewImage.passed.BOOL !== true) {
                console.log('Detected failure of new target!')
                notify = true
            }
        } else if (record.eventName === 'MODIFY') {
            if (record.dynamodb.OldImage.passed.BOOL != record.dynamodb.NewImage.passed.BOOL) {
                console.log('Detected health check status change!')
                notify = true
            }
        }
        if (notify === true) {
            var params = {
                TableName: botConfig.botName + botConfig.dynamoDb.suffixTargetsTable,
                Key: {
                    uuid: record.dynamodb.NewImage.uuid.S
                }
            }
            dynamodb.get(params, function (err, data) {
                if (err) {
                    console.log(err)
                } else {
                    var target = data.Item
                    if (!target) {
                        console.error('ERROR: ', `${params.Key.uuid} does not exist on ${params.TableName} table. Make sure you didn't delete a record of ${params.Key.uuid}.`)
                        return // Just 'return' the Lambda function to handle next stream record, don't invoke callback function.
                    }
                    var opts = {
                        target: target,
                        result: record.dynamodb.NewImage
                    }
                    sendNotification(opts)
                }
            })
        }
    })
    callback(null, `Successfully processed ${event.Records.length} records.`)
}