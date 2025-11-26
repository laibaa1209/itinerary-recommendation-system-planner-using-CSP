import api from './api';

const activityService = {
    getAll: async (itineraryId) => {
        const response = await api.get(`/activities/?itinerary_id=${itineraryId}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/activities/', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/activities/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        await api.delete(`/activities/${id}`);
    }
};

export default activityService;
