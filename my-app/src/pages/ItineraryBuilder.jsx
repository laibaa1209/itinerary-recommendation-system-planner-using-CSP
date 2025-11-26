import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import itineraryService from '../services/itineraryService';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

const ItineraryBuilder = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        start_date: '',
        end_date: '',
        total_budget: '',
    });

    useEffect(() => {
        if (id) {
            const fetchItinerary = async () => {
                try {
                    const data = await itineraryService.getById(id);
                    setFormData({
                        title: data.title,
                        start_date: data.start_date,
                        end_date: data.end_date,
                        total_budget: data.total_budget || '',
                    });
                } catch (err) {
                    setError('Failed to load itinerary details.');
                }
            };
            fetchItinerary();
        }
    }, [id]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = user.token;
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const payload = JSON.parse(jsonPayload);
            const userId = payload.sub;

            const dataToSend = {
                ...formData,
                user_id: parseInt(userId),
                total_budget: formData.total_budget ? parseFloat(formData.total_budget) : null
            };

            if (id) {
                await itineraryService.update(id, dataToSend);
            } else {
                await itineraryService.create(dataToSend);
            }
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError('Failed to save itinerary. Please check your inputs.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <h1 className="text-4xl font-heading font-bold text-pastel-red-dark mb-6">
                {id ? 'Edit Itinerary' : 'Create New Itinerary'}
            </h1>

            <Card className="animate-slide-up">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        id="title"
                        name="title"
                        label="Trip Title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        placeholder="e.g., Summer Trip to Paris"
                    />

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <Input
                            id="start_date"
                            name="start_date"
                            label="Start Date"
                            type="date"
                            value={formData.start_date}
                            onChange={handleChange}
                            required
                        />

                        <Input
                            id="end_date"
                            name="end_date"
                            label="End Date"
                            type="date"
                            value={formData.end_date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <Input
                        id="total_budget"
                        name="total_budget"
                        label="Total Budget ($)"
                        type="number"
                        value={formData.total_budget}
                        onChange={handleChange}
                        placeholder="0.00"
                    />

                    {error && (
                        <div className="text-red-600 text-sm font-body">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end space-x-3">
                        <Button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="w-auto"
                            variant="secondary"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="w-auto">
                            {loading ? 'Saving...' : (id ? 'Update Itinerary' : 'Create Itinerary')}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default ItineraryBuilder;
