/*eslint-disable no-unused-vars*/
import React from 'react'
import {render} from 'react-dom'
import App from './components/App.jsx'
import './scss/app.scss'
/*eslint-disable no-unused-vars*/

import 'aws-sdk/dist/aws-sdk'
const AWS = window.AWS
AWS.config.region = process.env.AWS_REGION
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: process.env.AWS_COGNITO_ARN,
})
AWS.config.credentials.get(function(err) {
    if (err) {
        console.error('Error: ' + err)
        document.getElementById('app').innerHTML = err.code + ': ' + err.message
        return
    } else {
        render(<App pollInterval={process.env.POLL_INTERVAL}/>, document.getElementById('app'))
    }
})
