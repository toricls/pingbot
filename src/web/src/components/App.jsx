/*eslint-disable no-unused-vars*/
import React from 'react'
import TargetList from './TargetList.jsx'
import 'aws-sdk/dist/aws-sdk'
const AWS = window.AWS
import Modal from 'boron/FadeModal'
import TargetDetail from './TargetDetail.jsx'
/*eslint-disable no-unused-vars*/
import formatDate from '../utils/FormatDate.js'

export default class App extends React.Component {
    constructor(props) {
        super(props)
        // check browser tab visibility
        var stateKey, eventKey, keys = 
        {
            hidden: 'visibilitychange',
            webkitHidden: 'webkitvisibilitychange',
            mozHidden: 'mozvisibilitychange',
            msHidden: 'msvisibilitychange'
        }
        for (stateKey in keys) {
            if (stateKey in document) {
                eventKey = keys[stateKey]
                break
            }
        }
        var visibility = !document[stateKey]
        this.updateFavicon(visibility)

        this.state = {
            data: [],
            enablePoll: visibility,
            refreshInfo: '',
            loadedAt: ''
        }
        this.dynamodb = new AWS.DynamoDB.DocumentClient()

        document.addEventListener(eventKey, function () {
            var isVisible = !document[stateKey]
            this.setState({
                enablePoll: isVisible,
                refreshInfo: this.getRefreshInfo(isVisible)
            })
            this.updateFavicon(isVisible)
            if (isVisible) {
                if (this.state.loadedAt === '') {
                    this.loadTargetsFromServer()
                } else if (this.props.pollInterval > 0 && new Date() - new Date(this.state.loadedAt) > this.props.pollInterval) {
                    // auto refresh is enabled and interval time has elapsed
                    this.loadTargetsFromServer()
                }
            } 
        }.bind(this))
    }
    // indicate load status
    updateFavicon(isVisible) {
        var link = document.createElement('link'),
            oldLink = document.getElementById('dynamicFavicon')
        link.type = 'image/x-icon'
        link.rel = 'shortcut icon'
        link.href = isVisible ? 'favicon.ico' : 'favicon-disabled.ico'
        link.id = 'dynamicFavicon'
        if (oldLink) document.head.removeChild(oldLink)
        document.head.appendChild(link)
    }
    getRefreshInfo(pollEnabled) {
        var msg = 'Auto refresh is disabled by config.'
        if (!pollEnabled) {
            msg = 'Auto refresh is temporary disabled until the browser tab is active.'
        } else if (this.props.pollInterval > 0) {
            msg = 'Refresh every ' + this.props.pollInterval / 1000 + ' secs.'
        }
        return msg
    }
    // load
    loadTargetsFromServer() {
        if (!this.state.enablePoll) {
            return
        }
        var scanParams = {
            TableName: process.env.DYNAMO_TARGETS_TABLE,
            Select: 'ALL_ATTRIBUTES',
            Limit: 100
        }
        this.setState({
            data: [],
            loadedAt: '---'
        })
        this.loadFromDynamoDbTable(scanParams)
    }
    loadFromDynamoDbTable(params) {
        this.dynamodb.scan(params, function (err, res) {
            this.onScan(err, res, params)
        }.bind(this))
    }
    onScan(err, res, params) {
        if (err) {
            return console.error(err)
        } else {
            this.setState({
                data: this.state.data.concat(res.Items)
            })
            if (typeof res.LastEvaluatedKey != 'undefined') {
                console.log('Fetching more.')
                params.ExclusiveStartKey = res.LastEvaluatedKey
                this.dynamodb.scan(params, function (err, res) {
                    this.onScan(err, res, params)
                }.bind(this))
            } else {
                this.setState({
                    loadedAt: formatDate(new Date(), 'YYYY-MM-DD hh:mm:ss'),
                    refreshInfo: this.getRefreshInfo(this.state.enablePoll)
                })
            }
        }
    }
    // save
    handleTargetSubmit(target) {
        this.saveTargetToDynamoDbTable(target, false)
    }
    handleNewTargetSubmit(target) {
        this.saveTargetToDynamoDbTable(target, true)
        this.toggleDialog()
    }
    saveTargetToDynamoDbTable(target, isNew) {
        var params = {
            TableName: process.env.DYNAMO_TARGETS_TABLE,
            Item: JSON.parse(JSON.stringify(target))
        }

        // Avoid DynamoDB's empty String ValidationException. see http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Limits.html
        for (var key in params.Item) {
            if (typeof params.Item[key] == 'string') {
                if (params.Item[key] == '') params.Item[key] = null
            }
        }

        this.dynamodb.put(params, function (err) {
            if (err) {
                console.dir(err)
            } else {
                var data
                if (isNew) {
                    data = this.state.data.concat([target])
                } else {
                    data = this.state.data.map(function (obj) {
                        return obj.uuid == target.uuid ? target : obj
                    })
                }
                this.setState({ data: data })
            }
        }.bind(this))
    }
    // delete
    handleTargetDelete(target) {
        if (!target || !target.uuid || target.uuid.trim() === '') return

        var tables = [process.env.DYNAMO_TARGETS_TABLE, process.env.DYNAMO_RESULTS_TABLE, process.env.DYNAMO_HISTORIES_TABLE]
        for (var i = 0, len = tables.length; i < len; i++) {
            this.deleteItem(tables[i], target.uuid)
        }
        var data = this.state.data.filter(function(obj) {
            return obj.uuid != target.uuid
        })
        this.setState({ data: data })
    }
    deleteItem(tableName, uuid) {
        var params = {
            TableName: tableName,
            Key: {'uuid': uuid}
        }
        this.dynamodb.delete(params, function (err) {
            if (err) {
                console.error(err)
            }
        })
    }
    componentDidMount() {
        setTimeout(this.loadTargetsFromServer.bind(this), 100) // delay
        if (this.props.pollInterval > 0) {
            setInterval(this.loadTargetsFromServer.bind(this), this.props.pollInterval)
        }
    }
    toggleDialog() {
        this.refs['new-target'].toggle()
    }
    render() {
        var logo='&#x1F916; #ping-bot'
        return (
            <div>
                <div className="navbar">
                    <span className="navbar-logo" dangerouslySetInnerHTML={{__html: logo}}/>
                    <span className="navbar-link" onClick={this.toggleDialog.bind(this)}>New</span>
                </div>
                <TargetList
                    data={this.state.data}
                    refreshInfo={this.state.refreshInfo}
                    loadedAt={this.state.loadedAt}
                    onTargetSubmit={this.handleTargetSubmit.bind(this)}
                    onTargetDelete={this.handleTargetDelete.bind(this)} />
                <Modal ref={'new-target'}>
                    <TargetDetail
                        onClickClose={this.toggleDialog.bind(this)}
                        onHandleSubmit={this.handleNewTargetSubmit.bind(this)}
                        formMode='new' />
                </Modal>
            </div>
        )
    }
}
