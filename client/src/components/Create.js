import React, { Component } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import axios from 'axios';
import { UploadIcon } from 'mdi-react';
import Chart from './Chart';
import * as actions from '../actions/index';
import './styles/chart.css';
import './styles/create.css';
import './styles/loader.css';
import './styles/global.css';
import './styles/media.css';
const fs = require('fs');

class Create extends Component {
  state = {
    contributors: '',
    error: '',
    visible: false,
    imageErr: '',
    imageLoading: false,
    selectedFile: null,
    path: null,
    amount: '',
    startDate: '',
    dateInputType: 'text'
  };

  componentDidMount() {
    if (this.props.pools.chart) {
      this.props.reset();
    }
  }

  //'handle' Functions
  handleChart = () => {
    if (this.props.pools.chart) {
      return (
        <div className="chart-wrap">
          {!this.props.user ? (
            <h2 className="text-2">3. Pick a Position</h2>
          ) : null}
          <Chart
            onSubmit={this.props.onSubmit}
            chart={this.props.pools.chart}
            state={this.state}
          />
          <p>*Amount before platform fee</p>
          <p>**1% Platform Fee (administered on Disbursement Date)</p>
        </div>
      );
    }
    return null;
  };
  handleChange = event => {
    const { error } = this.props.pools;
    //resetAll
    this.props.reset();
    //if error, reset error
    error && this.props.resetError();
    //hide renderReview()
    this.setState({ visible: false });
    //if user changes numOfContributors, reset all options & chart
    if (event.target.name === 'contributors') {
      this.setState({
        amount: null,
        rate: null,
        startDate: null,
        dateInputType: 'text'
      });
      this.props.reset();
    }
    if (event.target.name === 'startDate') {
      this.setState({ dateInputType: 'date' });
    }
    //set error states
    this.setState({ [event.target.name + 'Err']: '' });
    //set value states
    this.setState({ [event.target.name]: event.target.value }, () => {
      if (this.state.startDate) {
        //check for future dates
        if (moment(this.state.startDate).format('L') <= moment().format('L')) {
          this.setState({ startDateErr: 'Date must be in the future' });
          this.props.reset();
          return;
        }
      }
      //create chart if all states exist
      if (
        this.state.contributors &&
        this.state.amount &&
        this.state.rate &&
        this.state.startDate
      ) {
        let obj = {};
        obj['amount'] = this.state.amount;
        obj['contributors'] = this.state.contributors;
        obj['rate'] = this.state.rate;
        obj['startDate'] = this.state.startDate;
        obj['title'] = this.state.title;
        obj['category'] = this.state.category;
        obj['description'] = this.state.description;
        this.props.createChart(obj);
      }
    });
	};
	
	handeChangeII = e => {
		e.preventDefault();
		let reader = new FileReader();
		let file = e.target.files[0];
		reader.onloadend = () => {
			this.setState({
				imageErr: "",
				selectedFile: file,
				imagePreviewUrl: reader.result
			});
		}
		file && reader.readAsDataURL(file)
	};

  upload = async () => {
    this.setState({ imageLoading: true });
    if (this.state.selectedFile && !this.state.uploadSuccess) {
      const fd = new FormData();
      fd.append('image', this.state.selectedFile, this.state.selectedFile.name);
      const res = await axios.post('/api/upload', fd);
      if (res.data.err) {
        this.setState({ imageErr: res.data.err });
      } else {
        this.setState({
          imageErr: '',
          path: res.data.secure_url,
          uploadSuccess: true,
          imageLoading: false,
          relative: `${res.data.original_filename}.${res.data.format}`
        });
      }
    } else {
      this.setState({ imageErr: 'Error: No File Selected!' });
    }
  };

  handleMouseDown = event => {
    this.setState({ dateInputType: 'date' });
    this.setState({ startDateErr: '' });
  };
  handleNext() {
    if (this.props.pools.selection === '') {
      this.props.setError('Please Select a Position in the Chart');
    } else if (!this.state.title) {
      window.scrollTo(0, 0);
      this.setState({ titleErr: 'Required Field' });
    } else if (!this.state.selectedFile) {
      window.scrollTo(0, 0);
      this.setState({ imageErr: 'Required Field' });
    } else if (!this.state.category) {
      window.scrollTo(0, 0);
      this.setState({ categoryErr: 'Required Field' });
    } else if (!this.state.description) {
      window.scrollTo(0, 0);
      this.setState({ descriptionErr: 'Required Field' });
    } else {
      this.setState({ visible: true });
    }
  }
  handleSubmit = chart => {
    const { history, createPool, pools } = this.props;
    const dDate = moment(chart[pools.selection].startDate)
      .add(pools.selection, 'months')
      .format('L');
    const endDate = moment(chart[pools.selection].startDate)
      .add(chart.length - 1, 'months')
      .format('L');
    let values = {};

    values['title'] = this.state.title;
    values['description'] = this.state.description;
    values['category'] = this.state.category;
    values['contributors'] = this.state.contributors;
    values['rate'] = this.state.rate;
    values['amount'] = this.state.amount;
    values['position'] = pools.selection;
    values['startDate'] = moment(this.state.startDate).format('L');
    values['dDate'] = dDate;
    values['endDate'] = endDate;
    values['monthly'] = chart[pools.selection].monthly;
    values['disburseAmount'] = chart[pools.selection].tcr;
    values['poolPic'] = this.state.path;
    createPool(values, history);
  };

  //'render' Functions
  renderAmount = () => {
    if (this.state.contributors) {
      let n = this.state.contributors;
      let value = n * 100;
      const handleText = (value, num) => {
        let number = value * num;
        return parseFloat(number).toLocaleString('USD', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        });
      };
      return (
        <select
          name="amount"
          className="form-input select"
          onChange={this.handleChange}
          value={this.state.amount || ''}
        >
          <option value="">Amount</option>
          <option value={value * 2}>{handleText(value, 2)}</option>
          <option value={value * 3}>{handleText(value, 3)}</option>
          <option value={value * 4}>{handleText(value, 4)}</option>
          <option value={value * 5}>{handleText(value, 5)}</option>
          <option value={value * 6}>{handleText(value, 6)}</option>
          <option value={value * 7}>{handleText(value, 7)}</option>
          <option value={value * 8}>{handleText(value, 8)}</option>
        </select>
      );
    }
    return null;
  };

  renderRate = () => {
    if (this.state.amount) {
      return (
        <select
          name="rate"
          className="form-input select"
          onChange={this.handleChange}
          value={this.state.rate || ''}
        >
          <option value="">Rate</option>
          <option value="5">5%</option>
          <option value="7">7%</option>
          <option value="9">9%</option>
          <option value="10">10%</option>
        </select>
      );
    }
    return null;
  };

  renderDate = () => {
    if (this.state.rate) {
      const { startDateErr } = this.state;
      return (
        <div>
          <input
            onChange={this.handleChange}
            onMouseDown={this.handleMouseDown}
            className="form-input"
            type={this.state.dateInputType}
            name="startDate"
            placeholder="Start Date"
            value={this.state.startDate || ''}
          />
          <div className="alert">{startDateErr ? startDateErr : null}</div>
        </div>
      );
    }
    return null;
  };
  renderReview = () => {
    window.scrollTo(0, 0);
    const { chart, selection, createError } = this.props.pools;
    const position = chart[selection];
    return (
      <div className="tab">
				{createError ? <h1 className="cancel">{createError}</h1> : null}
        <button
					className="mid-btn"
          onClick={() => this.setState({ visible: false })}
        >
          Go Back
        </button>
        <h2 className="text-2">4. Review Your Pool</h2>
        <div
          className="card__card card_thumb"
          style={{ backgroundImage: `url(${this.state.path})` }}
        />
        <div>
          <p className="form-display">
            <span>Title:</span> {this.state.title}
          </p>
          <p className="form-display">
            <span>Category:</span> {this.state.category}
          </p>
          <p className="form-display">
            <span>Description:</span> {this.state.description}
          </p>
          <p className="form-display">
            <span>Number of Contributors:</span> {this.state.contributors}
          </p>
          <p className="form-display">
            <span>Amount:</span>{' '}
            {parseFloat(this.state.amount).toLocaleString('USD', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            })}
          </p>
          <p className="form-display">
            <span>Rate:</span> {this.state.rate}%
          </p>
          <p className="form-display">
            <span>Start Date:</span> {moment(this.state.date).format('L')}
          </p>
        </div>
        <div>
          <h2 className="text-2">
            <span>Your Position:</span>
          </h2>
          <table>
            <thead>
              <tr>
                <th>Base Amount</th>
                <th>Interest Rate</th>
                <th>Interest Paid/Earned</th>
                <th>Monthly Payment</th>
                <th>Cash Paid</th>
                <th>Fee</th>
                <th>Disbursement Amount</th>
                <th>Disbursement Date</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{this.parse(position.amount)}</td>
                <td>{position.interestRate}%</td>
                <td>{this.parse(position.interestAmount)}</td>
                <td>{this.parse(position.monthly)}</td>
                <td>{this.parse(position.cashPaid)}</td>
                <td>${position.fee}</td>
                <td>{this.parse(position.tcr)}</td>
                <td>
                  {moment(position.startDate)
                    .add(selection, 'months')
                    .format('L')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ margin: '0 auto', textAlign: 'center' }}>
          <button
            className="mid-btn"
            type="submit"
            onClick={() => this.handleSubmit(chart)}
          >
            Submit*
          </button>
          {this.renderAgreement(chart, selection)}
        </div>
      </div>
    );
  };

  renderAgreement = (chart, selection) => {
    if (selection >= 0) {
      const position = chart[selection];
      const date = moment(position.startDate, 'YYYY/MM/DD');
      const day = date.format('Do');
      return (
        <h5 style={{ width: '535px' }}>
          *By clicking "Submit", you agree to pay {this.parse(position.monthly)}{' '}
          every {day} of the month (except on your disbursement date) for the
          next {chart.length} months, upon the commencement of this pool.
        </h5>
      );
    }
    return null;
  };

  parse = num => {
    return parseFloat(num).toLocaleString('USD', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  render() {
    const { error } = this.props.pools;
    const {
      titleErr,
      categoryErr,
      descriptionErr,
      visible,
      title,
      category,
      description,
      contributors,
      path,
      uploadSuccess,
      selectedFile,
			imageLoading,
			imagePreviewUrl,
			imageErr,
    } = this.state;
    if (!visible) {
      return (
        <div className="tab">
          <h1 className="tab-title">Start a pool</h1>
          <div className="tab-box-v">
            <h2 className="text-2">
              1. Give Your Pool a Name and Some Details
            </h2>
            <input
              className="form-input"
              type="text"
              value={title}
              name="title"
              placeholder="Title"
              onChange={this.handleChange}
            />
            <div className="alert">
              {titleErr ? <p className="cancel">{titleErr}</p> : null}
            </div>
            <select
              className="form-input select"
              name="category"
              onChange={this.handleChange}
              value={category}
            >
              <option value="">Category</option>
              <option value="Business">Business</option>
              <option value="Sports">Sports</option>
              <option value="Home Improvement">Home Improvement</option>
              <option value="Travel">Travel</option>
            </select>
            <div className="alert">
              {categoryErr ? <p className="cancel">{categoryErr}</p> : null}
            </div>
            <textarea
              name="description"
              className="form-input textarea"
              cols="40"
              rows="10"
              value={description}
              onChange={this.handleChange}
              placeholder="Please provide a description of your pool"
            />
            <div className="alert">
              {descriptionErr ? (
                <p className="cancel">{descriptionErr}</p>
              ) : null}
            </div>
            <div className="form-upload">
              <label className="form-file-label align-center">
                <UploadIcon size="24" color="gray" />&nbsp;Select or drag a picture (max 5MB)
              </label>
              <input type="file" onChange={this.handeChangeII} />
              {imageLoading ? (
                <div className="jumper">
                  <div />
                  <div />
                  <div />
                </div>
              ) : null}
							{imagePreviewUrl ? <div>
								<img className="img-preview" src={imagePreviewUrl} alt="" />
							</div> : null}
              {selectedFile && !uploadSuccess ? (
                <button onClick={() => this.upload()}>Upload</button>
              ) : null}
              {path ? (
                <button
                  onClick={() => {
                    fs.unlink(`../uploads/${this.state.relative}`, err => {
                      if (err) console.log(err);
                      console.log('the images was deleted');
                    });
                  }}
                >
                  Delete
                </button>
              ) : null}
            </div>
            {imageErr && <p className="alert">{imageErr}</p>}
            <h2 className="text-2">2. Choose Your Options</h2>
            <select
              name="contributors"
              className="form-input select"
              onChange={this.handleChange}
              value={contributors}
            >
              <option value="">Number of Contributors</option>
              <option value="5">5 contributors</option>
              <option value="7">7 contributors</option>
              <option value="9">9 contributors</option>
              <option value="11">11 contributors</option>
              <option value="13">13 contributors</option>
            </select>
            {this.renderAmount()}
            {this.renderRate()}
            {this.renderDate()}
            {this.handleChart()}
            <div className="alert">
              {error ? <p className="cancel">{error}</p> : null}
            </div>
            {this.props.pools.chart ? (
              <button
                className="mid-btn"
                type="submit"
                onClick={() => this.handleNext()}
              >
                Review
              </button>
            ) : null}
          </div>
        </div>
      );
    } else {
      return <div className="tab">{this.renderReview()}</div>;
    }
  }
}

const mstp = ({ pools, auth }) => {
  return { pools, auth };
};

export default connect(mstp, actions)(Create);
