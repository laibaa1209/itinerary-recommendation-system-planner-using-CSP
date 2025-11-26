import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-pastel-cream shadow-md border-b-2 border-pastel-red-light">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <Link to="/" className="text-2xl font-heading font-bold text-pastel-red-dark hover:text-pastel-red transition-colors">
                                Itinerary Planner
                            </Link>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link
                                to="/dashboard"
                                className="border-transparent text-text-light hover:border-pastel-red hover:text-pastel-red-dark inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
                            >
                                Dashboard
                            </Link>
                        </div>
                    </div>
                    <div className="hidden sm:ml-6 sm:flex sm:items-center">
                        {user ? (
                            <div className="flex items-center space-x-4">
                                <span className="text-sm text-text-dark font-body">Welcome!</span>
                                <Button onClick={handleLogout} className="w-auto" variant="secondary">
                                    Sign out
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <Link to="/login" className="text-text-light hover:text-pastel-red-dark px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                    Sign in
                                </Link>
                                <Link to="/register">
                                    <Button className="w-auto">
                                        Sign up
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
