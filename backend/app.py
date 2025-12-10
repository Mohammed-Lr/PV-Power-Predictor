from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import io
import os
from scrape_nasa_data import get_pv_data_for_dashboard, validate_location_availability, get_data_summary_for_dashboard
from model_handler import PVModelHandler

app = Flask(__name__)
CORS(app)

model_handler = None

def load_model():
    global model_handler
    try:
        # Update the model path to match your saved model
        model_handler = PVModelHandler("final_pv_model.pkl")
        print(f"✅ Model handler initialized successfully")
    except Exception as e:
        print(f"❌ Error loading model handler: {e}")
        model_handler = None

@app.route('/api/model-metrics', methods=['GET'])
def get_model_metrics():
    if model_handler is None:
        return jsonify({"error": "Model not loaded"}), 500
    
    # Get metrics from the model handler and add additional info
    metrics = model_handler.get_model_metrics()
    
    # Add additional dashboard-specific information
    additional_info = {
        "temporal_coverage": "2020-present (~4-day delay)",
        "spatial_coverage": "Global",
        "training_period": "2023-06-01 to 2025-07-31",
        "features_count": "18 features (inc. Capacity)",
        "performance_metrics": {
            "status": "Model loaded and ready",
            "data_quality": "High (NASA validated)",
            "update_frequency": "Daily",
            "prediction_unit": "kWh"
        },
        "parameters_used": [
            "System Capacity (kWp)",
            "Temperature (2m)",
            "Wind Speed",
            "Precipitation",
            "Humidity",
            "Solar Irradiance (GHI, DNI, Diffuse)",
            "Cloud Amount",
            "Thermal Radiation"
        ],
        "geographic_info": {
            "coordinate_system": "WGS84",
            "resolution": "Point data",
            "lat_range": "[-90, 90]",
            "lon_range": "[-180, 180]"
        }
    }
    
    # Merge metrics with additional info
    metrics.update(additional_info)
    
    return jsonify(metrics)

@app.route('/api/validate-location', methods=['POST'])
def validate_location():
    try:
        data = request.json
        latitude = float(data['latitude'])
        longitude = float(data['longitude'])
        
        if not (-90 <= latitude <= 90):
            return jsonify({"error": "Latitude must be between -90 and 90"}), 400
        
        if not (-180 <= longitude <= 180):
            return jsonify({"error": "Longitude must be between -180 and 180"}), 400
            
        availability = validate_location_availability(latitude, longitude)
        return jsonify(availability)
        
    except Exception as e:
        return jsonify({"error": f"Location validation failed: {str(e)}"}), 400

@app.route('/api/predictions', methods=['POST'])
def generate_predictions():
    if model_handler is None or not model_handler.is_loaded:
        return jsonify({"error": "Model not loaded"}), 500
        
    try:
        data = request.json
        latitude = float(data['latitude'])
        longitude = float(data['longitude'])
        capacity = float(data.get('capacity', 1.0)) # Default to 1.0 if not provided
        start_date = data['start_date']
        end_date = data['end_date']
        
        if not (-90 <= latitude <= 90) or not (-180 <= longitude <= 180):
            return jsonify({"error": "Invalid coordinates"}), 400
            
        start_dt = datetime.strptime(start_date, '%Y-%m-%d')
        end_dt = datetime.strptime(end_date, '%Y-%m-%d')
        
        if start_dt >= end_dt:
            return jsonify({"error": "Start date must be before end date"}), 400
            
        if (end_dt - start_dt).days > 365:
            return jsonify({"error": "Date range cannot exceed 1 year"}), 400
            
        print(f"🚀 Generating predictions for ({latitude}, {longitude}) Capacity: {capacity}kW from {start_date} to {end_date}")
        
        df = get_pv_data_for_dashboard(latitude, longitude, start_date, end_date)
        
        if df is None or df.empty:
            return jsonify({"error": "No NASA POWER data available for this location and date range"}), 400
            
        # Use model handler for predictions, passing capacity
        predictions_kwh = model_handler.predict(df, capacity=capacity)
        
        mad_per_kwh = 1.2
        financial_savings = model_handler.calculate_financial_savings(predictions_kwh, mad_per_kwh)
        
        results = []
        for i, (date, pred, savings) in enumerate(zip(df.index, predictions_kwh, financial_savings)):
            results.append({
                "date": date.strftime('%Y-%m-%d'),
                "pv_production_kwh": round(float(pred), 1),       # Rounded to 1 decimal
                "financial_savings_mad": round(float(savings), 1), # Rounded to 1 decimal
                "weather_data": {k: round(float(v), 3) if pd.notna(v) else None 
                               for k, v in df.iloc[i].to_dict().items()}
            })
            
        summary = get_data_summary_for_dashboard(df)
        
        # Use model handler for prediction summary
        prediction_summary = model_handler.get_prediction_summary(predictions_kwh, mad_per_kwh)
        
        # Merge with data summary
        combined_summary = {
            **prediction_summary,
            "date_range": summary.get('date_range', {}),
            "data_completeness": summary.get('data_completeness', 'Unknown')
        }
        
        response = {
            "success": True,
            "predictions": results,
            "summary": combined_summary,
            "metadata": {
                "location": f"{latitude}, {longitude}",
                "capacity": capacity,
                "conversion_rate": f"{mad_per_kwh} MAD/kWh",
                "model": "Final PV Model",
                "data_source": "NASA POWER GEOS-IT"
            }
        }
        
        return jsonify(response)
        
    except ValueError as e:
        return jsonify({"error": f"Invalid input format: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": f"Prediction generation failed: {str(e)}"}), 500

@app.route('/api/export', methods=['POST'])
def export_data():
    try:
        data = request.json
        predictions = data.get('predictions', [])
        summary = data.get('summary', {})
        metadata = data.get('metadata', {})
        
        if not predictions:
            return jsonify({"error": "No prediction data provided"}), 400
            
        predictions_df = pd.DataFrame(predictions)
        
        if 'weather_data' in predictions_df.columns:
            weather_df = pd.json_normalize(predictions_df['weather_data'])
            predictions_df = predictions_df.drop('weather_data', axis=1)
            export_df = pd.concat([predictions_df, weather_df], axis=1)
        else:
            export_df = predictions_df
            
        summary_df = pd.DataFrame([summary])
        metadata_df = pd.DataFrame([metadata])
        
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            export_df.to_excel(writer, sheet_name='Predictions', index=False)
            summary_df.to_excel(writer, sheet_name='Summary', index=False)
            metadata_df.to_excel(writer, sheet_name='Metadata', index=False)
            
        output.seek(0)
        
        location = metadata.get('location', 'unknown')
        date_range = summary.get('date_range', {})
        start_date = date_range.get('start', 'unknown')
        end_date = date_range.get('end', 'unknown')
        
        filename = f"pv_predictions_{location}_{start_date}_{end_date}.xlsx".replace(', ', '_').replace(' ', '_')
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        return jsonify({"error": f"Export failed: {str(e)}"}), 500

@app.route('/health', methods=['GET'])
def health_check():
    model_health = model_handler.validate_model_health() if model_handler else {"healthy": False, "error": "Handler not initialized"}
    
    return jsonify({
        "status": "healthy",
        "model_loaded": model_handler is not None and model_handler.is_loaded,
        "model_health": model_health,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/model-health', methods=['GET'])
def detailed_model_health():
    """Detailed model health check endpoint"""
    if model_handler is None:
        return jsonify({"error": "Model handler not initialized"}), 500
        
    health_report = model_handler.validate_model_health()
    metrics = model_handler.get_model_metrics()
    
    return jsonify({
        "health_status": health_report,
        "model_metrics": metrics,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/reload-model', methods=['POST'])
def reload_model():
    """Endpoint to reload the model without restarting the server"""
    global model_handler
    try:
        if model_handler:
            model_handler.reload_model()
        else:
            load_model()
            
        if model_handler and model_handler.is_loaded:
            return jsonify({
                "success": True,
                "message": "Model reloaded successfully",
                "timestamp": datetime.now().isoformat()
            })
        else:
            return jsonify({"error": "Failed to reload model"}), 500
            
    except Exception as e:
        return jsonify({"error": f"Model reload failed: {str(e)}"}), 500

if __name__ == '__main__':
    print("🚀 Starting PV Prediction Dashboard API...")
    load_model()
    app.run(debug=True, host='0.0.0.0', port=5000)