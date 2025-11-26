import api from './api';

const cityService = {
    getAll: async () => {
        const response = await api.get('/cities/');
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/cities/${id}`);
        return response.data;
    },
};

export default cityService;
