import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import itineraryService from '../services/itineraryService';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const Dashboard = () => {
    const [itineraries, setItineraries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchItineraries = async () => {
            try {
                const data = await itineraryService.getAll();
                setItineraries(data);
            } catch (error) {
                console.error('Failed to fetch itineraries', error);
            } finally {
                setLoading(false);
            }
        };

        fetchItineraries();
    }, []);

    if (loading) {
        return <div className="text-center py-10 text-text-dark font-body">Loading itineraries...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-heading font-bold text-pastel-red-dark">My Itineraries</h1>
                <Link to="/itineraries/new">
                    <Button className="w-auto">Create New Itinerary</Button>
                </Link>
            </div>

            {itineraries.length === 0 ? (
                <Card className="text-center py-12 animate-slide-up">
                    <p className="text-text-light font-body mb-4">You haven't created any itineraries yet.</p>
                    <Link to="/itineraries/new">
                        <Button className="w-auto inline-block">Get Started</Button>
                    </Link>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {itineraries.map((itinerary, index) => (
                        <Card
                            key={itinerary.itinerary_id}
                            className="animate-slide-up hover:scale-105 transition-transform duration-300"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className="flex flex-col h-full justify-between">
                                <div>
                                    <h3 className="text-xl font-heading font-semibold text-pastel-red-dark mb-2">
                                        {itinerary.title}
                                    </h3>
                                    <p className="text-sm text-text-light font-body mb-4">
                                        {new Date(itinerary.start_date).toLocaleDateString()} - {new Date(itinerary.end_date).toLocaleDateString()}
                                    </p>
                                    {itinerary.total_budget && (
                                        <p className="text-sm text-text-dark font-body font-semibold mb-4">
                                            Budget: ${itinerary.total_budget}
                                        </p>
                                    )}
                                </div>
                                <div className="mt-4 flex space-x-3">
                                    <Link to={`/itineraries/${itinerary.itinerary_id}`} className="flex-1">
                                        <Button className="w-full" variant="secondary">
                                            View Details
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
