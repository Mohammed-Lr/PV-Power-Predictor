import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
//import './index.css';

// Error boundary component to catch and display React errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('React Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-red-900 mb-2">Application Error</h1>
              <p className="text-red-700 mb-6">
                The PV Dashboard encountered an unexpected error and needs to be reloaded.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Error Details (Development Mode)</h3>
                <details className="text-sm">
                  <summary className="cursor-pointer text-gray-700 hover:text-gray-900 mb-2">
                    Click to view error information
                  </summary>
                  <div className="bg-gray-100 rounded p-3 mt-2">
                    <p className="text-red-600 font-mono text-xs break-all mb-2">
                      {this.state.error && this.state.error.toString()}
                    </p>
                    <pre className="text-gray-600 text-xs overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </details>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Quick Fix</h3>
                <p className="text-blue-800 text-sm mb-3">
                  Most issues can be resolved by refreshing the page.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors w-full"
                >
                  Refresh Page
                </button>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">Still Having Issues?</h3>
                <ul className="text-yellow-800 text-sm space-y-1">
                  <li>• Clear browser cache and cookies</li>
                  <li>• Check browser console for errors</li>
                  <li>• Ensure backend server is running</li>
                  <li>• Verify network connectivity</li>
                </ul>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="text-gray-600 hover:text-gray-800 underline text-sm"
              >
                Try to continue without refreshing
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Main application bootstrap
const initializeApp = () => {
  // Get the root container
  const container = document.getElementById('root');
  
  if (!container) {
    console.error('Root element not found! Make sure index.html has a div with id="root"');
    return;
  }

  // Create React root
  const root = createRoot(container);
  
  // Render the application with error boundary
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
  
  // Log successful initialization
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 PV Dashboard initialized successfully');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('API URL:', process.env.REACT_APP_API_URL || 'http://localhost:5000');
  }
};

// Performance monitoring (development only)
if (process.env.NODE_ENV === 'development') {
  // Log render performance
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'navigation') {
        console.log('📊 Page load performance:', {
          domContentLoaded: `${entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart}ms`,
          loadComplete: `${entry.loadEventEnd - entry.loadEventStart}ms`,
          totalTime: `${entry.loadEventEnd - entry.fetchStart}ms`
        });
      }
    }
  });
  
  try {
    observer.observe({ entryTypes: ['navigation'] });
  } catch (e) {
    // Performance Observer might not be supported in all browsers
    console.log('Performance monitoring not available');
  }
}

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // In development, show more details
  if (process.env.NODE_ENV === 'development') {
    console.error('Promise that was rejected:', event.promise);
  }
  
  // Prevent the default browser behavior (logging to console)
  event.preventDefault();
});

// Global error handler for uncaught exceptions
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
  
  // In development, provide more context
  if (process.env.NODE_ENV === 'development') {
    console.error('Error occurred at:', event.filename, 'Line:', event.lineno, 'Column:', event.colno);
  }
});

// Initialize the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM is already ready
  initializeApp();
}