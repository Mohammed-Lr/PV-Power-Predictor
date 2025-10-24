# PV Production Prediction Dashboard

A comprehensive React-based application that uses NASA POWER meteorological data to forecast solar energy production and calculate financial savings in Moroccan Dirhams (MAD).

## Overview

This dashboard provides solar energy stakeholders with accurate photovoltaic production predictions using NASA's Global Earth Observation System Integrated Technology (GEOS-IT) meteorological data. The system combines machine learning models with real-world weather data to generate reliable solar energy forecasts.

## Features

- **Model Overview**: Display ML model metrics, data source information, and system status
- **Interactive Predictions**: Generate forecasts by selecting location coordinates and date ranges
- **Data Visualization**: Line charts for production trends and bar charts for financial analysis
- **Excel Export**: Download detailed predictions with weather data and financial calculations
- **Real-time Status**: Live API connection monitoring and health checks
- **Responsive Design**: Modern UI optimized for desktop and mobile devices

## Architecture

### Frontend
- **Framework**: React 18 with functional components and hooks
- **Styling**: Tailwind CSS with gradient designs and responsive layouts
- **Charts**: Recharts library for interactive data visualizations
- **Icons**: Lucide React for consistent iconography
- **State Management**: React Context API for global state

### Backend
- **API**: Flask REST API with CORS support
- **Data Source**: NASA POWER GEOS-IT meteorological data
- **ML Model**: Trained regression model for PV production prediction
- **Export**: Excel file generation with multiple sheets

### Data Flow
1. User inputs location coordinates and date range
2. Frontend validates input and calls prediction API
3. Backend fetches NASA POWER data for specified parameters
4. ML model generates production predictions from weather data
5. Financial calculations convert kWh to MAD savings
6. Results displayed with visualizations and export options

## Installation

### Prerequisites
- Node.js >= 16.0.0
- npm >= 8.0.0
- Python 3.8+ (for backend)
- Flask backend running on port 5000

### Frontend Setup

1. Clone the repository:
```bash
git clone https://github.com/Mohammed-Lr/Pv-Power-Predictor.git
cd Pv-Power-Predictor
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file (optional):
```bash
# .env
REACT_APP_API_URL=http://localhost:5000
```

4. Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3000`

### Backend Setup
Ensure the Flask backend is running with all required dependencies:
- nasa_power_client.py
- scrape_nasa_data.py  
- app.py
- model_handler.py
- your_pv_model.pkl

## Usage

### 1. Model Overview
Navigate to the Model Overview page to view:
- System status and model information
- NASA POWER data source details
- Key meteorological parameters used in predictions
- Geographic coverage and data quality metrics

### 2. Generate Predictions
On the Predictions page:
- Enter latitude and longitude coordinates (e.g., 33.5731, -7.5898 for Casablanca)
- Select start and end dates (maximum 1 year range)
- Click "Generate Predictions" to fetch results
- View daily production trends and financial savings charts
- Review summary statistics and metadata

### 3. Export Data
Use the Export page to:
- Verify prediction data availability
- Download comprehensive Excel files with multiple sheets
- Access detailed weather parameters and financial calculations
- Save results for further analysis or reporting

## API Endpoints

- `GET /health` - System health check
- `GET /api/model-metrics` - Model information and status
- `POST /api/validate-location` - Coordinate validation
- `POST /api/predictions` - Generate PV production forecasts
- `POST /api/export` - Export prediction data to Excel

## Configuration

### Environment Variables
- `REACT_APP_API_URL`: Backend API base URL (default: http://localhost:5000)

### Model Parameters
- **Conversion Rate**: 1.2 MAD per kWh
- **Data Source**: NASA POWER GEOS-IT
- **Temporal Coverage**: 2020-present (~4 day delay)
- **Spatial Coverage**: Global coordinates
- **Training Period**: 2023-06-01 to 2025-07-31

## Development

### Available Scripts
- `npm start` - Start development server
- `npm run build` - Create production build
- `npm test` - Run test suite
- `npm run lint` - Check code quality
- `npm run format` - Format code with Prettier

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── Layout.jsx      # Main layout wrapper
│   ├── Sidebar.jsx     # Navigation sidebar
│   └── TopBar.jsx      # Header component
├── pages/              # Main page components
│   ├── ModelMetrics.jsx # Model overview page
│   ├── Predictions.jsx  # Prediction generation page
│   └── Export.jsx       # Data export page
├── services/           # API and utility services
│   └── api.js          # API service layer
├── context/            # React context providers
│   └── AppContext.jsx  # Global state management
├── App.jsx             # Main application component
├── index.js            # React entry point
└── index.css           # Global styles
```

## Data Sources

### NASA POWER
- **Full Name**: NASA Prediction of Worldwide Energy Resources
- **System**: GEOS-IT (Global Earth Observation System Integrated Technology)
- **Parameters**: 25+ meteorological variables including:
  - Global Horizontal Irradiance
  - Direct Normal Irradiance  
  - Temperature at 2m
  - Cloud Amount and Clearness Index
  - Wind Speed and Relative Humidity

## Troubleshooting

### Common Issues

**API Connection Failed**
- Verify Flask backend is running on port 5000
- Check CORS configuration in backend
- Ensure model file (your_pv_model.pkl) is loaded

**Prediction Generation Errors**  
- Validate coordinate ranges (-90 to 90 lat, -180 to 180 lng)
- Ensure date range is within 1 year and not in future
- Check NASA POWER data availability for location

**Export Functionality Issues**
- Generate predictions before attempting export
- Verify browser supports file downloads
- Check backend /api/export endpoint functionality

### Performance Optimization
- Predictions are cached in React context to avoid re-computation
- API calls include proper error handling and loading states
- Charts use responsive containers for mobile optimization

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/enhancement`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/enhancement`)
5. Create a Pull Request

### Development Guidelines
- Follow existing code style and component patterns
- Add proper error handling for API calls
- Include loading states for user experience
- Test responsive design across devices
- Document new features and API changes

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions, issues, or contributions:
- **Issues**: [GitHub Issues](https://github.com/Mohammed-Lr/Pv-Power-Predictor/issues)
- **Documentation**: This README and inline code comments
- **API Reference**: Backend Flask application documentation

## Acknowledgments

- NASA POWER team for providing global meteorological data
- React and Tailwind CSS communities for excellent frameworks
- Recharts library for data visualization capabilities