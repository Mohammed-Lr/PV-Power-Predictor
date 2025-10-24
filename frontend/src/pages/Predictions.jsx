import React, { useState, useContext } from 'react';
import { MapPin, Calendar, Zap, DollarSign, TrendingUp, CloudSun, AlertTriangle, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { AppContext } from '../context/AppContext';

const Predictions = () => {
  const { predictions, setPredictions, summary, setSummary, metadata, setMetadata } = useContext(AppContext);
  
  const [formData, setFormData] = useState({
    latitude: '',
    longitude: '',
    startDate: '',
    endDate: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    
    // Latitude validation
    const lat = parseFloat(formData.latitude);
    if (!formData.latitude) {
      errors.latitude = 'Latitude is required';
    } else if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.latitude = 'Latitude must be between -90 and 90';
    }
    
    // Longitude validation
    const lng = parseFloat(formData.longitude);
    if (!formData.longitude) {
      errors.longitude = 'Longitude is required';
    } else if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.longitude = 'Longitude must be between -180 and 180';
    }
    
    // Date validation
    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }
    if (!formData.endDate) {
      errors.endDate = 'End date is required';
    }
    
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const today = new Date();
      
      if (start >= end) {
        errors.endDate = 'End date must be after start date';
      }
      
      if (end > today) {
        errors.endDate = 'End date cannot be in the future';
      }
      
      const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
      if (daysDiff > 365) {
        errors.endDate = 'Date range cannot exceed 1 year';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5000/api/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          start_date: formData.startDate,
          end_date: formData.endDate
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setPredictions(data.predictions);
        setSummary(data.summary);
        setMetadata(data.metadata);
        setError(null);
      } else {
        throw new Error('Prediction generation failed');
      }
      
    } catch (err) {
      setError(err.message);
      console.error('Error generating predictions:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatChartData = (predictions) => {
    return predictions.map(pred => ({
      date: new Date(pred.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      production: pred.pv_production_kwh,
      savings: pred.financial_savings_mad,
      fullDate: pred.date
    }));
  };

  const getMaxRecommendedEndDate = () => {
    if (!formData.startDate) return '';
    
    const startDate = new Date(formData.startDate);
    const maxDate = new Date(startDate);
    maxDate.setDate(maxDate.getDate() + 365);
    
    const today = new Date();
    const recommendedEnd = maxDate > today ? today : maxDate;
    
    return recommendedEnd.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center bg-gradient-to-r from-green-600 to-blue-700 text-white rounded-2xl p-8 shadow-lg">
        <div className="flex justify-center mb-4">
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-4">
            <TrendingUp className="w-12 h-12" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-4">Generate PV Predictions</h1>
        <p className="text-xl opacity-90 mb-2">Enter your location and date range to forecast solar energy production</p>
        <p className="text-lg opacity-75">Powered by NASA POWER meteorological data</p>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-blue-100 p-2 rounded-lg">
            <MapPin className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Location & Date Selection</h2>
            <p className="text-gray-600">Configure your prediction parameters</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Latitude Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Latitude
              </label>
              <input
                type="number"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                step="any"
                min="-90"
                max="90"
                placeholder="e.g., 33.5731 (Casablanca)"
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  validationErrors.latitude ? 'border-red-500' : ''
                }`}
              />
              {validationErrors.latitude && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.latitude}</p>
              )}
            </div>

            {/* Longitude Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Longitude
              </label>
              <input
                type="number"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                step="any"
                min="-180"
                max="180"
                placeholder="e.g., -7.5898 (Casablanca)"
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  validationErrors.longitude ? 'border-red-500' : ''
                }`}
              />
              {validationErrors.longitude && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.longitude}</p>
              )}
            </div>

            {/* Start Date Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  validationErrors.startDate ? 'border-red-500' : ''
                }`}
              />
              {validationErrors.startDate && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.startDate}</p>
              )}
            </div>

            {/* End Date Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                max={getMaxRecommendedEndDate()}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  validationErrors.endDate ? 'border-red-500' : ''
                }`}
              />
              {validationErrors.endDate && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.endDate}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating Predictions...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>Generate Predictions</span>
                </div>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Prediction Error</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {predictions && predictions.length > 0 && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center space-x-3 mb-2">
                <Calendar className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-900">Total Days</h3>
                </div>
              </div>
              <p className="text-2xl font-bold text-blue-900">{summary?.total_days}</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center space-x-3 mb-2">
                <Zap className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">Total Production</h3>
                </div>
              </div>
              <p className="text-2xl font-bold text-green-900">{summary?.total_production_kwh} kWh</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-100 rounded-xl p-6 border border-yellow-200">
              <div className="flex items-center space-x-3 mb-2">
                <DollarSign className="w-8 h-8 text-orange-600" />
                <div>
                  <h3 className="font-semibold text-orange-900">Total Savings</h3>
                </div>
              </div>
              <p className="text-2xl font-bold text-orange-900">{summary?.total_savings_mad} MAD</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center space-x-3 mb-2">
                <CloudSun className="w-8 h-8 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-purple-900">Avg Daily</h3>
                </div>
              </div>
              <p className="text-2xl font-bold text-purple-900">{summary?.avg_daily_production_kwh} kWh</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Production Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Production Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={formatChartData(predictions)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${value} kWh`, 'Production']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="production" 
                    stroke="#2563eb" 
                    strokeWidth={2}
                    dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Financial Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Financial Savings</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={formatChartData(predictions)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${value} MAD`, 'Savings']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Bar dataKey="savings" fill="#16a34a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Metadata */}
          {metadata && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-indigo-900 mb-4">Prediction Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-indigo-800">Location:</span>
                  <span className="ml-2 text-indigo-700">{metadata.location}</span>
                </div>
                <div>
                  <span className="font-medium text-indigo-800">Conversion Rate:</span>
                  <span className="ml-2 text-indigo-700">{metadata.conversion_rate}</span>
                </div>
                <div>
                  <span className="font-medium text-indigo-800">Data Source:</span>
                  <span className="ml-2 text-indigo-700">{metadata.data_source}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Predictions;