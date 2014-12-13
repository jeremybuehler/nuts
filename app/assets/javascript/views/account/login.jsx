/**
 * @jsx React.DOM
 */

var React       = require('react');
var CSRF        = require('../shared/csrf.jsx');
var Input       = require('react-bootstrap/Input');
var Row         = require('react-bootstrap/Row');
var Col         = require('react-bootstrap/Col');
var Button      = require('react-bootstrap/Button');
var Alert       = require('react-bootstrap/Alert');
var Link        = require('react-router').Link;
var Navigation  = require('react-router').Navigation;


var Login = React.createClass({

  mixins: [Navigation],

  _onChange: function() {
    var newState = require('../../stores/session').attributes;
    newState.email = '';
    newState.password = '';
    this.setState(newState);
  },

  getInitialState: function() {
    return {
      isAuthenticated: false,
      email: '',
      password: '',
      error: null
    };
  },

  componentDidMount: function() {
    require('../../stores/session').on('change', this._onChange);
    this.refs.email.refs.input.getDOMNode().focus();
  },

  componentDidUpdate: function(prevProps, prevState) {
    this.refs.email.refs.input.getDOMNode().focus();
  },

  componentWillUnmount: function() {
    require('../../stores/session').off('change', this._onChange);
  },

  componentWillUpdate: function(nextProps, nextState) {
    if(nextState.isAuthenticated) {
      this.transitionTo('home');
    }
  },

  emailChanged: function(e) {
    this.setState({email: e.target.value});
  },

  passwordChanged: function(e) {
    this.setState({password: e.target.value});
  },

  handleSubmit: function(e) {
    e.preventDefault();
    var email = this.refs.email.refs.input.getDOMNode().value.trim();
    var password = this.refs.password.refs.input.getDOMNode().value.trim();
    require('../../actions/session').login(email, password);
  },

  render: function() {

    var alert;
    if(this.state.error) {
      alert = (
        <Alert bsStyle="danger">{this.state.error}</Alert>
      )
    }

    return (
      <div>
        <div className="page-header">
          <h3>Login</h3>
        </div>
        <Col xsOffset={2} xs={8}>
          {alert}
          <form className="form-horizontal" onSubmit={this.handleSubmit}>
            <CSRF value={this.props.csrf} />
            <Input type="email" ref="email" onChange={this.emailChanged} value={this.state.email} label="Email" hasFeedback  />
            <Input type="password" ref="password" label="Password" hasFeedback  />
            <div className="form-group">
              <Button type="submit" bsStyle="success">Login</Button>
              <Link className="btn btn-link" to="password-reset">Forgot your password?</Link>
            </div>
          </form>
        </Col>
      </div>
    );
  }

});

module.exports = Login;