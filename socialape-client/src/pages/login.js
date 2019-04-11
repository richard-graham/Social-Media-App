import React, { Component } from 'react'
import withStyles from '@material-ui/core/styles/withStyles'
import PropTypes from 'prop-types'
import AppIcon from '../images/monkey-150958_1280.png'
import axios from 'axios'
import { Link } from 'react-router-dom'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'
import CircularProgress from '@material-ui/core/CircularProgress'

const styles = {
  form: {
    textAlign: 'center'
  },
  icon: {
    maxWidth: '80px',
    margin: '20px auto'
  },
  pageTitle: {
    margin: '10px auto',
  },
  textField: {
    margin: '10px auto'
  },
  button: {
    marginTop: 20,
    position: 'relative'
  },
  customError: {
    color: 'red',
    fontSize: '0.8rem',
    margin: '10px auto'
  },
  buttonProgress: {
    position: 'absolute'
  }
}

export class login extends Component {
  constructor(props){
    super(props)
    this.state = {
      email: '',
      password: '',
      loading: false,
      errors: {}
    }
  }

  handleSubmit = (event) => {
    event.preventDefault()
    this.setState({
      loading: true
    })
    const userData = {
      email: this.state.email,
      password: this.state.password
    }
    axios.post('/login', userData)
      .then(res => {
        console.log(res.data);
        this.setState({
          loading: false
        })
        this.props.history.push('/')
      })
      .catch(err => {
        this.setState({
          errors: err.response.data,
          loading: false
        })
      })
  }

  handleChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value
    })
  }

  render() {
    const { classes } = this.props
    const { errors, loading } = this.state
    return (
      <Grid container className={classes.form}>
        <Grid item sm />
        <Grid item sm>
          <img src={AppIcon} alt='Monkey Image' className={classes.icon} />
          <Typography variant='h2' className={classes.pageTitle}>
            Login
          </Typography>
          <form noValidate onSubmit={this.handleSubmit}>
            <TextField 
              id='email'
              name='email'
              type='email'
              label='Email'
              helperText={errors.email}
              error={errors.email ? true : false}
              className={classes.textField}
              value={this.state.email}
              onChange={this.handleChange}
              fullWidth
            />
            <TextField 
              id='password'
              name='password'
              type='password'
              label='Password'
              helperText={errors.password}
              error={errors.password ? true : false}
              className={classes.textField}
              value={this.state.password}
              onChange={this.handleChange}
              fullWidth
            />
            {errors.general && (
              <Typography variant='body2' className={classes.customError}>
                {errors.general}
              </Typography>
            )}
            <Button 
              type="submit"
              variant='contained'
              color='primary'
              className={classes.button}
              disabled={loading}
            >
            Login
            {loading && <CircularProgress size={24} className={classes.buttonProgress} />}
            </Button>
            <br />
            <small className={classes.signUpLink}>Don't have an account? Sign up <Link to='/signup'>here</Link>.</small>
          </form>
        </Grid>
        <Grid item sm />
      </Grid>
    )
  }
}

login.propTypes = {
  classes: PropTypes.object.isRequired
}

export default withStyles(styles)(login)
 