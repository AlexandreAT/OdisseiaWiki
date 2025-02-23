import { combineReducers } from 'redux';
import themesReducer from './themes/reducer';

const rootReducer = combineReducers({themesReducer});

export default rootReducer;