import pickle
import pandas as pd
import numpy as np
from datetime import datetime
import os


class EnsembleModel:
    """Custom ensemble model class that wraps your saved ensemble dictionary"""
    
    def __init__(self, ensemble_dict):
        self.models = ensemble_dict['models']
        self.weights = ensemble_dict['weights']
        self.model_names = list(self.models.keys())
        
    def predict(self, X):
        """Make predictions using weighted ensemble"""
        if isinstance(X, pd.DataFrame):
            X_array = X.values
        else:
            X_array = X
            
        predictions = {}
        for name, model in self.models.items():
            predictions[name] = model.predict(X_array)
        
        # Calculate weighted average
        weighted_pred = sum(self.weights[name] * predictions[name] for name in self.model_names)
        
        return weighted_pred
    
    @property
    def n_features_in_(self):
        """Get number of features from one of the base models"""
        first_model = next(iter(self.models.values()))
        if hasattr(first_model, 'n_features_in_'):
            return first_model.n_features_in_
        return None
    
    def get_model_info(self):
        """Get information about the ensemble"""
        return {
            'type': 'WeightedEnsemble',
            'base_models': list(self.models.keys()),
            'weights': self.weights,
            'n_models': len(self.models)
        }


class PVModelHandler:
    def __init__(self, model_path="weighted_ensemble_model.pkl"):
        self.model_path = model_path
        self.model = None
        self.model_info = None
        self.is_loaded = False
        self.ensemble_info = None
        self.load_model()
    
    def load_model(self):
        try:
            if not os.path.exists(self.model_path):
                raise FileNotFoundError(f"Model file not found: {self.model_path}")
            
            with open(self.model_path, 'rb') as f:
                loaded_object = pickle.load(f)
            
            # Handle different types of loaded objects
            if hasattr(loaded_object, 'predict'):
                # Direct model object
                self.model = loaded_object
                print(f"✅ Loaded model directly: {type(self.model).__name__}")
                
            elif isinstance(loaded_object, dict):
                # Check if it's an ensemble dictionary
                if 'models' in loaded_object and 'weights' in loaded_object:
                    # Create ensemble model wrapper
                    self.model = EnsembleModel(loaded_object)
                    self.ensemble_info = self.model.get_model_info()
                    print(f"✅ Loaded ensemble model with {len(loaded_object['models'])} base models:")
                    for name, weight in loaded_object['weights'].items():
                        print(f"   - {name}: weight={weight:.4f}")
                else:
                    # Try to find model in other dictionary structure
                    possible_keys = ['model', 'trained_model', 'clf', 'regressor', 'estimator']
                    model_found = False
                    for key in possible_keys:
                        if key in loaded_object and hasattr(loaded_object[key], 'predict'):
                            self.model = loaded_object[key]
                            model_found = True
                            print(f"✅ Found model in dictionary key '{key}': {type(self.model).__name__}")
                            break
                    
                    if not model_found:
                        available_keys = list(loaded_object.keys())
                        raise ValueError(f"No model with 'predict' method found. Available keys: {available_keys}")
                        
            else:
                raise ValueError(f"Loaded object type {type(loaded_object)} is not supported.")
            
            self.is_loaded = True
            self._extract_model_info()
            print(f"✅ PV model loaded successfully from {self.model_path}")
            
        except Exception as e:
            print(f"❌ Failed to load model: {e}")
            self.model = None
            self.is_loaded = False
            raise
    
    def _extract_model_info(self):
        if self.model is None:
            return
        
        model_type = type(self.model).__name__
        
        # Handle ensemble model info
        if isinstance(self.model, EnsembleModel):
            model_type = "WeightedEnsemble"
            feature_count = self.model.n_features_in_
        else:
            feature_count = None
            if hasattr(self.model, 'n_features_in_'):
                feature_count = self.model.n_features_in_
            elif hasattr(self.model, 'coef_'):
                if hasattr(self.model.coef_, 'shape'):
                    feature_count = self.model.coef_.shape[0] if len(self.model.coef_.shape) == 1 else self.model.coef_.shape[1]
        
        self.model_info = {
            "model_type": model_type,
            "feature_count": feature_count,
            "sklearn_version": getattr(self.model, '_sklearn_version', 'Unknown'),
            "loaded_at": datetime.now().isoformat(),
            "file_size_mb": round(os.path.getsize(self.model_path) / (1024*1024), 2)
        }
        
        # Add ensemble-specific info
        if self.ensemble_info:
            self.model_info.update({
                "ensemble_info": self.ensemble_info,
                "base_models": self.ensemble_info['base_models'],
                "model_weights": self.ensemble_info['weights']
            })
    
    def validate_input_data(self, df):
        if df is None or df.empty:
            raise ValueError("Input data is empty")
        
        if not isinstance(df, pd.DataFrame):
            raise TypeError("Input must be a pandas DataFrame")
        
        if self.model_info and self.model_info.get('feature_count'):
            expected_features = self.model_info['feature_count']
            actual_features = df.shape[1]
            if actual_features != expected_features:
                print(f"⚠️  Feature count mismatch: expected {expected_features}, got {actual_features}")
        
        nan_count = df.isnull().sum().sum()
        if nan_count > 0:
            print(f"⚠️  Found {nan_count} NaN values in input data")
        
        return True
    
    def preprocess_data(self, df):
        df_processed = df.copy()
        
        # Fill NaN values with column means
        df_processed = df_processed.fillna(df_processed.mean())
        
        # Handle infinite values
        inf_mask = np.isinf(df_processed.select_dtypes(include=[np.number]))
        if inf_mask.any().any():
            df_processed = df_processed.replace([np.inf, -np.inf], np.nan)
            df_processed = df_processed.fillna(df_processed.mean())
            print("⚠️  Replaced infinite values with column means")
        
        return df_processed
    
    def predict(self, df):
        if not self.is_loaded:
            raise RuntimeError("Model is not loaded")
        
        if self.model is None:
            raise RuntimeError("Model object is None")
            
        if not hasattr(self.model, 'predict'):
            raise AttributeError(f"Model object {type(self.model)} does not have a predict method")
        
        self.validate_input_data(df)
        df_processed = self.preprocess_data(df)
        
        try:
            predictions = self.model.predict(df_processed)
            
            # Ensure non-negative predictions (solar can't be negative)
            predictions = np.maximum(predictions, 0)
            
            if len(predictions) != len(df):
                raise ValueError("Prediction length mismatch")
            
            print(f"✅ Generated {len(predictions)} predictions using {self.model_info.get('model_type', 'unknown')} model")
            if isinstance(self.model, EnsembleModel):
                print(f"🔧 Used ensemble of: {', '.join(self.ensemble_info['base_models'])}")
            print(f"📊 Prediction range: {predictions.min():.2f} - {predictions.max():.2f} kWh")
            print(f"📈 Average prediction: {predictions.mean():.2f} kWh")
            
            return predictions
            
        except Exception as e:
            print(f"❌ Prediction failed: {e}")
            print(f"Model type: {type(self.model)}")
            print(f"Model has predict: {hasattr(self.model, 'predict')}")
            if isinstance(self.model, EnsembleModel):
                print(f"Ensemble models: {list(self.model.models.keys())}")
            raise
    
    def predict_single_day(self, data_row):
        if isinstance(data_row, pd.Series):
            df_single = data_row.to_frame().T
        elif isinstance(data_row, dict):
            df_single = pd.DataFrame([data_row])
        else:
            raise TypeError("Input must be pandas Series or dictionary")
        
        return self.predict(df_single)[0]
    
    def calculate_financial_savings(self, predictions_kwh, mad_per_kwh=1.2):
        if not isinstance(predictions_kwh, (list, np.ndarray, pd.Series)):
            predictions_kwh = np.array([predictions_kwh])
        
        savings_mad = predictions_kwh * mad_per_kwh
        return savings_mad
    
    def get_prediction_summary(self, predictions_kwh, mad_per_kwh=1.2):
        predictions_array = np.array(predictions_kwh)
        savings_mad = self.calculate_financial_savings(predictions_array, mad_per_kwh)
        
        summary = {
            "total_days": len(predictions_array),
            "total_production_kwh": float(predictions_array.sum()),
            "total_savings_mad": float(savings_mad.sum()),
            "avg_daily_production_kwh": float(predictions_array.mean()),
            "avg_daily_savings_mad": float(savings_mad.mean()),
            "min_daily_production_kwh": float(predictions_array.min()),
            "max_daily_production_kwh": float(predictions_array.max()),
            "std_daily_production_kwh": float(predictions_array.std()),
            "conversion_rate_mad_per_kwh": mad_per_kwh
        }
        
        return summary
    
    def get_model_metrics(self):
        base_metrics = {
            "model_name": "PV Production Ensemble Model",
            "status": "loaded" if self.is_loaded else "not_loaded",
            "model_path": self.model_path,
            "data_source": "NASA POWER GEOS-IT",
            "prediction_unit": "kWh (daily)",
            "financial_unit": "MAD (Moroccan Dirham)"
        }
        
        if self.model_info:
            base_metrics.update(self.model_info)
        
        return base_metrics
    
    def validate_model_health(self):
        if not self.is_loaded:
            return {"healthy": False, "error": "Model not loaded"}
        
        if self.model is None:
            return {"healthy": False, "error": "Model object is None"}
            
        if not hasattr(self.model, 'predict'):
            return {"healthy": False, "error": f"Model {type(self.model)} does not have predict method"}
        
        try:
            # Create test data with common NASA POWER features
            test_data = pd.DataFrame({
                'ALLSKY_SFC_SW_DWN': [20.5],
                'T2M': [25.0],
                'CLOUD_AMT': [30.0],
                'WS2M': [3.5],
                'RH2M': [60.0]
            })
            
            # Add more dummy features if needed
            if self.model_info and self.model_info.get('feature_count'):
                expected_features = self.model_info['feature_count']
                while len(test_data.columns) < expected_features:
                    test_data[f'dummy_feature_{len(test_data.columns)}'] = [1.0]
            
            test_prediction = self.predict(test_data)
            
            if len(test_prediction) == 1 and not np.isnan(test_prediction[0]):
                health_info = {
                    "healthy": True, 
                    "test_prediction": float(test_prediction[0]),
                    "message": "Model validation successful"
                }
                
                # Add ensemble-specific health info
                if isinstance(self.model, EnsembleModel):
                    health_info["ensemble_status"] = {
                        "base_models": list(self.model.models.keys()),
                        "weights": self.model.weights
                    }
                
                return health_info
            else:
                return {"healthy": False, "error": "Invalid test prediction"}
                
        except Exception as e:
            return {"healthy": False, "error": f"Model validation failed: {str(e)}"}
    
    def reload_model(self):
        print("🔄 Reloading model...")
        self.load_model()


def create_model_handler(model_path="weighted_ensemble_model.pkl"):
    return PVModelHandler(model_path)


if __name__ == "__main__":
    print("🧪 Testing PV Ensemble Model Handler...")
    
    try:
        handler = PVModelHandler()
        
        metrics = handler.get_model_metrics()
        print(f"📊 Model Metrics:")
        for key, value in metrics.items():
            print(f"   {key}: {value}")
        
        health = handler.validate_model_health()
        print(f"\n🏥 Model Health: {health}")
        
        if health['healthy']:
            print("✅ Ensemble model handler is working correctly!")
        else:
            print("❌ Ensemble model handler has issues!")
            
    except Exception as e:
        print(f"❌ Model handler test failed: {e}")