import api from './api';

const itineraryService = {
    getAll: async () => {
        const response = await api.get('/itineraries/');
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/itineraries/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/itineraries/', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/itineraries/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        await api.delete(`/itineraries/${id}`);
    },

    addCity: async (itineraryId, cityId) => {
        const response = await api.post(`/itineraries/${itineraryId}/cities/${cityId}`);
        return response.data;
    },

    removeCity: async (itineraryId, cityId) => {
        await api.delete(`/itineraries/${itineraryId}/cities/${cityId}`);
    }
};

export default itineraryService;
