"""
NASA POWER Data Scraper - Dashboard Integration Version
File: scrape_nasa_data.py

Simplified version for dashboard API integration.
Removes unnecessary demo code and batch processing.
"""

from nasa_power_client import NASAPowerGEOSITClient
import pandas as pd
import time


def get_pv_data_for_dashboard(latitude, longitude, start_date, end_date, 
                             parameter_set="important"):
    """
    Main function for dashboard API integration.
    Fetches NASA POWER data and returns enhanced DataFrame ready for ML model.
    
    Args:
        latitude (float): Latitude of the location (-90 to 90)
        longitude (float): Longitude of the location (-180 to 180)  
        start_date (str): Start date in 'YYYY-MM-DD' or 'YYYYMMDD' format
        end_date (str): End date in 'YYYY-MM-DD' or 'YYYYMMDD' format
        parameter_set (str): 'essential', 'important', 'additional', or 'all'
    
    Returns:
        pandas.DataFrame: DataFrame with NASA POWER meteorological data (raw features)
    """
    
    # Initialize the client
    client = NASAPowerGEOSITClient()
    
    # Convert dates to YYYYMMDD format if needed
    if '-' in start_date:
        start_date = start_date.replace('-', '')
    if '-' in end_date:
        end_date = end_date.replace('-', '')
    
    try:
        print(f"🌍 Fetching NASA POWER data for: ({latitude}, {longitude})")
        print(f"📅 Date range: {start_date} to {end_date}")
        
        # Fetch the data using your existing client
        df = client.get_pv_data(
            latitude=latitude,
            longitude=longitude, 
            start_date=start_date,
            end_date=end_date,
            parameter_set=parameter_set
        )
        
        
        print(f"✅ Successfully retrieved {len(df)} days of data")
        print(f"📊 Total features: {len(df.columns)}")
        
        # Optional: Save to CSV (uncomment if needed)
        filename = f"nasa_power_data_{latitude}_{longitude}_{start_date}_{end_date}.csv"
        df.to_csv(filename)
        print(f"💾 Data saved to: {filename}")
        
        return df
        
    except Exception as e:
        print(f"❌ Error fetching NASA POWER data: {e}")
        raise Exception(f"Failed to fetch NASA POWER data: {str(e)}")


def validate_location_availability(latitude, longitude):
    """
    Quick validation to check if NASA POWER data is available for location.
    Used by dashboard for location validation.
    
    Args:
        latitude (float): Location latitude
        longitude (float): Location longitude
    
    Returns:
        dict: Availability status and details
    """
    
    client = NASAPowerGEOSITClient()
    
    try:
        availability = client.validate_geos_it_availability(latitude, longitude)
        return {
            'available': availability['available'],
            'message': availability['message'],
            'latest_date': availability.get('latest_date'),
            'data_quality': availability.get('data_quality')
        }
        
    except Exception as e:
        return {
            'available': False,
            'message': f"Location validation failed: {str(e)}",
            'latest_date': None,
            'data_quality': 'Unknown'
        }


def get_data_summary_for_dashboard(df):
    """
    Generate summary statistics for dashboard display.
    
    Args:
        df (pandas.DataFrame): NASA POWER data
        
    Returns:
        dict: Summary statistics for frontend display
    """
    
    if df is None or df.empty:
        return {'error': 'No data available'}
    
    try:
        client = NASAPowerGEOSITClient()
        summary = client.get_data_summary(df)
        
        # Format for dashboard consumption
        dashboard_summary = {
            'total_days': df.shape[0],
            'total_features': df.shape[1],
            'date_range': {
                'start': df.index.min().strftime('%Y-%m-%d'),
                'end': df.index.max().strftime('%Y-%m-%d')
            },
            'data_completeness': summary['data_quality']['data_completeness'],
            'missing_records': summary['data_quality']['missing_records'],
            'data_recency': summary['recency'],
            'key_parameters': list(df.columns[:10])  # First 10 for display
        }
        
        return dashboard_summary
        
    except Exception as e:
        return {'error': f'Summary generation failed: {str(e)}'}


# Keep only essential helper functions for dashboard use
def scrape_last_n_days(latitude, longitude, n_days=30):
    """Convenience function to get recent data for dashboard preview."""
    from datetime import datetime, timedelta
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=n_days)
    
    start_str = start_date.strftime("%Y%m%d")
    end_str = end_date.strftime("%Y%m%d")
    
    return get_pv_data_for_dashboard(latitude, longitude, start_str, end_str)


if __name__ == "__main__":
    """
    Simple test when running script directly.
    For dashboard integration, use get_pv_data_for_dashboard() function.
    """
    
    print("🧪 Testing NASA POWER integration for dashboard...")
    
    # Test coordinates (Casablanca, Morocco)
    test_lat = 33.5731
    test_lon = -7.5898
    test_start = "2023-06-01"
    test_end = "2025-08-01"
    
    try:
        # Test data fetching
        df = get_pv_data_for_dashboard(test_lat, test_lon, test_start, test_end)
        
        if df is not None:
            print(f"\n✅ Test successful!")
            print(f"   Data shape: {df.shape}")
            print(f"   Features: {list(df.columns[:5])}...")
            
            # Test summary generation
            summary = get_data_summary_for_dashboard(df)
            print(f"   Summary: {summary.get('total_days', 'N/A')} days, "
                  f"{summary.get('data_completeness', 'N/A')} complete")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
    
    print(f"\n🏁 Test completed. Ready for dashboard integration!")