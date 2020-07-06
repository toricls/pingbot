import React from 'react'
import ReactDOM from 'react-dom'

var styles = {
    btn: {
        margin: '1em 0.5em',
        padding: '1em 2em',
    },
    container: {
        padding: '2em',
        textAlign: 'center'
    },
    valid: {
    },
    invalid: {
        backgroundColor: '#FFEBEE',
        border: '1px solid #F44336'
    },
    commands: {
        width:'100%',
        textAlign:'right',
        marginLeft:'5px',
        marginRight:'5px',
        padding: '10px'
    }
}

export default class TargetDetail extends React.Component {
    constructor(props) {
        super(props)
        this.state = {}
        var propData = this.props.data
                || {
                    displayName: '',
                    protocol: 'http',
                    host: '',
                    port: 80,
                    path: '/',
                    group: '',
                    method: 'HEAD',
                    slackChannel: '',
                    slackWebhook: ''
                }
        this.state.data = JSON.parse(JSON.stringify(propData))
        if (!this.state.data.slackChannel) this.state.data.slackChannel = ''
        if (!this.state.data.slackWebhook) this.state.data.slackWebhook = ''
        this.state.style = {
            uuid: styles.valid,
            group: styles.valid,
            displayName: styles.valid,
            protocol: styles.valid,
            host: styles.valid,
            port: styles.valid,
            path: styles.valid,
            slackChannel: styles.valid,
            slackWebhook: styles.valid
        }
        if (!this.state.data.uuid) {
            this.state.data.uuid = 'uuid will be automatically generated.'
        }
        this.state.uuidReadOnly = (['new', 'update'].indexOf(this.props.formMode) > -1)
    }
    handleCloseClick(e) {
        e.preventDefault()
        this.props.onClickClose(this.props.data)
    }
    getNewUuid() {
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8)
            return v.toString(16)
        })
        return uuid
    }
    componentDidMount() {
        // focus, readonly
        var domToFocus =  this.refs.uuid
        if (['new', 'update'].indexOf(this.props.formMode) > -1) {
            domToFocus = this.refs.displayName
        }
        ReactDOM.findDOMNode(domToFocus).focus()
    }
    handleChange (event) {
        let type = event.target.name
        let value = event.target.value
        this.setValidatedResult(type, value, function(result, type, value){
            var allValid = true
            for(var stateKey in this.state.data) {
                if (stateKey === 'uuid') continue
                if (!this.validate(stateKey, this.state.data[stateKey]).valid) {
                    allValid = false
                    break
                }
            }
            var somethingChanged = (this.props.formMode == 'new')
            if (allValid) {
                for(var propKey in this.props.data) {
                    // avoid async operations delay
                    if (propKey == type) {
                        if (type == 'port' && value != this.props.data[propKey]) {
                            somethingChanged = true
                            break
                        } else if (value.trim() != this.props.data[propKey]) {
                            somethingChanged = true
                            break
                        }
                    } else if (this.state.data[propKey] != this.props.data[propKey]) {
                        somethingChanged = true
                        break
                    }
                }
            }
            var enableSubmit = result && allValid && somethingChanged
            this.refs.submit.disabled = !enableSubmit
        }.bind(this))
    }
    setValidatedResult(type, value, cb) {
        var data = this.state.data
        var style = this.state.style

        var validateResult = this.validate(type, value)
        for(var resultKey in validateResult.data) {
            data[resultKey] = validateResult.data[resultKey]
        }
        var validateStyle = this.getValidatedStyle(validateResult.result, type)
        for(var styleKey in validateStyle) {
            style[styleKey] = validateResult[styleKey]
        }
        this.setState({
            data: data,
            style: style
        }, cb(validateResult.valid, type, value))
    }
    // validation
    validate(type, value) {
        var data = {}
        var result = true
        var length = 0
        switch(type) {
        case 'displayName':
            length = value.trim().length
            result = (length <= 32 && length > 0)
            data.displayName = value
            break
        case 'group':
            length = value.trim().length
            result = (length <= 32)
            data.group = value
            break
        case 'protocol':
            result = (['http', 'https'].indexOf(value) > -1)
            data.protocol = value
            switch(value) {
            case 'http':
                data.port = 80
                break
            case 'https':
                data.port = 443
                break
            }
            break
        case 'host':
            length = value.trim().length
            result = (length <= 150 && length > 0)
            data.host = value
            break
        case 'port':
            result = !isNaN(parseFloat(value)) && isFinite(value) && value >= 0 && value <= 65535
            data.port = value
            break
        case 'path':
            // path have to start with slash
            if ((value && value.trim()[0] != '/') || !value) value = '/' + value.trim()
            length = value.trim().length
            result = (length <= 300 && length > 0)
            data.path = value
            break
        case 'method':
            result = (['HEAD', 'GET'].indexOf(value) > -1)
            data.method = value
            break
        case 'slackChannel':
            // Name should be lowercase, with no space
            length = value.trim().length
            result = (length <= 21 && length >= 0)
            data.slackChannel = value
            break
        case 'slackWebhook':
            length = value.trim().length
            result = (length >= 0)
            data.slackWebhook = value
            break
        }
        return {
            data: data,
            valid: result
        }
    }
    getValidatedStyle(result, type) {
        var style = {}
        switch(type) {
        case 'displayName':
            style.displayName = result ? styles.valid : styles.invalid
            break
        case 'group':
            style.group = result ? styles.valid : styles.invalid
            break
        case 'protocol':
            style.protocol = result ? styles.valid : styles.invalid
            break
        case 'host':
            style.host = result ? styles.valid : styles.invalid
            break
        case 'port':
            style.port = result ? styles.valid : styles.invalid
            break
        case 'path':
            style.path = result ? styles.valid : styles.invalid
            break
        case 'method':
            style.method = result ? styles.valid : styles.invalid
            break
        case 'slackChannel':
            style.slackChannel = result ? styles.valid : styles.invalid
            break
        case 'slackWebhook':
            style.slackWebhook = result ? styles.valid : styles.invalid
            break
        }
        return style
    }
    handleSubmitForm(e) {
        e.preventDefault()
        var target = this.state.data
        if (this.props.formMode == 'new') {
            target.uuid = this.getNewUuid()
        } else {
            // prevent overriding by evil users
            target.uuid = this.props.data.uuid
        }
        this.props.onHandleSubmit(target)
    }
    handleDelete(e) {
        e.preventDefault()
        var target = this.props.data
        if (this.props.formMode == 'new') {
            return
        }
        if (window.confirm('This operation cannot be undone.\nAre you sure to delete?')) {
            this.props.onClickDelete(target)
        }
    }
    render() {
        var commands = this.props.formMode == 'update' ? (
            <div style={{textAlign:'right'}}>
                <a className='target-action delete-link' onClick={this.handleDelete.bind(this)}>Delete</a>
            </div>
        ) : null
        return (
            <div style={styles.container}>
                <form onSubmit={this.handleSubmitForm.bind(this)}>
                    <input
                        type="text"
                        ref="uuid"
                        className="form-input"
                        name="uuid"
                        placeholder="uuid (*)"
                        value={this.state.data.uuid}
                        onChange={this.handleChange.bind(this)}
                        disabled={this.state.uuidReadOnly}
                        style={this.state.style.uuid} />
                    <input
                        type="text"
                        ref="displayName"
                        className="form-input"
                        name="displayName"
                        placeholder="Display name [max length: 32] (*)"
                        value={this.state.data.displayName}
                        onChange={this.handleChange.bind(this)}
                        style={this.state.style.displayName} />
                    <input
                        type="text"
                        ref="group"
                        className="form-input"
                        name="group"
                        placeholder="Group Name [max length: 32]"
                        value={this.state.data.group}
                        onChange={this.handleChange.bind(this)}
                        style={this.state.style.group} />
                    <select
                        ref="protocol"
                        className="form-select"
                        name="protocol"
                        required
                        value={this.state.data.protocol}
                        onChange={this.handleChange.bind(this)}
                        style={this.state.style.protocol} >
                        <option>http</option>
                        <option>https</option>
                    </select>
                    <input
                        type="text"
                        className="form-input"
                        name="host"
                        placeholder="Host name [max length: 150] (*)"
                        value={this.state.data.host}
                        onChange={this.handleChange.bind(this)}
                        style={this.state.style.host} />
                    <input
                        type="number"
                        className="form-input"
                        name="port"
                        placeholder="Port number [default: 80, min:0, max:65535] (*)"
                        value={this.state.data.port}
                        onChange={this.handleChange.bind(this)}
                        style={this.state.style.port} />
                    <input
                        type="text"
                        className="form-input"
                        name="path"
                        placeholder="Path [default: /, max length: 300] (*)"
                        value={this.state.data.path}
                        onChange={this.handleChange.bind(this)}
                        style={this.state.style.path} />
                    <select
                        ref="method"
                        className="form-select"
                        name="method"
                        required
                        value={this.state.data.method}
                        onChange={this.handleChange.bind(this)}
                        style={this.state.style.method}>
                        <option>HEAD</option>
                        <option>GET</option>
                    </select>
                    <input
                        type="text"
                        className="form-input"
                        name="slackChannel"
                        placeholder="Slack channel to notify without \'#\'. [max length: 21]"
                        value={this.state.data.slackChannel}
                        onChange={this.handleChange.bind(this)}
                        style={this.state.style.slackChannel} />
                    <input
                        type="text"
                        className="form-input with-hint"
                        name="slackWebhook"
                        placeholder="Slack incoming webhook url to notify"
                        value={this.state.data.slackWebhook}
                        onChange={this.handleChange.bind(this)}
                        style={this.state.style.slackWebhook} /> {/* set style to display the hint text */}
                    <div style={{textAlign: 'right'}}>
                        <span style={{fontSize:'0.7em'}}>Get a webhook url at <a href="https://my.slack.com/services/incoming-webhook/">Slack's website</a>.</span>
                    </div>
                    <button type="cancel" style={styles.btn} className="btn-outline" onClick={this.handleCloseClick.bind(this)}>Cancel</button>
                    <button type="submit" ref="submit" style={styles.btn} className="btn" disabled='disabled'>Save</button>
                </form>
                {commands}
            </div>
        )
    }
}
