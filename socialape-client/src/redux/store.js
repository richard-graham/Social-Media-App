import { createStore, combineReducers, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'

import dataReducer from './reducers/dataReducer'
import uiReducer from './reducers/uiReducer'
import userReducer from './reducers/userReducer'

const initState = {}

const middleware = [thunk]

const reducers = combineReducers({
  data: dataReducer,
  ui: uiReducer,
  user: userReducer
})

const store = createStore(
  reducers, 
  initState, 
  compose(
    applyMiddleware(...middleware), 
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
  )
)

export default store