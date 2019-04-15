import { createStore, combineReducers, applyMiddleware } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension'
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
    applyMiddleware(...middleware)
  )
)

export default store