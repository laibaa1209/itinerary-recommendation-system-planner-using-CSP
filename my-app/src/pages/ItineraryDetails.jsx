import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import itineraryService from '../services/itineraryService';
import cityService from '../services/cityService';
import activityService from '../services/activityService';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';

const ItineraryDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [itinerary, setItinerary] = useState(null);
    const [cities, setCities] = useState([]);
    const [allCities, setAllCities] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [selectedCityId, setSelectedCityId] = useState('');
    const [showActivityForm, setShowActivityForm] = useState(false);
    const [activityData, setActivityData] = useState({
        day_no: 1,
        start_time: '',
        notes: '',
        place_id: ''
    });

    const fetchData = async () => {
        try {
            const itinData = await itineraryService.getById(id);
            setItinerary(itinData);

            const actData = await activityService.getAll(id);
            setActivities(actData);

            const citiesData = await cityService.getAll();
            setAllCities(citiesData);

            if (itinData.cities) {
                setCities(itinData.cities);
            }

        } catch (err) {
            console.error(err);
            setError('Failed to load itinerary details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id]);

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this itinerary?")) {
            try {
                await itineraryService.delete(id);
                navigate('/dashboard');
            } catch (err) {
                setError("Failed to delete itinerary");
            }
        }
    }

    const handleAddCity = async (e) => {
        e.preventDefault();
        if (!selectedCityId) return;
        try {
            await itineraryService.addCity(id, selectedCityId);
            fetchData();
            setSelectedCityId('');
        } catch (err) {
            alert('Failed to add city. It might already be added.');
        }
    }

    const handleRemoveCity = async (cityId) => {
        if (!window.confirm("Remove this city?")) return;
        try {
            await itineraryService.removeCity(id, cityId);
            fetchData();
        } catch (err) {
            alert('Failed to remove city.');
        }
    }

    const handleAddActivity = async (e) => {
        e.preventDefault();
        try {
            await activityService.create({
                ...activityData,
                itinerary_id: parseInt(id),
                start_time: activityData.start_time ? activityData.start_time + ":00" : null
            });
            setShowActivityForm(false);
            setActivityData({ day_no: 1, start_time: '', notes: '', place_id: '' });
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to add activity.');
        }
    }

    if (loading) return <div className="text-center py-10 text-text-dark font-body">Loading...</div>;
    if (error) return <div className="text-center py-10 text-red-600 font-body">{error}</div>;
    if (!itinerary) return <div className="text-center py-10 text-text-dark font-body">Itinerary not found.</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="flex-1 min-w-0">
                    <h2 className="text-4xl font-heading font-bold text-pastel-red-dark">
                        {itinerary.title}
                    </h2>
                    <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                        <div className="mt-2 flex items-center text-sm text-text-light font-body">
                            {new Date(itinerary.start_date).toLocaleDateString()} - {new Date(itinerary.end_date).toLocaleDateString()}
                        </div>
                        {itinerary.total_budget && (
                            <div className="mt-2 flex items-center text-sm text-text-dark font-body font-semibold">
                                Budget: ${itinerary.total_budget}
                            </div>
                        )}
                    </div>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                    <Link to={`/itineraries/${id}/edit`}>
                        <Button className="w-auto" variant="secondary">
                            Edit
                        </Button>
                    </Link>
                    <Button onClick={handleDelete} className="w-auto" variant="danger">
                        Delete
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="animate-slide-up">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-heading font-semibold text-pastel-red-dark">Itinerary Plan</h3>
                            <Button onClick={() => setShowActivityForm(!showActivityForm)} className="w-auto text-xs" variant="secondary">
                                {showActivityForm ? 'Cancel' : 'Add Activity'}
                            </Button>
                        </div>

                        {showActivityForm && (
                            <div className="mb-6 bg-pastel-red-light bg-opacity-20 p-4 rounded-md">
                                <form onSubmit={handleAddActivity} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Day No."
                                            type="number"
                                            value={activityData.day_no}
                                            onChange={e => setActivityData({ ...activityData, day_no: parseInt(e.target.value) })}
                                            required
                                        />
                                        <Input
                                            label="Start Time"
                                            type="time"
                                            value={activityData.start_time}
                                            onChange={e => setActivityData({ ...activityData, start_time: e.target.value })}
                                        />
                                    </div>
                                    <Input
                                        label="Notes/Description"
                                        value={activityData.notes}
                                        onChange={e => setActivityData({ ...activityData, notes: e.target.value })}
                                        required
                                    />
                                    <Button type="submit">Save Activity</Button>
                                </form>
                            </div>
                        )}

                        {activities.length === 0 ? (
                            <p className="text-text-light font-body">No activities planned yet.</p>
                        ) : (
                            <div className="space-y-4">
                                {activities.map((activity) => (
                                    <div key={activity.activity_id} className="border-l-4 border-pastel-red pl-4 py-2 bg-pastel-red-light bg-opacity-20 rounded-r-md hover:bg-opacity-30 transition-all">
                                        <div className="flex justify-between">
                                            <h4 className="font-heading font-bold text-pastel-red-dark">Day {activity.day_no}</h4>
                                            <span className="text-sm text-text-light font-body">{activity.start_time}</span>
                                        </div>
                                        <p className="text-text-dark font-body mt-1">{activity.notes}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <h3 className="text-2xl font-heading font-semibold text-pastel-red-dark mb-4">Cities</h3>

                        <form onSubmit={handleAddCity} className="mb-4 flex space-x-2">
                            <select
                                className="block w-full pl-3 pr-10 py-2 text-base border-2 border-pastel-red-light bg-white focus:outline-none focus:ring-2 focus:ring-pastel-red focus:border-pastel-red sm:text-sm rounded-md font-body transition-all"
                                value={selectedCityId}
                                onChange={(e) => setSelectedCityId(e.target.value)}
                            >
                                <option value="">Select a city...</option>
                                {allCities.map(city => (
                                    <option key={city.city_id} value={city.city_id}>{city.name}</option>
                                ))}
                            </select>
                            <Button type="submit" className="w-auto px-3">Add</Button>
                        </form>

                        {cities && cities.length > 0 ? (
                            <ul className="divide-y divide-pastel-red-light">
                                {cities.map((city) => (
                                    <li key={city.city_id} className="py-3 flex justify-between items-center">
                                        <span className="text-sm font-medium text-text-dark font-body">{city.name}</span>
                                        <button
                                            onClick={() => handleRemoveCity(city.city_id)}
                                            className="text-red-600 hover:text-red-800 text-xs font-body transition-colors"
                                        >
                                            Remove
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-text-light font-body">No cities added.</p>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ItineraryDetails;
