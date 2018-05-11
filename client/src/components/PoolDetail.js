import React, { Component } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';

import "./styles/pooldetail.css";
import "./styles/global.css";
import "./styles/media.css";
import * as actions from '../actions/index';
import Chart from './Chart';

class PoolDetail extends Component {
  state = {
    value: ''
  };
  componentDidMount() {
    this.props.fetchPool(this.props.match.params.id);
    this.props.fetchComments(this.props.match.params.id);
  }
  componentWillUnmount() {
    this.props.reset();
  }

  handleSubmit = event => {
    this.props.createComment({
      comment: this.state.value,
      poolId: this.props.match.params.id
    });
    this.setState({ value: '' });
    event.preventDefault();
  };
  handleChange = event => {
    this.setState({ value: event.target.value });
  };

  handleKeyPress = (event) => {
		if(event.key === 'Enter' && this.state.value !== '') {
			this.props.createComment({
				comment: this.state.value,
				poolId: this.props.match.params.id
			});
			this.setState({ value: '' });
			event.preventDefault();
		}
	}

  render() {
    const { pools } = this.props;
    if (!pools.pool || !pools.chart || !pools.comments) {
      return <p>Loading...</p>;
    }
    const date = moment(pools.pool.date).format('L');
    return (
      <div className="form-wrap">
				{pools.createError ? <h1 className="cancel">{pools.createError}</h1> : null}
        <h1 className="text-1">{pools.pool.title}</h1>
        <h2 className="text-2">Starting: {date}</h2>
        <h2 className="text-2">Description: {pools.pool.description}</h2>
				{/* <h2 className="text-2">Contributors: {pools.pool.contributors}</h2> */}
        <Chart
          chart={pools.chart}
          user={this.props.auth.user}
          params={this.props.match.params.id}
        />
				<p>*Amount before platform fee</p>
				<p>**1% Platform Fee (administered on Disbursement Date)</p>
				<div className="pool__comments-wrap">
					<h1 className="text-2">Join the Conversation</h1>
					{pools.comments.map(c => {
						return <div key={c._id} className="pool__comment">
							<img src="https://i.imgur.com/7gR0HXq.jpg?2" alt="user thumbnail" className="pool__comment-thumb"/>
								<div className="pool__comment-text">
									<h5>{c.creator}</h5>
									<p>{c.comment}</p>
								</div>
              </div>;
					})}
					<form onSubmit={this.handleSubmit}>
						<input
							className="pool__form-input"
							onChange={this.handleChange}
							value={this.state.value}
							onKeyPress={this.handleKeyPress}
							placeholder="leave a comment..."
						/>
						<input
							className="pool__form-submit"
							type="submit"
							value="Submit"
						/>
					</form>
				</div>
      </div>
    );
  }
}

const mstp = ({ pools, auth }) => {
  return { pools, auth };
};

export default connect(mstp, actions)(PoolDetail);