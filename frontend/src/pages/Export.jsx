import React, { useState, useContext } from 'react';
import { Download, FileSpreadsheet, AlertTriangle, CheckCircle, Calendar, MapPin, Loader2, Database, Zap } from 'lucide-react';
import { AppContext } from '../context/AppContext';

const Export = () => {
  const { predictions, summary, metadata } = useContext(AppContext);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleExport = async () => {
    if (!predictions || predictions.length === 0) {
      setDownloadError('No prediction data available to export. Please generate predictions first.');
      return;
    }

    setDownloading(true);
    setDownloadError(null);
    setDownloadSuccess(false);

    try {
      const exportData = {
        predictions: predictions,
        summary: summary,
        metadata: metadata
      };

      const response = await fetch('http://localhost:5000/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Export failed with status: ${response.status}`);
      }

      // Get the filename from the response headers or generate one
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'pv_predictions_export.xlsx';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000); // Hide success message after 5 seconds

    } catch (err) {
      setDownloadError(err.message);
      console.error('Export error:', err);
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const hasData = predictions && predictions.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center bg-gradient-to-r from-purple-600 to-pink-700 text-white rounded-2xl p-8 shadow-lg">
        <div className="flex justify-center mb-4">
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-4">
            <Download className="w-12 h-12" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-4">Export Prediction Data</h1>
        <p className="text-xl opacity-90 mb-2">Download your solar energy analysis results</p>
        <p className="text-lg opacity-75">Excel format with detailed predictions, weather data, and financial calculations</p>
      </div>

      {/* Data Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className={`p-2 rounded-lg ${hasData ? 'bg-green-100' : 'bg-gray-100'}`}>
            <Database className={`w-6 h-6 ${hasData ? 'text-green-600' : 'text-gray-600'}`} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Data Status</h2>
            <p className="text-gray-600">Current prediction data availability</p>
          </div>
        </div>

        {hasData ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="font-semibold text-green-800">Prediction data ready for export</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800">Total Records</span>
                </div>
                <p className="text-2xl font-bold text-green-900">{predictions.length}</p>
                <p className="text-xs text-green-700">Daily predictions</p>
              </div>

              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800">Location</span>
                </div>
                <p className="text-lg font-bold text-green-900">{metadata?.location}</p>
                <p className="text-xs text-green-700">Coordinates</p>
              </div>

              {/* Added Capacity Card */}
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800">System Capacity</span>
                </div>
                <p className="text-lg font-bold text-green-900">{metadata?.capacity} kW</p>
                <p className="text-xs text-green-700">Installed Power</p>
              </div>

              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800">Date Range</span>
                </div>
                <p className="text-sm font-bold text-green-900">
                  {formatDate(predictions[0]?.date)} - {formatDate(predictions[predictions.length - 1]?.date)}
                </p>
                <p className="text-xs text-green-700">{summary?.total_days} days</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <h3 className="font-semibold text-yellow-800">No prediction data available</h3>
            </div>
            <p className="text-yellow-700 mb-4">
              You need to generate predictions first before you can export data. 
              Navigate to the Predictions page to create your solar energy forecast.
            </p>
          </div>
        )}
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-blue-100 p-2 rounded-lg">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Export Configuration</h2>
            <p className="text-gray-600">Download detailed analysis results</p>
          </div>
        </div>

        {/* Export Contents */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Predictions Sheet</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Daily production (kWh)</li>
              <li>• Financial savings (MAD)</li>
              <li>• Weather parameters</li>
              <li>• Date timestamps</li>
            </ul>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h3 className="font-semibold text-green-900 mb-2">Summary Sheet</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Total production</li>
              <li>• Total savings</li>
              <li>• Average daily values</li>
              <li>• Data completeness</li>
            </ul>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h3 className="font-semibold text-purple-900 mb-2">Metadata Sheet</h3>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Location coordinates</li>
              <li>• Conversion rates</li>
              <li>• Model information</li>
              <li>• Data source details</li>
            </ul>
          </div>
        </div>

        {/* Export Button */}
        <div className="text-center">
          <button
            onClick={handleExport}
            disabled={!hasData || downloading}
            className={`px-8 py-4 rounded-lg font-semibold text-white shadow-md transition-all duration-200 ${
              hasData && !downloading
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {downloading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Preparing Download...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Download className="w-5 h-5" />
                <span>{hasData ? 'Download Excel File' : 'Export Unavailable'}</span>
              </div>
            )}
          </button>
          
          {!hasData && (
            <p className="text-gray-500 text-sm mt-2">
              Generate predictions first to enable export functionality
            </p>
          )}
        </div>
      </div>

      {/* Success Message */}
      {downloadSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-green-800">Export Successful!</h3>
              <p className="text-green-700">Your prediction data has been downloaded successfully.</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {downloadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Export Failed</h3>
              <p className="text-red-700">{downloadError}</p>
            </div>
          </div>
          {hasData && (
            <button
              onClick={handleExport}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      )}

      {/* Usage Instructions */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-indigo-900 mb-4">Using Your Exported Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-indigo-800 mb-2">📊 Analysis & Reporting</h4>
            <p className="text-indigo-700 text-sm mb-3">
              Use the exported Excel file for detailed analysis, create custom charts, or integrate with your existing reporting systems.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-indigo-800 mb-2">🔄 Data Integration</h4>
            <p className="text-indigo-700 text-sm">
              Import the structured data into other tools like Power BI, Tableau, or custom applications for further processing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Export;