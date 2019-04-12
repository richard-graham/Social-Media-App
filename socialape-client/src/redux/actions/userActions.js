import { SET_USER, SET_ERRORS, CLEAR_ERRORS, LOADING_UI } from '../types'
import axios from 'axios'

export const loginUser = (userData, history) => (dispatch) => { //where is history coming from?
  dispatch({ type: LOADING_UI })
  axios.post('/login', userData)
      .then(res => {
        const FBIdToken = `Bearer ${res.data.token}`
        localStorage.setItem('FBIdToken', FBIdToken) // saves token to local storage in case of page refresh etc
        axios.defaults.headers.common['Authorization'] = FBIdToken
        dispatch(getUserData())
        dispatch({ type: CLEAR_ERRORS })
        history.push('/')
      })
      .catch(err => {
        dispatch({ 
          type: SET_ERRORS, 
          payload: err.response.data 
        })
      })
}

export const getUserData = () => (dispatch) => {
  axios.get('/user')
    .then(res => {
      dispatch({ 
        type: SET_USER,
        payload: res.data
      })
    })
    .catch(err => {
      console.log(err);
    })
}