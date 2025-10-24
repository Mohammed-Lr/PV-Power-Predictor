import React from 'react';
import { Sun, Activity, Zap } from 'lucide-react';

const TopBar = () => {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-md">
            <Sun className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">First pv model</h1>
            <p className="text-sm text-gray-500">Solar Production Prediction Dashboard</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Activity className="w-4 h-4 text-green-500" />
              <span>NASA POWER</span>
            </div>
            <div className="flex items-center space-x-1">
              <Zap className="w-4 h-4 text-blue-500" />
              <span>ML Predictions</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">Live</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;