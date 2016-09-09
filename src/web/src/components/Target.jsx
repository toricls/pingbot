import React from 'react'
import 'aws-sdk/dist/aws-sdk'
const AWS = window.AWS
import formatDate from '../utils/FormatDate.js'

export default class Target extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            hasStatus: false,
            passed: null,
            code: '---',
            message: '---',
            updatedAt: '---',
            modalName: 'modal'
        }
    }
    loadResultFromServer() {
        var dynamodb = new AWS.DynamoDB.DocumentClient()
        var getParams = {
            TableName: process.env.DYNAMO_RESULTS_TABLE,
            Key: {
                'uuid': this.props.data.uuid
            }
        }
        dynamodb.get(getParams, function (err, res) {
            if (err) {
                return console.error(err)
            } else {
                var result = res.Item
                if (result) {
                    this.setState({
                        hasStatus: true,
                        passed: result.passed,
                        code: result.code,
                        message: result.message,
                        updatedAt: formatDate(new Date(result.updatedAt), 'YYYY-MM-DD hh:mm:ss')
                    })
                }
            }
        }.bind(this))
    }
    toLinkText(target) {
        if ((target.port == 80 && target.protocol == 'http') ||
            (target.port == 443 && target.protocol == 'https')) {
            return target.protocol + '://' + target.host + target.path
        }
        return target.protocol + '://' + target.host + ':' + target.port + target.path
    }
    getStatusText() {
        if (!this.state.hasStatus) return 'Not checked yet'
        return this.state.passed === true ? 'passed' : 'failed'
    }
    getStatusClassText() {
        if (!this.state.hasStatus) return 'statusNotChecked'
        return this.state.passed === true ? 'statusPassed' : 'statusFailed'
    }
    getLastStatusText() {
        if (!this.state.hasStatus) return ''
        return ' by ' + this.state.code + ' ' + this.state.message + ' at ' + this.state.updatedAt
    }
    componentDidMount() {
        this.loadResultFromServer()
    }
    handleItemClick() {
        this.props.onClickItem(this.props.data)
    }
    render() {
        return (
            <tr className="target" onClick={this.handleItemClick.bind(this)}>
                <td>{this.props.data.uuid.substr(0, 4)}</td>
                <td>{this.props.data.displayName}</td>
                <td>{this.toLinkText(this.props.data)}</td>
                <td className={this.getStatusClassText()}>{this.getStatusText()}{this.getLastStatusText()}</td>
            </tr>
        )
    }
}
