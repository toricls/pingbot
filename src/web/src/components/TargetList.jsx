/*eslint-disable no-unused-vars*/
import React from 'react'
import TargetDetail from './TargetDetail.jsx'
import Target from './Target.jsx'
import Modal from 'boron/FadeModal'
/*eslint-disable no-unused-vars*/

export default class TargetList extends React.Component {
    constructor(props) {
        super(props)
    }
    componentDidMount() {
    }
    handleSubmit(target) {
        this.props.onTargetSubmit(target)
        this.toggleDialog(target)
    }
    handleDelete(target) {
        this.props.onTargetDelete(target)
        this.toggleDialog(target)
    }
    toggleDialog(target) {
        var ref = target.uuid
        this.refs[ref].toggle()
    }
    getContent(target) {
        return (
            <TargetDetail
                data={target}
                onClickClose={this.toggleDialog.bind(this)}
                onHandleSubmit={this.handleSubmit.bind(this)}
                onClickDelete={this.handleDelete.bind(this)}
                formMode='update' />
        )
    }
    render() {
        var targetNodes = this.props.data.map(function(target) {
            return (
                <Target key={target.uuid} data={target} onClickItem={this.toggleDialog.bind(this)}/>
            )
        }.bind(this))
        var targetModals = this.props.data.map(function(target){
            return (
                <Modal key={target.uuid} ref={target.uuid}>{this.getContent(target)}</Modal>
            )
        }.bind(this))
        return (
            <div>
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <td>uuid</td>
                            <td>group</td>
                            <td>name</td>
                            <td>target</td>
                            <td>latest status</td>
                        </tr>
                    </thead>
                    <tbody>
                        {targetNodes}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan="5" style={{fontSize:'0.7em'}}>Rendered at: <span style={{fontWeight:'bold'}}>{this.props.loadedAt}</span>, {this.props.refreshInfo}</td>
                        </tr>
                    </tfoot>
                </table>
                {targetModals}
            </div>
        )
    }
}
