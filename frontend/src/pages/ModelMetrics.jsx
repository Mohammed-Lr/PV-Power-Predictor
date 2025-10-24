import React, { useState, useEffect } from 'react';
import { Sun, Database, Activity, Globe, Calendar, Zap, CheckCircle, AlertCircle } from 'lucide-react';

const ModelMetrics = () => {
  const [modelMetrics, setModelMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchModelMetrics();
  }, []);

  const fetchModelMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/model-metrics');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setModelMetrics(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching model metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading model information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <h3 className="text-lg font-semibold text-red-800">Error Loading Model</h3>
        </div>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={fetchModelMetrics}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-8 shadow-lg">
        <div className="flex justify-center mb-4">
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-4">
            <Sun className="w-12 h-12" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-4">Welcome to {modelMetrics?.model_name}</h1>
        <p className="text-xl opacity-90 mb-2">Solar Energy Production Prediction Dashboard</p>
        <p className="text-lg opacity-75">
          Powered by NASA POWER meteorological data and advanced machine learning
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Model Status</h2>
              <p className="text-gray-600">Current system information</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-700">Status</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="font-semibold text-green-700 capitalize">{modelMetrics?.status}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-700">Model Type</span>
              <span className="font-semibold text-gray-900">{modelMetrics?.model_type}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-700">Features Count</span>
              <span className="font-semibold text-gray-900">{modelMetrics?.features_count}</span>
            </div>
            
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-700">Training Period</span>
              <span className="font-semibold text-gray-900">{modelMetrics?.training_period}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Data Source</h2>
              <p className="text-gray-600">NASA POWER information</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-700">Data Source</span>
              <span className="font-semibold text-gray-900">{modelMetrics?.data_source}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-700">Coverage</span>
              <span className="font-semibold text-gray-900">{modelMetrics?.temporal_coverage}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-700">Geographic Scope</span>
              <span className="font-semibold text-gray-900">{modelMetrics?.spatial_coverage}</span>
            </div>
            
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-700">Update Frequency</span>
              <span className="font-semibold text-gray-900">
                {modelMetrics?.performance_metrics?.update_frequency}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-purple-100 p-2 rounded-lg">
            <Activity className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Key Parameters</h2>
            <p className="text-gray-600">Meteorological variables used in predictions</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {modelMetrics?.parameters_used?.slice(0, 8).map((param, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                <span className="text-white text-xs font-bold">{index + 1}</span>
              </div>
              <p className="text-sm font-medium text-gray-900">{param}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center space-x-3 mb-4">
            <Globe className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">Global Coverage</h3>
              <p className="text-sm text-blue-700">Worldwide locations</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-900">
            {modelMetrics?.geographic_info?.lat_range} × {modelMetrics?.geographic_info?.lon_range}
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center space-x-3 mb-4">
            <Calendar className="w-8 h-8 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900">Data Quality</h3>
              <p className="text-sm text-green-700">NASA validated</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-green-900">
            {modelMetrics?.performance_metrics?.data_quality}
          </p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-orange-100 rounded-xl p-6 border border-yellow-200">
          <div className="flex items-center space-x-3 mb-4">
            <Zap className="w-8 h-8 text-orange-600" />
            <div>
              <h3 className="font-semibold text-orange-900">Predictions</h3>
              <p className="text-sm text-orange-700">Daily energy output</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-orange-900">
            {modelMetrics?.performance_metrics?.prediction_unit}
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-indigo-900 mb-4">Getting Started</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-indigo-800 mb-2">🎯 Ready to make predictions?</h4>
            <p className="text-indigo-700 text-sm mb-3">
              Navigate to the Predictions page to select your location and date range for solar energy forecasting.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-indigo-800 mb-2">📊 Export your analysis</h4>
            <p className="text-indigo-700 text-sm">
              After generating predictions, visit the Export page to download your results as Excel files for further analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelMetrics;