import.meta.hot?.decline();
import {combineReducers, configureStore} from '@reduxjs/toolkit'
import {persistStore, persistReducer} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import userReducer from './user/userSlice.js';
import recordsReducer from '../features/records/recordsSlice'
import uiReducer from '../features/ui/uiSlice'
import {setupRequestInterceptor, setupResponseInterceptor} from "../features/records/api.js";
import {clearUser} from "./user/userSlice.js";
import proposalSlice from "../features/proposals/proposalSlice.js";
import treeReducer from '../features/tree/treeSlice';


const persistConfig = {
    key: 'root',
    storage,
    whitelist: ["user"]
}

const rootReducer = combineReducers({
    user: userReducer,
    records: recordsReducer,
    ui: uiReducer,
    proposal: proposalSlice,
    tree: treeReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Создаем хранилище
export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false
        }),
});

export const persistor = persistStore(store)

export default function logout() {
    store.dispatch(clearUser());
    // store.dispatch(clearData());
    // store.dispatch(clearUi());
}

setupRequestInterceptor(store);
setupResponseInterceptor(store, logout);