import React from 'react';
import { Home, TrendingUp, Download, ChevronRight } from 'lucide-react';

const Sidebar = ({ currentPage, onPageChange }) => {
  const navigationItems = [
    {
      id: 'model-metrics',
      label: 'Model Overview',
      icon: Home,
      description: 'Model metrics & info'
    },
    {
      id: 'predictions',
      label: 'Predictions',
      icon: TrendingUp,
      description: 'Generate & visualize'
    },
    {
      id: 'export',
      label: 'Export Data',
      icon: Download,
      description: 'Download results'
    }
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Navigation</h2>
        <p className="text-sm text-gray-500">Dashboard sections</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-700 shadow-sm'
                  : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-md ${
                  isActive 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm">{item.label}</div>
                  <div className="text-xs opacity-75">{item.description}</div>
                </div>
              </div>
              
              <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${
                isActive ? 'text-blue-600 transform rotate-90' : 'text-gray-400 group-hover:text-gray-600'
              }`} />
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            <span className="text-xs font-medium text-yellow-800">Data Source</span>
          </div>
          <p className="text-xs text-yellow-700">NASA POWER GEOS-IT</p>
          <p className="text-xs text-yellow-600 opacity-75">2020-present (~4 day delay)</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;