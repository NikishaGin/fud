import {createAsyncThunk, createSlice} from "@reduxjs/toolkit";
import { useSelector } from "react-redux";
import { thunkLoginUser } from "./userThunks.js";


const Role = {
    ADMIN: 'ADMIN', // Администратор
    MIUDOL: 'MIUDOL', // МИУДОЛ
    REPRESENTATIVE_CA: 'REPRESENTATIVE_CA', // Представилель центрального аппарата
    HEAD_INSPECTION: 'HEAD_INSPECTION', // Начальник инспекции (МИУДОЛ)
    CURATOR: 'CURATOR', // Куратор проекта, заместитель начальника инспекции (МИУДОЛ / ЦА)
    HEAD_DEPARTMENT: 'HEAD_DEPARTMENT', // Начальник отдела (МИУДОЛ / ЦА)
    URZ: 'URZ', // УРЗ
    UOPB: 'UOPB', // УОПБ
}


export const fetchLoginUser = createAsyncThunk(
    'user/fetchLoginUser',
    thunkLoginUser
);


const initialState = {
    messageAuth: '',
    userId: null,
    roles: null,
    token: null
};

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        clearUser: () => initialState,
    },
    extraReducers: builder => {
        builder
            .addCase(fetchLoginUser.fulfilled, (state, { payload }) => {
                state.userId = payload.user.userId;
                state.roles = payload.user.roles;
                state.token = payload.token;
                state.messageAuth = '';
            })
            .addCase(fetchLoginUser.rejected, (state, { payload }) => {
                state.messageAuth = payload;
            })
    }
});


export const { clearUser } = userSlice.actions;


export const useIsAuth = () => {
    const token = useSelector(state => state.user.token) || null;
    return !!token && (token.length > 0);
};

export const useMessageAuth = () => useSelector(state => state.user.messageAuth);

export const useRoleDetection = () => {
    const roles = useSelector(state => state.user.roles) || [];
    return {
        isAdmin: roles.includes(Role.ADMIN),
        isRepresentativeCA: roles.includes(Role.REPRESENTATIVE_CA),
    }
}

export default userSlice.reducer;