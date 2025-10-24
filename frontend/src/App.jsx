import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import ModelMetrics from './pages/ModelMetrics';
import Predictions from './pages/Predictions';
import Export from './pages/Export';
import { AppContextProvider } from './context/AppContext';

const App = () => {
  // Page navigation state
  const [currentPage, setCurrentPage] = useState('model-metrics');
  
  // API health status
  const [apiStatus, setApiStatus] = useState({ healthy: false, checking: true });
  
  // Check API health on app load
  useEffect(() => {
    checkApiHealth();
  }, []);
  
  const checkApiHealth = async () => {
    try {
      const response = await fetch('http://localhost:5000/health');
      
      if (response.ok) {
        const data = await response.json();
        setApiStatus({ 
          healthy: data.status === 'healthy', 
          checking: false,
          modelLoaded: data.model_loaded,
          timestamp: data.timestamp
        });
      } else {
        throw new Error('API health check failed');
      }
    } catch (error) {
      console.error('API health check error:', error);
      setApiStatus({ 
        healthy: false, 
        checking: false, 
        error: error.message 
      });
    }
  };
  
  // Handle page navigation
  const handlePageChange = (pageId) => {
    setCurrentPage(pageId);
  };
  
  // Render the current page component
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'model-metrics':
        return <ModelMetrics />;
      case 'predictions':
        return <Predictions />;
      case 'export':
        return <Export />;
      default:
        return <ModelMetrics />;
    }
  };
  
  // Loading screen while checking API
  if (apiStatus.checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Initializing PV Dashboard</h2>
          <p className="text-gray-600">Connecting to prediction services...</p>
        </div>
      </div>
    );
  }
  
  // Error screen if API is down
  if (!apiStatus.healthy) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h2 className="text-3xl font-bold text-red-900 mb-4">API Connection Failed</h2>
          <p className="text-red-700 mb-6">
            Unable to connect to the PV prediction backend service. 
            {apiStatus.error && ` Error: ${apiStatus.error}`}
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-red-800 mb-2">Troubleshooting Steps:</h3>
            <ul className="text-sm text-red-700 text-left space-y-1">
              <li>• Ensure Flask backend is running on port 5000</li>
              <li>• Check if the model file is loaded correctly</li>
              <li>• Verify CORS is configured properly</li>
              <li>• Review backend logs for errors</li>
            </ul>
          </div>
          
          <button
            onClick={checkApiHealth}
            className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <AppContextProvider>
      <div className="App">
        <Layout 
          currentPage={currentPage} 
          onPageChange={handlePageChange}
        >
          {renderCurrentPage()}
        </Layout>
        
        {/* API Status Indicator - Hidden in normal operation */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className={`px-3 py-2 rounded-lg text-sm font-medium shadow-lg ${
              apiStatus.healthy 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  apiStatus.healthy ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span>
                  API: {apiStatus.healthy ? 'Connected' : 'Disconnected'}
                  {apiStatus.modelLoaded !== undefined && apiStatus.healthy && (
                    ` | Model: ${apiStatus.modelLoaded ? 'Loaded' : 'Not Loaded'}`
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppContextProvider>
  );
};

export default App;