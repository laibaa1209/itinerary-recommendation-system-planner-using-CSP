import React from 'react';
import { Link } from 'react-router-dom';

const AuthLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1b0033] via-[#3b0f58] to-[#240046] relative overflow-hidden text-left">
            {/* Navigation Bar / Logo */}
            <nav className="absolute top-0 left-0 right-0 z-50 p-6">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-sm" />
                        <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-sm" />
                    </div>
                </div>
            </nav>

            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 border-8 border-white/10 rounded-full -translate-y-1/4 translate-x-1/4" />
            <div className="absolute top-1/4 right-1/4 w-64 h-64 border-8 border-white/10 rounded-full" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full -translate-x-1/3 translate-y-1/3 blur-3xl" />
            <div className="absolute bottom-1/4 right-1/3 w-48 h-48 bg-white/5 rounded-full blur-2xl" />

            {/* Main Content */}
            <div className="relative z-10 min-h-screen flex items-center justify-between px-12 py-24 gap-16">
                {/* Left: Welcome copy */}
                <div className="flex-1 max-w-xl">
                    <h1 className="text-7xl font-heading font-bold text-white mb-6 leading-tight">
                        Welcome!
                    </h1>
                    <div className="w-24 h-1 bg-white/60 mb-8" />
                    <p className="text-white/70 text-base font-body leading-relaxed mb-10 max-w-md">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                    </p>
                    <Link to="/dashboard">
                        <button className="px-10 py-3 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-full font-semibold text-base tracking-wide hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                            Learn More
                        </button>
                    </Link>
                </div>

                {/* Right: Auth content (page controls card + form) */}
                <div className="w-full max-w-md flex justify-end">{children}</div>
            </div>
        </div>
    );
};

export default AuthLayout;


