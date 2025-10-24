// API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// API endpoints
const ENDPOINTS = {
  health: '/health',
  modelMetrics: '/api/model-metrics',
  validateLocation: '/api/validate-location',
  predictions: '/api/predictions',
  export: '/api/export'
};

// Custom error class for API errors
class ApiError extends Error {
  constructor(message, status, endpoint) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.endpoint = endpoint;
  }
}

// Generic request handler with error handling
const makeRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options
  };
  
  try {
    const response = await fetch(url, defaultOptions);
    
    // Handle different response types
    const contentType = response.headers.get('content-type');
    
    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      
      // Try to extract error message from response
      try {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } else {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
      } catch (parseError) {
        // Use default error message if parsing fails
      }
      
      throw new ApiError(errorMessage, response.status, endpoint);
    }
    
    // Handle blob responses (for file downloads)
    if (contentType && contentType.includes('application/vnd.openxmlformats')) {
      return {
        blob: await response.blob(),
        headers: response.headers
      };
    }
    
    // Handle JSON responses
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    // Handle text responses
    return await response.text();
    
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other fetch errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new ApiError(
        'Unable to connect to the server. Please check your internet connection and ensure the backend is running.',
        0,
        endpoint
      );
    }
    
    throw new ApiError(
      error.message || 'An unexpected error occurred',
      0,
      endpoint
    );
  }
};

// Health check
export const checkHealth = async () => {
  return makeRequest(ENDPOINTS.health);
};

// Get model metrics
export const getModelMetrics = async () => {
  return makeRequest(ENDPOINTS.modelMetrics);
};

// Validate location coordinates
export const validateLocation = async (latitude, longitude) => {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new ApiError('Latitude and longitude must be numbers', 400, ENDPOINTS.validateLocation);
  }
  
  if (latitude < -90 || latitude > 90) {
    throw new ApiError('Latitude must be between -90 and 90 degrees', 400, ENDPOINTS.validateLocation);
  }
  
  if (longitude < -180 || longitude > 180) {
    throw new ApiError('Longitude must be between -180 and 180 degrees', 400, ENDPOINTS.validateLocation);
  }
  
  return makeRequest(ENDPOINTS.validateLocation, {
    method: 'POST',
    body: JSON.stringify({
      latitude,
      longitude
    })
  });
};

// Generate predictions
export const generatePredictions = async (latitude, longitude, startDate, endDate) => {
  // Input validation
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new ApiError('Latitude and longitude must be numbers', 400, ENDPOINTS.predictions);
  }
  
  if (!startDate || !endDate) {
    throw new ApiError('Start date and end date are required', 400, ENDPOINTS.predictions);
  }
  
  // Date validation
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new ApiError('Invalid date format', 400, ENDPOINTS.predictions);
  }
  
  if (start >= end) {
    throw new ApiError('Start date must be before end date', 400, ENDPOINTS.predictions);
  }
  
  if (end > today) {
    throw new ApiError('End date cannot be in the future', 400, ENDPOINTS.predictions);
  }
  
  const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
  if (daysDiff > 365) {
    throw new ApiError('Date range cannot exceed 1 year', 400, ENDPOINTS.predictions);
  }
  
  return makeRequest(ENDPOINTS.predictions, {
    method: 'POST',
    body: JSON.stringify({
      latitude,
      longitude,
      start_date: startDate,
      end_date: endDate
    })
  });
};

// Export predictions data
export const exportPredictions = async (predictions, summary, metadata) => {
  if (!predictions || !Array.isArray(predictions) || predictions.length === 0) {
    throw new ApiError('No prediction data available to export', 400, ENDPOINTS.export);
  }
  
  const exportData = {
    predictions,
    summary: summary || {},
    metadata: metadata || {}
  };
  
  const response = await makeRequest(ENDPOINTS.export, {
    method: 'POST',
    body: JSON.stringify(exportData)
  });
  
  return response;
};

// Utility function to handle file download
export const downloadFile = (blob, filename = 'download.xlsx') => {
  try {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Append to DOM, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    window.URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('File download error:', error);
    throw new ApiError('Failed to download file', 0, 'download');
  }
};

// Parse filename from Content-Disposition header
export const getFilenameFromResponse = (headers) => {
  const contentDisposition = headers.get('content-disposition');
  if (!contentDisposition) {
    return 'pv_predictions_export.xlsx';
  }
  
  const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
  if (filenameMatch && filenameMatch[1]) {
    return filenameMatch[1].replace(/['"]/g, '');
  }
  
  return 'pv_predictions_export.xlsx';
};

// Error handler utility
export const handleApiError = (error) => {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      status: error.status,
      endpoint: error.endpoint,
      isNetworkError: error.status === 0
    };
  }
  
  return {
    message: error.message || 'An unexpected error occurred',
    status: 0,
    endpoint: 'unknown',
    isNetworkError: true
  };
};

// Export the ApiError class for use in components
export { ApiError };