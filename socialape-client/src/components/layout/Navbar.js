import React, { Component, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import MyButton from '../../util/MyButton'
import PostScream from '../scream/PostScream'
import Notifications from './Notifications'

// MUI stuff
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import Button from '@material-ui/core/Button'
import Typography from '@material-ui/core/Typography'
import withStyles from '@material-ui/core/styles/withStyles'
//icons
import HomeIcon from '@material-ui/icons/Home'

const styles = theme => ({
  headerAuth: {
    right: '140%',
    position: 'relative',
    fontFamily: "'Kalam', cursive",
    color: 'white',
    fontSize: 30,
    marginTop: 10
  },
  headerUnAuth: {
    right: '110%',
    position: 'relative',
    fontFamily: "'Kalam', cursive",
    color: 'white',
    fontSize: 30,
    marginTop: 10
  }
})

class Navbar extends Component {
  render() {
    const { authenticated, classes } = this.props
    return (
      <AppBar>
        <Toolbar className='nav-container'>
          {authenticated ? (
            <Fragment>
              <Typography className={classes.headerAuth}>
                Chimp-Chat
              </Typography>
              <PostScream />
              <Link to='/'>
                <MyButton tip='Home'>
                  <HomeIcon />
                </MyButton>
              </Link>
              <Notifications />
            </Fragment>
          ) : (
            <Fragment>
              <Typography className={classes.headerUnAuth}>
                Chimp-Chat
              </Typography>
              <Button color='inherit' component={Link} to='/login'>Login</Button>
              <Button color='inherit' component={Link} to='/'>Home</Button>
              <Button color='inherit' component={Link} to='/signup'>Signup</Button>
            </Fragment>
          )}
        </Toolbar>
      </AppBar>
    )
  }
}

Navbar.propTypes = {
  authenticated: PropTypes.bool.isRequired
}

const mapStateToProps = (state) => ({
  authenticated: state.user.authenticated
})

export default connect(mapStateToProps)(withStyles(styles)(Navbar))
