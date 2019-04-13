import { 
  SET_SCREAMS, 
  LIKE_SCREAM, 
  UNLIKE_SCREAM, 
  LOADING_DATA, 
  DELETE_SCREAM,
  POST_SCREAM
} from '../types'

const initialState = {
  screams: [],
  scream: {},
  loading: false
}

export default function(state = initialState, action){
  switch(action.type){
    case LOADING_DATA:
      return {
        ...state,
        loading: true
      }
    case SET_SCREAMS:
      return {
        ...state,
        screams: action.payload,
        loading: false
      }
    case LIKE_SCREAM:
    case UNLIKE_SCREAM: // in both cases do the same thing
      let index = state.screams.findIndex((scream) => scream.screamId === action.payload.screamId) //gives us the index from the scream passed into the action
      state.screams[index] = action.payload // replace it in state with the version with updated likes
      return {
        ...state
      }
    case DELETE_SCREAM: // instead of doing a full reload just delete the scream locally in state
      index = state.screams.findIndex(scream => scream.screamId === action.payload)
      state.screams.splice(index, 1)
      return {
        ...state
      }
    case POST_SCREAM:
      return {
        ...state,
        screams: [
          action.payload, //puts the new scream to the front 
          ...state.screams
        ]
      }
    default:
     return state
  }
}