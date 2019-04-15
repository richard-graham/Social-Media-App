import { createStore, combineReducers, applyMiddleware } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension/developmentOnly'
import thunk from 'redux-thunk'

import dataReducer from './reducers/dataReducer'
import uiReducer from './reducers/uiReducer'
import userReducer from './reducers/userReducer'

const initState = {}

const middleware = [thunk]

const reducers = combineReducers({
  data: dataReducer,
  UI: uiReducer,
  user: userReducer
})

const store = createStore(
  reducers, 
  initState, 
  composeWithDevTools(
    applyMiddleware(...middleware), 
    window.__REDUX_DEVTOOLS_EXTENSION__ ? window.__REDUX_DEVTOOLS_EXTENSION__() : f => f
  )
)

export default store