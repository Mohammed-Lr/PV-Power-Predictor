"""
NASA POWER API Client for Solar/PV Data Collection - GEOS-IT Source Only
File: nasa_power_geos_it_client.py

This version is configured to use only the GEOS-IT data source (2020-present)
for the most current and real-time meteorological data.
"""

import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import time
import json
from typing import List, Dict, Optional, Tuple
import warnings


class NASAPowerGEOSITClient:
    """
    Client for accessing NASA POWER API using GEOS-IT data source
    for photovoltaic production modeling with most current data.
    """
    
    def __init__(self):
        self.base_url = "https://power.larc.nasa.gov/api/temporal"
        self.community = "ag"  # Agroclimatology community (best for GEOS-IT coverage)
        self.data_source = "geos-it"  # Force GEOS-IT source
        
        # GEOS-IT date range (2020-01-01 to current)
        self.min_date = datetime(2020, 1, 1)
        self.max_date = datetime.now() - timedelta(days=3)  # GEOS-IT has ~3-4 day delay
        
        # Define parameter sets validated for GEOS-IT
        self.pv_parameters = {
            'essential': [
                'ALLSKY_SFC_SW_DWN',    # Global Horizontal Irradiance
                'CLRSKY_SFC_SW_DWN',    # Direct Normal Irradiance
                'T2M_MAX',                  # Temperature at 2m
                'T2M_MIN',            # Cloud Amount
                'ALLSKY_KT',            # Clearness Index
                'CLOUD_AMT',                  # Solar Zenith Angle
                'AOD_55',                 # Wind Speed at 2m
                'WS2M'                  # Relative Humidity
            ],
            'important': [
                'T2M',   # All Sky Surface Shortwave Diffuse Irradiance
                'T2M_MAX',   # All Sky Surface Shortwave Direct Normal Irradiance
                'T2M_MIN',   # All Sky Surface Longwave Downward Irradiance
                'WS2M',   # Clear Sky Surface Shortwave Diffuse Irradiance
                'PRECTOTCORR',    # All Sky Surface Longwave Downward Irradiance
                'RH2M', 
                'ALLSKY_KT',    # All Sky Surface Longwave Upward Irradiance
                'ALLSKY_SFC_SW_DNI',               # Aerosol Optical Depth 0.55 Microns
                'CLRSKY_SFC_SW_DNI',                   # Surface Pressure
                'ALLSKY_SFC_SW_DIFF',               # Dew/Frost Point at 2 Meters
                'CLRSKY_SFC_SW_DIFF',
                'ALLSKY_SFC_SW_DWN',
                'CLRSKY_SFC_SW_DWN',
                'ALLSKY_SFC_LW_DWN',          # All Sky Surface Longwave Downward Irradiance
                'CLRSKY_SFC_LW_DWN',
                'ALLSKY_SFC_LW_UP',
                'CLRSKY_SFC_LW_UP'                  # Earth Skin Temperature
            ],
            'additional': [
                'WD2M',                 # Wind Direction at 2 Meters
                'WS10M',                # Wind Speed at 10 Meters
                'T10M',                 # Temperature at 10 Meters
                'PRECTOTCORR',          # Precipitation Corrected
                'QV2M',                 # Specific Humidity at 2 Meters
                'ALLSKY_SFC_SW_DNI',    # All Sky Surface Shortwave Direct Normal Irradiance
                'CLRSKY_SFC_SW_DNI',    # Clear Sky Surface Shortwave Direct Normal Irradiance
                'SZA'                   # Solar Zenith Angle
            ]
        }
    
    def get_all_pv_parameters(self) -> List[str]:
        """Get all recommended PV parameters combined."""
        all_params = []
        for param_set in self.pv_parameters.values():
            all_params.extend(param_set)
        # Remove duplicates while preserving order
        return list(dict.fromkeys(all_params))
    
    def validate_coordinates(self, latitude: float, longitude: float) -> bool:
        """Validate latitude and longitude values."""
        if not (-90 <= latitude <= 90):
            raise ValueError(f"Latitude must be between -90 and 90, got {latitude}")
        if not (-180 <= longitude <= 180):
            raise ValueError(f"Longitude must be between -180 and 180, got {longitude}")
        return True
    
    def validate_dates(self, start_date: str, end_date: str) -> bool:
        """Validate date format and range for GEOS-IT data availability."""
        date_format = "%Y%m%d"
        try:
            start = datetime.strptime(start_date, date_format)
            end = datetime.strptime(end_date, date_format)
        except ValueError:
            raise ValueError("Dates must be in YYYYMMDD format")
        
        if start > end:
            raise ValueError("Start date must be before end date")
        
        # GEOS-IT specific date validation
        if start < self.min_date:
            raise ValueError(f"GEOS-IT data starts from {self.min_date.strftime('%Y-%m-%d')}. "
                           f"Provided start date: {start.strftime('%Y-%m-%d')}")
        
        if end > self.max_date:
            warnings.warn(f"GEOS-IT data may not be available after {self.max_date.strftime('%Y-%m-%d')}. "
                         f"Requested end date: {end.strftime('%Y-%m-%d')}")
        
        # Check if requesting very recent data
        days_ago = (datetime.now() - end).days
        if days_ago < 3:
            warnings.warn(f"Requesting data from {days_ago} days ago. "
                         f"GEOS-IT typically has a 3-4 day delay.")
        
        return True
    
    def build_request_url(self, 
                         latitude: float, 
                         longitude: float,
                         start_date: str, 
                         end_date: str,
                         parameters: List[str],
                         temporal_api: str = "daily",
                         output_format: str = "json") -> str:
        """Build the NASA POWER API request URL for GEOS-IT."""
        
        # Validate inputs
        self.validate_coordinates(latitude, longitude)
        self.validate_dates(start_date, end_date)
        
        # Build parameter string
        param_string = ",".join(parameters)
        
        # Construct URL with GEOS-IT specific parameters
        url = f"{self.base_url}/{temporal_api}/point"
        url += f"?start={start_date}&end={end_date}"
        url += f"&latitude={latitude}&longitude={longitude}"
        url += f"&community={self.community}"
        url += f"&parameters={param_string}"
        url += f"&format={output_format}"
        url += "&header=true&time-standard=lst"  # Local solar time
        
        return url
    
    def fetch_data(self, 
                   latitude: float, 
                   longitude: float,
                   start_date: str, 
                   end_date: str,
                   parameter_set: str = "essential",
                   custom_parameters: Optional[List[str]] = None,
                   temporal_api: str = "daily",
                   max_retries: int = 3,
                   retry_delay: float = 1.0) -> Dict:
        """
        Fetch data from NASA POWER API using GEOS-IT source.
        
        Args:
            latitude: Site latitude (-90 to 90)
            longitude: Site longitude (-180 to 180)
            start_date: Start date in YYYYMMDD format (must be >= 2020-01-01)
            end_date: End date in YYYYMMDD format
            parameter_set: 'essential', 'important', 'additional', or 'all'
            custom_parameters: Custom list of parameters to fetch
            temporal_api: 'daily', 'monthly', or 'climatology'
            max_retries: Maximum number of retry attempts
            retry_delay: Delay between retries in seconds
        
        Returns:
            Dictionary containing the API response
        """
        
        # Select parameters
        if custom_parameters:
            parameters = custom_parameters
        elif parameter_set == "all":
            parameters = self.get_all_pv_parameters()
        else:
            parameters = self.pv_parameters.get(parameter_set, self.pv_parameters['essential'])
        
        # Build URL
        url = self.build_request_url(
            latitude, longitude, start_date, end_date, 
            parameters, temporal_api
        )
        
        print(f"🌍 Fetching GEOS-IT data for coordinates: ({latitude}, {longitude})")
        print(f"📅 Date range: {start_date} to {end_date}")
        print(f"📊 Parameters: {len(parameters)} selected")
        print(f"🔗 Using GEOS-IT data source (2020-present, ~4-day delay)")
        print(f"📋 Parameter list: {', '.join(parameters[:5])}{'...' if len(parameters) > 5 else ''}")
        
        # Make request with retries
        for attempt in range(max_retries):
            try:
                print(f"🚀 API Request attempt {attempt + 1}/{max_retries}...")
                response = requests.get(url, timeout=60)  # Longer timeout for GEOS-IT
                response.raise_for_status()
                
                data = response.json()
                
                # Check for API errors
                if 'messages' in data and any('error' in msg.lower() for msg in data['messages']):
                    raise Exception(f"API Error: {data['messages']}")
                
                # Verify we got GEOS-IT data (check metadata if available)
                if 'header' in data and 'source' in data['header']:
                    source = data['header']['source']
                    if 'geos' not in source.lower():
                        warnings.warn(f"Expected GEOS-IT source, got: {source}")
                
                param_count = len(data.get('properties', {}).get('parameter', {}))
                print(f"✅ Successfully fetched GEOS-IT data ({param_count} parameters)")
                
                return data
                
            except requests.exceptions.RequestException as e:
                print(f"❌ Attempt {attempt + 1}/{max_retries} failed: {e}")
                if attempt < max_retries - 1:
                    wait_time = retry_delay * (2 ** attempt)
                    print(f"⏳ Waiting {wait_time:.1f} seconds before retry...")
                    time.sleep(wait_time)
                else:
                    raise Exception(f"Failed to fetch GEOS-IT data after {max_retries} attempts: {e}")
    
    def parse_to_dataframe(self, api_response: Dict) -> pd.DataFrame:
        """
        Parse NASA POWER API response to pandas DataFrame.
        
        Args:
            api_response: Response dictionary from NASA POWER API
            
        Returns:
            DataFrame with datetime index and parameter columns
        """
        
        try:
            # Extract parameter data
            parameters = api_response['properties']['parameter']
            
            # Create DataFrame
            df = pd.DataFrame(parameters)
            
            # Convert index to datetime
            df.index = pd.to_datetime(df.index, format='%Y%m%d')
            df.index.name = 'date'
            
            # Replace fill values with NaN
            # NASA POWER uses -999 as fill value for missing data
            df = df.replace(-999.0, np.nan)
            
            # Sort by date
            df = df.sort_index()
            
            # Add metadata
            if 'header' in api_response:
                print(f"📋 Data source: {api_response['header'].get('source', 'Unknown')}")
                print(f"🎯 Location: {api_response['header'].get('latitude', 'N/A')}, "
                      f"{api_response['header'].get('longitude', 'N/A')}")
            
            print(f"📊 Parsed GEOS-IT data: {len(df)} days, {len(df.columns)} parameters")
            print(f"📅 Date range: {df.index.min().date()} to {df.index.max().date()}")
            
            # Check data recency
            days_from_latest = (datetime.now().date() - df.index.max().date()).days
            print(f"⏰ Latest data is {days_from_latest} days old")
            
            return df
            
        except KeyError as e:
            raise Exception(f"Error parsing API response: {e}")
    
    def get_pv_data(self, 
                    latitude: float, 
                    longitude: float,
                    start_date: str, 
                    end_date: str,
                    parameter_set: str = "essential") -> pd.DataFrame:
        """
        Convenience method to fetch and parse GEOS-IT PV data in one call.
        
        Args:
            latitude: Site latitude
            longitude: Site longitude  
            start_date: Start date (YYYYMMDD, must be >= 2020-01-01)
            end_date: End date (YYYYMMDD)
            parameter_set: Parameter set to fetch
            
        Returns:
            DataFrame with PV-relevant meteorological data from GEOS-IT
        """
        
        # Fetch data
        raw_data = self.fetch_data(
            latitude, longitude, start_date, end_date, parameter_set
        )
        
        # Parse to DataFrame
        df = self.parse_to_dataframe(raw_data)
        
        return df
    
    def add_derived_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Add derived features useful for PV modeling using GEOS-IT data.
        
        Args:
            df: DataFrame with NASA POWER GEOS-IT data
            
        Returns:
            DataFrame with additional derived features
        """
        
        df_enhanced = df.copy()
        
        # Temperature-based features
        if 'T2M' in df.columns:
            # Temperature coefficient effect (assuming -0.4%/°C for silicon)
            df_enhanced['temp_coeff_effect'] = 1 - 0.004 * (df['T2M'] - 25)
        
        # Temperature range (important for PV efficiency)
        if 'T2M_MAX' in df.columns and 'T2M_MIN' in df.columns:
            df_enhanced['temp_range'] = df['T2M_MAX'] - df['T2M_MIN']
            df_enhanced['temp_avg'] = (df['T2M_MAX'] + df['T2M_MIN']) / 2
        
        # Irradiance ratios and indices
        if 'ALLSKY_SFC_SW_DIFF' in df.columns and 'ALLSKY_SFC_SW_DWN' in df.columns:
            df_enhanced['diffuse_fraction'] = (df['ALLSKY_SFC_SW_DIFF'] / 
                                             df['ALLSKY_SFC_SW_DWN']).clip(0, 1)
        
        if 'CLRSKY_SFC_SW_DWN' in df.columns and 'ALLSKY_SFC_SW_DWN' in df.columns:
            df_enhanced['clearness_index'] = (df['ALLSKY_SFC_SW_DWN'] / 
                                            df['CLRSKY_SFC_SW_DWN']).clip(0, 1)
        
        # Direct Normal Irradiance ratios
        if 'ALLSKY_SFC_SW_DNI' in df.columns and 'ALLSKY_SFC_SW_DWN' in df.columns:
            df_enhanced['dni_ghi_ratio'] = (df['ALLSKY_SFC_SW_DNI'] / 
                                          df['ALLSKY_SFC_SW_DWN']).clip(0, 2)
        
        # Humidity and cooling effects
        if 'RH2M' in df.columns and 'T2M' in df.columns:
            # Approximate heat index effect
            df_enhanced['heat_index_factor'] = np.where(
                (df['T2M'] > 26) & (df['RH2M'] > 40),
                1 - 0.01 * (df['RH2M'] - 40) * (df['T2M'] - 26) / 100,
                1.0
            )
        
        # Wind cooling effect on panels
        if 'WS2M' in df.columns:
            # Higher wind speeds help cool panels
            df_enhanced['wind_cooling_factor'] = 1 + 0.01 * np.log1p(df['WS2M'])
        
        # Time-based features (seasonal effects)
        df_enhanced['day_of_year'] = df_enhanced.index.dayofyear
        df_enhanced['month'] = df_enhanced.index.month
        df_enhanced['season'] = ((df_enhanced.index.month - 1) // 3) + 1
        df_enhanced['is_summer'] = df_enhanced['season'].isin([2, 3])  # Summer months
        
        # Seasonal solar position approximations
        df_enhanced['solar_declination'] = 23.45 * np.sin(
            np.deg2rad(360 * (284 + df_enhanced['day_of_year']) / 365)
        )
        
        # Sinusoidal seasonal features (useful for ML models)
        df_enhanced['day_sin'] = np.sin(2 * np.pi * df_enhanced['day_of_year'] / 365.25)
        df_enhanced['day_cos'] = np.cos(2 * np.pi * df_enhanced['day_of_year'] / 365.25)
        df_enhanced['month_sin'] = np.sin(2 * np.pi * df_enhanced['month'] / 12)
        df_enhanced['month_cos'] = np.cos(2 * np.pi * df_enhanced['month'] / 12)
        
        # Rolling averages for trend analysis
        if len(df_enhanced) >= 7:
            for col in ['ALLSKY_SFC_SW_DWN', 'T2M', 'ALLSKY_KT']:
                if col in df_enhanced.columns:
                    df_enhanced[f'{col}_7day_avg'] = df_enhanced[col].rolling(
                        window=7, center=True, min_periods=3
                    ).mean()
        
        added_features = len(df_enhanced.columns) - len(df.columns)
        print(f"✨ Added {added_features} derived features for PV modeling")
        
        return df_enhanced
    
    def get_data_summary(self, df: pd.DataFrame) -> Dict:
        """Generate summary statistics for the GEOS-IT dataset."""
        
        # Calculate data quality metrics
        missing_pct = (df.isnull().sum() / len(df) * 100).round(2)
        
        summary = {
            'shape': df.shape,
            'date_range': (df.index.min().date(), df.index.max().date()),
            'data_source': 'GEOS-IT',
            'temporal_resolution': 'Daily',
            'missing_data_pct': missing_pct.to_dict(),
            'data_quality': {
                'complete_records': len(df.dropna()),
                'missing_records': len(df) - len(df.dropna()),
                'data_completeness': f"{(1 - df.isnull().any(axis=1).sum() / len(df)) * 100:.1f}%"
            },
            'basic_stats': df.select_dtypes(include=[np.number]).describe().round(3).to_dict(),
            'recency': f"{(datetime.now().date() - df.index.max().date()).days} days old"
        }
        
        return summary
    
    def validate_geos_it_availability(self, latitude: float, longitude: float) -> Dict:
        """
        Check GEOS-IT data availability for the specified location.
        Tests with a small date range to verify access.
        """
        
        # Test with recent small date range
        test_start = (datetime.now() - timedelta(days=10)).strftime('%Y%m%d')
        test_end = (datetime.now() - timedelta(days=5)).strftime('%Y%m%d')
        
        print(f"🔍 Testing GEOS-IT availability for location ({latitude}, {longitude})")
        print(f"📅 Test date range: {test_start} to {test_end}")
        
        try:
            test_data = self.fetch_data(
                latitude, longitude, test_start, test_end,
                custom_parameters=['T2M', 'ALLSKY_SFC_SW_DWN']
            )
            
            df = self.parse_to_dataframe(test_data)
            
            result = {
                'available': True,
                'test_records': len(df),
                'latest_date': df.index.max().date(),
                'data_quality': 'Good' if df.isnull().sum().sum() == 0 else 'Some missing values',
                'message': f"✅ GEOS-IT data available with {len(df)} records"
            }
            
        except Exception as e:
            result = {
                'available': False,
                'test_records': 0,
                'latest_date': None,
                'data_quality': 'N/A',
                'message': f"❌ GEOS-IT data not available: {str(e)}"
            }
        
        print(result['message'])
        return result
    
    def get_working_parameters(self, latitude: float, longitude: float, 
                              start_date: str, end_date: str):
        """Find which parameters actually work for GEOS-IT at your location."""
        all_params = self.get_all_pv_parameters()
        working_params = []
        failed_params = []
        
        print(f"🧪 Testing all {len(all_params)} GEOS-IT parameters individually...")
        
        for i, param in enumerate(all_params, 1):
            print(f"[{i:2d}/{len(all_params)}] Testing {param:<30}...", end=" ")
            try:
                self.fetch_data(
                    latitude, longitude, start_date, end_date,
                    custom_parameters=[param]
                )
                print("✅")
                working_params.append(param)
            except Exception as e:
                print("❌")
                failed_params.append((param, str(e)))
            
            # Small delay to be respectful to the API
            time.sleep(0.3)
        
        print(f"\n📊 GEOS-IT Parameter Test Results:")
        print(f"   ✅ Working: {len(working_params)} parameters")
        print(f"   ❌ Failed: {len(failed_params)} parameters")
        
        if working_params:
            print(f"\n✅ Working GEOS-IT parameters:")
            for param in working_params:
                print(f"   - {param}")
        
        if failed_params:
            print(f"\n❌ Failed GEOS-IT parameters:")
            for param, error in failed_params:
                print(f"   - {param}: {error[:50]}...")
        
        return working_params, failed_params


# Example usage and testing functions
def example_usage():
    """Example of how to use the GEOS-IT client."""
    
    # Initialize client
    client = NASAPowerGEOSITClient()
    
    # Example location (replace with your coordinates)
    latitude = 34.0522   # Los Angeles
    longitude = -118.2437
    
    # Date range (must be 2020 or later for GEOS-IT)
    start_date = "20230101"
    end_date = "20231231"
    
    try:
        # Test availability first
        availability = client.validate_geos_it_availability(latitude, longitude)
        
        if availability['available']:
            # Fetch essential parameters
            df = client.get_pv_data(latitude, longitude, start_date, end_date, "essential")
            
            # Add derived features
            df_enhanced = client.add_derived_features(df)
            
            # Get summary
            summary = client.get_data_summary(df_enhanced)
            
            print(f"\n📋 Data Summary:")
            print(f"   Shape: {summary['shape']}")
            print(f"   Date range: {summary['date_range']}")
            print(f"   Data completeness: {summary['data_quality']['data_completeness']}")
            print(f"   Latest data: {summary['recency']}")
            
            return df_enhanced
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None


if __name__ == "__main__":
    example_usage()