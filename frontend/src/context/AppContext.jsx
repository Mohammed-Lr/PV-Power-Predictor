import React, { createContext, useContext, useState } from 'react';

// Create the context
const AppContext = createContext();

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};

// Provider component
export const AppContextProvider = ({ children }) => {
  // Prediction data state
  const [predictions, setPredictions] = useState(null);
  const [summary, setSummary] = useState(null);
  const [metadata, setMetadata] = useState(null);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Model metrics cache (to avoid repeated API calls)
  const [modelMetrics, setModelMetrics] = useState(null);
  
  // Clear all prediction data
  const clearPredictionData = () => {
    setPredictions(null);
    setSummary(null);
    setMetadata(null);
    setError(null);
  };
  
  // Update prediction data (used by Predictions page)
  const updatePredictionData = (predictionData, summaryData, metadataData) => {
    setPredictions(predictionData);
    setSummary(summaryData);
    setMetadata(metadataData);
    setError(null);
  };
  
  // Set error state
  const setAppError = (errorMessage) => {
    setError(errorMessage);
  };
  
  // Clear error state
  const clearError = () => {
    setError(null);
  };
  
  // Check if we have prediction data
  const hasPredictionData = () => {
    return predictions && predictions.length > 0;
  };
  
  // Get prediction date range
  const getDateRange = () => {
    if (!predictions || predictions.length === 0) {
      return null;
    }
    
    return {
      start: predictions[0].date,
      end: predictions[predictions.length - 1].date,
      totalDays: predictions.length
    };
  };
  
  // Get basic statistics
  const getBasicStats = () => {
    if (!predictions || predictions.length === 0) {
      return null;
    }
    
    const totalProduction = predictions.reduce((sum, pred) => sum + pred.pv_production_kwh, 0);
    const totalSavings = predictions.reduce((sum, pred) => sum + pred.financial_savings_mad, 0);
    
    return {
      totalProduction: Math.round(totalProduction * 100) / 100,
      totalSavings: Math.round(totalSavings * 100) / 100,
      averageProduction: Math.round((totalProduction / predictions.length) * 100) / 100,
      averageSavings: Math.round((totalSavings / predictions.length) * 100) / 100,
      totalDays: predictions.length
    };
  };
  
  // Context value object
  const contextValue = {
    // State
    predictions,
    summary,
    metadata,
    isLoading,
    error,
    modelMetrics,
    
    // State setters
    setPredictions,
    setSummary,
    setMetadata,
    setIsLoading,
    setError,
    setModelMetrics,
    
    // Helper functions
    clearPredictionData,
    updatePredictionData,
    setAppError,
    clearError,
    hasPredictionData,
    getDateRange,
    getBasicStats
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export { AppContext };