import axios from 'axios'
import DashboardPage from "../dashboard/DashboardPage.jsx";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? 'http://10.252.63.18:3092/api',
})

// Добавление JWT-токена в заголовок каждого запроса
export function setupRequestInterceptor(store) {
    api.interceptors.request.use(config => {
        const state = store.getState();
        const token = state.user?.token || "";
        if (token)
            config.headers.Authorization = `Bearer ${token}`;
        return config;
    });
}

// Перехват ошибок связанных с истечением срока действия JWT-токена
export function setupResponseInterceptor(store, logout) {
    api.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response) {
                const {status} = error.response;
                if ([401, 503].includes(status))
                    logout();
            }
            return Promise.reject(error);
        }
    );
}

export const Login = (data) => api.post('auth/login', data);

export const getRecords = async () => {
    const {data} = await api.get('/data');
    console.log('data', data)
    return {data: Array.isArray(data) ? data : []};
};

export const getDashboard = async () => {
    const { data } = await api.get('/statistics');
    console.log('getDashboard', data)
    return data;
};

export const createRecord = async (payload) => {
    const { data } = await api.post('/data', payload);
    console.log('createData', data)
    return data;
};

export const deleteRecord = async (id) => {
    const { data } = await api.delete(`/data/${id}`);
    return data;
};

export const getCurators = async () => {
    const {data} = await api.get('/constants/curators')
    return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
}

export const getDepartments = async () => {
    const {data} = await api.get('/constants/department-names')
    return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
}

export const getHeads = async () => {
    const {data} = await api.get('/constants/department-heads')
    return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
}

export const getDti = async () => {
    const {data} = await api.get('/constants/dti')
    return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
}

export const getCustomersMiudol = async () => {
    const {data} = await api.get('/constants/customers-miudol')
    return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
}

export const getCustomersCa = async () => {
    const {data} = await api.get('/constants/customers-ca')
    return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
}

export const getTreeParents = async () => {
    const {data} = await api.get('/tree/function-ids/parents')
    return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
}

export const getTreeChildren = async () => {
    const {data} = await api.get('/tree/function-ids/children')
    return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
}

export const createTree = async (dataId,payload) => {
    const { data } = await api.post(`/tree/${dataId}`, payload);
    console.log('createTree', data)
    return data;
};

export const deleteTree = async (relationId) => {
    const { data } = await api.delete(`/tree/${relationId}`);
    return data;
};

/** Получить дерево функций по начальнику отдела */
export const getTreeByHead = async (departmentHeadId) => {
    const { data } = await api.get(`/tree/${departmentHeadId}`);
    return data;
};


export const patchRecord = (id, data) => api.patch(`/data/${id}`, data)

export const getWhoOffers = () => api.get('/constants/who-offers');

export const getExecutors = () => api.get('/constants/executors');

export const getWhoUses = () => api.get('/constants/who-uses');

export const getRecommendations = () => api.get('/recommendations');

export const createRecommendation = (data) => api.post('/recommendations', data);

export const statusChange = (id, status, comment) => api.patch(`/recommendations/${id}`, { status, comment });

export const deleteRecommendation = (id) => api.delete(`/recommendations/${id}`);

export const download = () => api.get('/download', {responseType: 'blob'});

export const downloadTreeStatistics = () => api.get('/download/tree-statistics', {responseType: 'blob'});
