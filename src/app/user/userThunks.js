import {Login} from "../../features/records/api.js";



export const thunkLoginUser = async (formData, { rejectWithValue }) => {
    if (!formData.login || !formData.password)
        return rejectWithValue('Заполните логин и пароль')
    try {
        const data = {
            login: formData.login,
            password: formData.password,
        };
        const response = await Login(data);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response.data.message || 'Ошибка при авторизации')
    }
};