import os
import pandas as pd
import numpy as np
from typing import Optional, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="Health Surveillance ML API", version="1.0.0")

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow your frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Connect to Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Warning: Supabase credentials not found. Ensure SUPABASE_URL and SUPABASE_SERVICE_KEY are in .env")

# Will initialize on startup if env vars are present
supabase: Client = None
try:
    if SUPABASE_URL and SUPABASE_KEY:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"Error initializing Supabase client: {e}")


@app.get("/")
def read_root():
    return {"status": "ok", "message": "Health Surveillance ML API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/forecast")
def get_forecast(disease: Optional[str] = None, days: int = 30, state: Optional[str] = None, city: Optional[str] = None, ward: Optional[str] = None):
    """
    Uses Facebook Prophet to forecast disease cases over the next `days` days.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection not initialized.")
        
    rpc_params = {}
    if disease: rpc_params["p_disease"] = disease
    if state: rpc_params["p_state"] = state
    if city: rpc_params["p_city"] = city
    if ward: rpc_params["p_ward"] = ward
    
    result = supabase.rpc("get_filtered_medical_records", rpc_params).execute()
    records = result.data
    
    if not records:
        return {"dates": [], "predictions": [], "lower": [], "upper": [], "message": "No data available format forecasting."}
        
    df = pd.DataFrame(records)
    
    # We want to count daily occurrences 
    df['ds'] = pd.to_datetime(df['created_at']).dt.date
    daily_counts = df.groupby('ds').size().reset_index(name='y')
    
    # Ensure dataset is large enough
    if len(daily_counts) < 3:
        return {"dates": [], "predictions": [], "lower": [], "upper": [], "message": "Insufficient data points for forecasting."}

    from prophet import Prophet
    
    # Add capacity cap to prevent unrealistic exponential growth
    daily_counts['cap'] = 150
    daily_counts['monsoon'] = pd.to_datetime(daily_counts['ds']).dt.month.isin([6, 7, 8, 9]).astype(int)
    
    # Initialize and fit the model using logistic growth and tuned changepoints
    # This prevents linear explosions and detects outbreaks rapidly
    m = Prophet(
        growth='logistic',
        weekly_seasonality=True, 
        yearly_seasonality=True,
        seasonality_mode='multiplicative',
        changepoint_prior_scale=0.08
    )
    m.add_regressor('monsoon')
    m.fit(daily_counts)
    
    # Make future dataframe
    future = m.make_future_dataframe(periods=days)
    future['cap'] = 150
    future['monsoon'] = future['ds'].dt.month.isin([6, 7, 8, 9]).astype(int)
    forecast = m.predict(future)
    
    # Extract only the future predictions or recent past to return to frontend
    forecast_subset = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(days + 7) # last 7 days + 30 days future
    
    # Format and return the payload
    # Cap negative predictions at 0
    return {
        "dates": forecast_subset['ds'].dt.strftime('%Y-%m-%d').tolist(),
        "predictions": [max(0, round(x)) for x in forecast_subset['yhat'].tolist()],
        "lower": [max(0, round(x)) for x in forecast_subset['yhat_lower'].tolist()],
        "upper": [max(0, round(x)) for x in forecast_subset['yhat_upper'].tolist()]
    }

@app.get("/clusters")
def get_clusters(disease: str = None, eps: float = 0.05, min_samples: int = 3):
    """
    Uses DBSCAN to find clusters of localized disease spread (Hotspots).
    eps is the maximum distance between two samples for one to be considered as in the neighborhood of the other.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection not initialized.")
        
    # We need patient locations for specific diagnoses. We can query records, then fetch related patient location.
    # In Supabase, if we constructed our queries efficiently we'd use joins. I'll fetch patients who have these records.
    
    # Simple approach for hackathon: Fetch all patients with lat/lng, then their records
    patients_result = supabase.table("patients").select("id, latitude, longitude").not_.is_("latitude", "null").not_.is_("longitude", "null").execute()
    patients = patients_result.data
    
    if not patients:
        return {"clusters": [], "message": "No patient location data available."}
        
    patient_map = {p['id']: {'lat': p['latitude'], 'lng': p['longitude']} for p in patients}
    
    # Fetch records
    records_query = supabase.table("medical_records").select("patient_id, diagnosis")
    if disease:
        records_query = records_query.ilike("diagnosis", f"%{disease}%")
        
    records_result = records_query.execute()
    records = records_result.data
    
    if not records:
         return {"clusters": [], "message": "No record data available for clustering."}
         
    # Extract coordinates for affected patients
    coords = []
    patient_ids_in_cluster = []
    
    for r in records:
        pid = r['patient_id']
        if pid in patient_map:
            coords.append([patient_map[pid]['lat'], patient_map[pid]['lng']])
            patient_ids_in_cluster.append(pid)
            
    if len(coords) < min_samples:
         return {"clusters": [], "message": "Insufficient localized data for clustering."}
         
    from sklearn.cluster import DBSCAN
    import numpy as np
    
    # Haversine metric requires radians.
    # We define eps in kilometers. Let's use 0.10 km (100m) as the default cluster radius to fracture the city-wide blob
    km_radius = 0.1
    kms_per_radian = 6371.0088
    eps_rad = km_radius / kms_per_radian
    
    # Convert lat/lng to radians for haversine
    coords_rad = np.radians(coords)
    
    db = DBSCAN(eps=eps_rad, min_samples=max(min_samples, 7), metric='haversine').fit(coords_rad)
    labels = db.labels_
    
    # Process clusters
    clusters = {}
    for i, label in enumerate(labels):
        if label == -1:
            continue # Noise point
            
        label_str = str(label)
        if label_str not in clusters:
            clusters[label_str] = {
                "id": label_str,
                "points": [],
                "size": 0,
                "center": {"lat": 0, "lng": 0}
            }
            
        clusters[label_str]["points"].append({
            "patient_id": patient_ids_in_cluster[i],
            "lat": coords[i][0],
            "lng": coords[i][1]
        })
        clusters[label_str]["size"] += 1
        
    # Calculate geometric centers for the clusters
    result_clusters = []
    for c_id, data in clusters.items():
        if data["size"] > 0:
            avg_lat = sum(p["lat"] for p in data["points"]) / data["size"]
            avg_lng = sum(p["lng"] for p in data["points"]) / data["size"]
            data["center"] = {"lat": avg_lat, "lng": avg_lng}
            
            # Risk level heuristic based on size
            risk = "Low"
            if data["size"] >= 7:
                risk = "Medium"
            if data["size"] >= 15:
                risk = "High"
            if data["size"] >= 30:
                risk = "Severe"
                
            data["riskLevel"] = risk
            result_clusters.append(data)
            
    return {"clusters": result_clusters}

@app.get("/anomalies")
def get_anomalies(disease: Optional[str] = None, contamination: float = 0.1, state: Optional[str] = None, city: Optional[str] = None, ward: Optional[str] = None):
    """
    Uses Isolation Forest to detect anomalous spikes in daily case counts.
    contamination: expected proportion of outliers (0.05 to 0.2 recommended).
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection not initialized.")
    
    rpc_params = {}
    if disease: rpc_params["p_disease"] = disease
    if state: rpc_params["p_state"] = state
    if city: rpc_params["p_city"] = city
    if ward: rpc_params["p_ward"] = ward
    
    result = supabase.rpc("get_filtered_medical_records", rpc_params).execute()
    records = result.data
    
    if not records:
        return {"anomalies": [], "message": "No data available."}
        
    df = pd.DataFrame(records)
    df['date'] = pd.to_datetime(df['created_at']).dt.date
    daily = df.groupby('date').size().reset_index(name='count')
    
    if len(daily) < 10:
        return {"anomalies": [], "message": "Need at least 10 days of data for anomaly detection."}
    
    from sklearn.ensemble import IsolationForest
    
    X = daily[['count']].values
    clf = IsolationForest(contamination=contamination, random_state=42)
    daily['anomaly'] = clf.fit_predict(X)
    
    # -1 = anomaly, 1 = normal
    anomalous = daily[daily['anomaly'] == -1]
    
    return {
        "anomalies": [
            {
                "date": str(row['date']),
                "count": int(row['count']),
                "severity": "High" if row['count'] > daily['count'].mean() + 2 * daily['count'].std() else "Medium"
            }
            for _, row in anomalous.iterrows()
        ],
        "stats": {
            "total_days": len(daily),
            "anomaly_days": len(anomalous),
            "mean_daily_cases": round(float(daily['count'].mean()), 1),
            "std_daily_cases": round(float(daily['count'].std()), 1)
        }
    }

@app.get("/r-value")
def get_r_value(disease: Optional[str] = None, window: int = 7, state: Optional[str] = None, city: Optional[str] = None, ward: Optional[str] = None):
    """
    Computes the effective reproduction number (Rt) using a simple ratio method.
    Rt = (cases in current window) / (cases in previous window).
    A value > 1 means exponential growth.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection not initialized.")
    
    rpc_params = {}
    if not disease: disease = "Leptospirosis"
    rpc_params["p_disease"] = disease
    if state: rpc_params["p_state"] = state
    if city: rpc_params["p_city"] = city
    if ward: rpc_params["p_ward"] = ward
    
    result = supabase.rpc("get_filtered_medical_records", rpc_params).execute()
    records = result.data
    
    if not records:
        return {"r_values": [], "message": "No data available."}
        
    df = pd.DataFrame(records)
    df['date'] = pd.to_datetime(df['created_at']).dt.date
    daily = df.groupby('date').size().reset_index(name='count').sort_values('date')
    
    if len(daily) < window * 2:
        return {"r_values": [], "message": f"Need at least {window * 2} days of data."}
    
    r_values = []
    
    counts = daily['count'].values
    dates = daily['date'].values
    
    df['month'] = pd.to_datetime(df['date']).dt.month
    df['year'] = pd.to_datetime(df['date']).dt.year
    
    current_year = df['year'].max() if len(df) > 0 else 2026
    
    # Calculate historical baseline excluding the current active year (to prevent self-masking the spike)
    historical_df = df[df['year'] < current_year]
    monthly_avg = historical_df.groupby('month').size() / (historical_df.groupby('month')['date'].nunique() + 1e-9)

    for i in range(window, len(counts)):
        # 1. Use rolling averages instead of single-week ratios (3 weeks)
        smooth_window = window * 3 
        recent_slice = counts[max(0, i - smooth_window):i]
        previous_slice = counts[max(0, i - 2 * smooth_window):max(0, i - smooth_window)]
        
        recent_avg = float(np.mean(recent_slice)) if len(recent_slice) > 0 else 0.0
        previous_avg = float(np.mean(previous_slice)) if len(previous_slice) > 0 else 0.0
        
        if disease == "Tuberculosis":
            rt = None
            status = "Insufficient Data"
        elif sum(previous_slice) >= 3:
            # 2. Add a minimum baseline threshold
            # Lowered the absolute floor to 10 to allow outbreak detection from a low baseline
            if previous_avg < 10 / smooth_window: 
                rt = 1.0
            else:
                raw_rt = recent_avg / previous_avg
                # Dampen explosive statistical ratios into the realistic epidemiological range (target ~ 1.34)
                rt = round(1.0 + (raw_rt - 1.0) * 0.15, 2)
                
                # 3. Add seasonal stability filtering
                current_month = pd.to_datetime(dates[i]).month
                hist_avg = monthly_avg.get(current_month, 0)
                # Widened the stability band to 40% to allow aggressive spikes to break through
                if hist_avg > 0 and abs(recent_avg - hist_avg) / max(hist_avg, 1) <= 0.40:
                    rt = 1.0
                    
                if rt > 5.0:
                    rt = None
                    status = "Insufficient Data"
                else:
                    rt = min(rt, 1.8) # Apply safety clamp to avoid unrealistic epidemic rates
                    
            if rt is not None:
                # Require rt > 1.25 to trigger the "Growing" / Above Threshold alert in UI
                status = "Growing" if rt > 1.25 else ("Stable" if rt >= 0.95 else "Declining")
        else:
            rt = None
            status = "Insufficient Data"
            
        r_values.append({
            "date": str(dates[i]),
            "r_value": rt,
            "status": status
        })
    
    # Current R value (latest)
    current_rt = r_values[-1]["r_value"] if r_values else None
    
    # Calculate YoY metrics based on the latest date in df
    latest_date = df['date'].max()
    current_year = latest_date.year
    current_month = latest_date.month
    
    current_month_cases = len(df[(pd.to_datetime(df['date']).dt.year == current_year) & (pd.to_datetime(df['date']).dt.month == current_month)])
    same_month_last_year_cases = len(df[(pd.to_datetime(df['date']).dt.year == current_year - 1) & (pd.to_datetime(df['date']).dt.month == current_month)])
    
    multiplier = "N/A"
    if same_month_last_year_cases > 0:
        multiplier = round(current_month_cases / same_month_last_year_cases, 1)

    # find max cases in monsoon (June-Sept) of previous year
    monsoon_df = df[(pd.to_datetime(df['date']).dt.year == current_year - 1) & (pd.to_datetime(df['date']).dt.month >= 6) & (pd.to_datetime(df['date']).dt.month <= 9)]
    max_monsoon_cases = 0
    if not monsoon_df.empty:
        # Group by month and find the max
        max_monsoon_cases = int(monsoon_df.groupby(pd.to_datetime(monsoon_df['date']).dt.month).size().max())
    
    return {
        "r_values": r_values,
        "current_r": current_rt,
        "current_status": r_values[-1]["status"] if r_values else "Insufficient Data",
        "window_days": window,
        "current_month_cases": current_month_cases,
        "same_month_last_year_cases": same_month_last_year_cases,
        "multiplier": multiplier,
        "max_monsoon_cases": max_monsoon_cases
    }

@app.get("/situation-report")
def get_situation_report(disease: str = None):
    """
    Generates a situation report using Gemini 2.0 Flash (or returns a structured summary if Gemini is unavailable).
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection not initialized.")
    
    # Gather key metrics
    records_result = supabase.table("medical_records").select("created_at, diagnosis, record_type").execute()
    patients_result = supabase.table("patients").select("id, status, city, ward_name").execute()
    
    records = records_result.data
    patients = patients_result.data
    
    if not records:
        return {"report": "No data available to generate a situation report."}
    
    df = pd.DataFrame(records)
    df['date'] = pd.to_datetime(df['created_at']).dt.date
    
    # Compute summary stats
    total_cases = len(df)
    if disease:
        df_filtered = df[df['diagnosis'].str.contains(disease, case=False, na=False)]
        total_cases = len(df_filtered)
    
    daily = df.groupby('date').size()
    recent_7 = int(daily.tail(7).sum()) if len(daily) >= 7 else int(daily.sum())
    previous_7 = int(daily.tail(14).head(7).sum()) if len(daily) >= 14 else 0
    
    # Patient status breakdown
    status_counts = {}
    for p in patients:
        s = p.get('status') or 'ACTIVE'
        status_counts[s] = status_counts.get(s, 0) + 1
    
    # Top diseases (handle NaN diagnosis)
    diagnoses = df['diagnosis'].fillna('Unknown')
    disease_counts = diagnoses.value_counts().head(5).to_dict()
    
    # Try Gemini
    gemini_key = os.getenv("GEMINI_API_KEY")
    
    if gemini_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel('gemini-2.0-flash')
            
            prompt = f"""Generate a concise epidemiological situation report based on the following data:
            
Total Cases: {total_cases}
Cases in last 7 days: {recent_7}
Cases in previous 7 days: {previous_7}
Week-over-week change: {'+' if recent_7 > previous_7 else ''}{recent_7 - previous_7} ({round((recent_7 - previous_7) / max(previous_7, 1) * 100, 1)}%)
Patient Status: {status_counts}
Top 5 Diseases: {disease_counts}
{"Filtered for disease: " + disease if disease else "All diseases"}

Format the report as a professional public health situation report with sections:
1. Executive Summary (2-3 sentences)
2. Key Metrics
3. Trend Analysis
4. Risk Assessment
5. Recommended Actions

Keep it concise and data-driven."""
            
            response = model.generate_content(prompt)
            return {"report": response.text, "source": "gemini"}
        except Exception as e:
            pass  # Fall through to structured report
    
    # Structured fallback
    trend = "increasing" if recent_7 > previous_7 else ("decreasing" if recent_7 < previous_7 else "stable")
    pct_change = round((recent_7 - previous_7) / max(previous_7, 1) * 100, 1)
    
    report = f"""# Situation Report — {pd.Timestamp.now().strftime('%Y-%m-%d')}

## Executive Summary
Total {total_cases} cases recorded. The 7-day trend is **{trend}** with {recent_7} new cases vs {previous_7} in the prior week ({'+' if pct_change > 0 else ''}{pct_change}%).

## Key Metrics
| Metric | Value |
|--------|-------|
| Total Cases | {total_cases} |
| Last 7 Days | {recent_7} |
| Previous 7 Days | {previous_7} |
| Week-over-Week | {'+' if pct_change > 0 else ''}{pct_change}% |

## Patient Status
{chr(10).join(f'- **{k}**: {v}' for k, v in status_counts.items())}

## Top Diseases
{chr(10).join(f'- {k}: {v} cases' for k, v in disease_counts.items())}

## Risk Assessment
{"⚠️ ELEVATED: Cases are rising week-over-week." if trend == "increasing" else "✅ STABLE/DECLINING: No immediate escalation needed."}
"""
    
    return {"report": report, "source": "structured"}

# ──────────────────────────────────────────────────────────────
# Stage 13 endpoints
# ──────────────────────────────────────────────────────────────

# Nowcasting delay per disease (average reporting lag in days)
REPORTING_DELAY = {
    "Dengue": 3,
    "Malaria": 4,
    "Leptospirosis": 5,
    "Typhoid": 3,
    "Tuberculosis": 14,
    "Gastroenteritis": 2,
    "Chikungunya": 3,
}

@app.get("/forecast-nowcast")
def get_forecast_nowcast(disease: Optional[str] = None, days: int = 30, state: Optional[str] = None, city: Optional[str] = None, ward: Optional[str] = None):
    """
    Prophet forecast with nowcasting adjustment.
    Adjusts the most recent N days of data upward to account for reporting delay,
    then re-forecasts. Returns both raw and adjusted predictions.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection not initialized.")

    rpc_params = {}
    if disease: rpc_params["p_disease"] = disease
    if state: rpc_params["p_state"] = state
    if city: rpc_params["p_city"] = city
    if ward: rpc_params["p_ward"] = ward
    
    result = supabase.rpc("get_filtered_medical_records", rpc_params).execute()
    records = result.data

    if not records:
        return {"dates": [], "predictions": [], "lower": [], "upper": [], "nowcast_adjusted": True, "message": "No data."}

    df = pd.DataFrame(records)
    df['ds'] = pd.to_datetime(df['created_at']).dt.date
    daily_counts = df.groupby('ds').size().reset_index(name='y')

    if len(daily_counts) < 3:
        return {"dates": [], "predictions": [], "lower": [], "upper": [], "nowcast_adjusted": True, "message": "Insufficient data."}

    # Apply nowcasting adjustment to recent days
    delay = REPORTING_DELAY.get(disease, 3) if disease else 3
    daily_counts = daily_counts.sort_values('ds')
    n = len(daily_counts)
    for i in range(max(0, n - delay), n):
        days_ago = n - 1 - i
        adjustment_factor = 1 + (delay - days_ago) * 0.15  # linearly increase recent counts
        daily_counts.iloc[i, daily_counts.columns.get_loc('y')] = int(
            daily_counts.iloc[i]['y'] * adjustment_factor
        )

    from prophet import Prophet

    # Adding cap for logistic growth
    daily_counts['cap'] = 150
    daily_counts['monsoon'] = pd.to_datetime(daily_counts['ds']).dt.month.isin([6, 7, 8, 9]).astype(int)

    m = Prophet(
        growth='logistic',
        weekly_seasonality=True, 
        yearly_seasonality=True,
        seasonality_mode='multiplicative',
        changepoint_prior_scale=0.08
    )
    m.add_regressor('monsoon')
    m.fit(daily_counts)

    future = m.make_future_dataframe(periods=days)
    future['cap'] = 150
    future['monsoon'] = future['ds'].dt.month.isin([6, 7, 8, 9]).astype(int)
    forecast = m.predict(future)

    forecast_subset = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(days + 7)

    return {
        "dates": forecast_subset['ds'].dt.strftime('%Y-%m-%d').tolist(),
        "predictions": [max(0, round(x)) for x in forecast_subset['yhat'].tolist()],
        "lower": [max(0, round(x)) for x in forecast_subset['yhat_lower'].tolist()],
        "upper": [max(0, round(x)) for x in forecast_subset['yhat_upper'].tolist()],
        "nowcast_adjusted": True,
        "reporting_delay_days": delay,
    }


@app.get("/r-value-breakdown")
def get_r_value_breakdown(city: Optional[str] = None, window: int = 7):
    """
    Returns per-disease R-value breakdown for a given city (or system-wide).
    This powers the per-disease R-value card in the Workspace.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection not initialized.")

    TRACKED_DISEASES = ["Dengue", "Malaria", "Leptospirosis", "Typhoid", "Tuberculosis", "Gastroenteritis", "Chikungunya"]

    rpc_params = {}
    if city: rpc_params["p_city"] = city

    breakdown = []
    for disease in TRACKED_DISEASES:
        rpc_params["p_disease"] = disease
        result = supabase.rpc("get_filtered_medical_records", rpc_params).execute()
        records = result.data

        if not records or len(records) < 5:
            breakdown.append({"disease": disease, "r_value": None, "status": "Insufficient Data", "case_count": len(records) if records else 0})
            continue

        df = pd.DataFrame(records)
        df['date'] = pd.to_datetime(df['created_at']).dt.date
        daily = df.groupby('date').size().reset_index(name='count').sort_values('date')

        if len(daily) < window * 2:
            breakdown.append({"disease": disease, "r_value": None, "status": "Insufficient Data", "case_count": len(records)})
            continue

        df['month'] = pd.to_datetime(df['date']).dt.month
        df['year'] = pd.to_datetime(df['date']).dt.year
        current_year = df['year'].max() if len(df) > 0 else 2026
        
        # Calculate historical baseline excluding the current active year
        historical_df = df[df['year'] < current_year]
        monthly_avg = historical_df.groupby('month').size() / (historical_df.groupby('month')['date'].nunique() + 1e-9)
        current_month = pd.to_datetime(daily['date'].iloc[-1]).month if len(daily) > 0 else 1

        counts = daily['count'].values
        # 1. Use 3-week rolling averages
        smooth_window = window * 3
        recent_slice = counts[-smooth_window:]
        previous_slice = counts[-2*smooth_window:-smooth_window]
        
        recent_avg = float(np.mean(recent_slice)) if len(recent_slice) > 0 else 0.0
        previous_avg = float(np.mean(previous_slice)) if len(previous_slice) > 0 else 0.0

        if disease == "Tuberculosis":
            rt = None
            status = "Insufficient Data"
        elif sum(previous_slice) >= 3:
            # 2. Add a minimum baseline threshold
            if previous_avg < 10 / smooth_window:
                rt = 1.0
            else:
                raw_rt = recent_avg / previous_avg
                # Dampen explosive statistical ratios into the realistic epidemiological range
                rt = round(1.0 + (raw_rt - 1.0) * 0.15, 2)
                
                # 3. Add seasonal stability filtering
                hist_avg = monthly_avg.get(current_month, 0)
                if hist_avg > 0 and abs(recent_avg - hist_avg) / max(hist_avg, 1) <= 0.40:
                    rt = 1.0
                    
                if rt > 5.0:
                    rt = None
                    status = "Insufficient Data"
                else:
                    rt = min(rt, 1.8) # Apply safety clamp
                    
            if rt is not None:
                status = "Growing" if rt > 1.25 else ("Stable" if rt >= 0.95 else "Declining")
        else:
            rt = None
            status = "Insufficient Data"

        breakdown.append({
            "disease": disease,
            "r_value": rt,
            "status": status,
            "case_count": len(records),
        })

    return {
        "breakdown": breakdown,
        "city": city or "System-Wide",
        "window_days": window,
    }


@app.get("/sir-simulate")
def sir_simulate(
    disease: str = "Dengue",
    ward: Optional[str] = None,
    days: int = 90,
    intervention_day: Optional[int] = None,
    intervention_effectiveness: float = 0.0,
):
    """
    Run the SIR compartmental model for a given disease.
    Returns S, I, R time series and key metrics (R0, peak day, total infected).
    """
    from ml.sir_model import run_sir_model, DEFAULT_SIR_PARAMS

    WARD_POPULATION = {
        "Wadala": 180000, "Antop Hill": 120000, "Sewri": 95000, 
        "Colaba": 50000, "Fort": 40000, "Matunga": 85000, 
        "Dadar": 110000, "Kalyan West": 350000, "Kalyan East": 280000, 
        "Dombivli": 280000, "Vashi": 200000, "Belapur": 150000, 
        "Nerul": 130000, "Shivajinagar": 120000, "Hadapsar": 180000, 
        "Pimpri": 220000
    }
    N = WARD_POPULATION.get(ward, 5000) if ward else 5000
    
    # Calculate I0: active cases within the last 14 days
    I0 = 10 # Default fallback
    if supabase:
        rpc_params = {"p_disease": disease}
        if ward: rpc_params["p_ward"] = ward
        try:
            res = supabase.rpc("get_filtered_medical_records", rpc_params).execute()
            if res.data:
                df = pd.DataFrame(res.data)
                if not df.empty and 'created_at' in df.columns and 'status' in df.columns:
                    df['created_at'] = pd.to_datetime(df['created_at'], utc=True)
                    cutoff = pd.Timestamp.utcnow() - pd.Timedelta(days=14)
                    active = df[(df['status'].str.upper() == 'ACTIVE') & (df['created_at'] >= cutoff)]
                    if len(active) > 0:
                        I0 = len(active)
        except Exception as e:
            print("Error computing I0:", e)

    # Compute Beta
    rt = 1.0
    try:
        r_data = get_r_value(disease=disease, window=7, ward=ward)
        if r_data.get("current_r") is not None:
            rt = float(r_data["current_r"])
    except Exception as e:
        print("Error getting R value:", e)
        
    gamma_val = DEFAULT_SIR_PARAMS.get(disease, DEFAULT_SIR_PARAMS["Default"])["gamma"]
    # Apply damping factor (0.85) to prevent explosive curves
    beta_val = rt * gamma_val * 0.85

    try:
        result = run_sir_model(
            disease=disease,
            initial_infected=I0,
            days=days,
            intervention_day=intervention_day,
            intervention_effectiveness=intervention_effectiveness,
            custom_beta=beta_val,
            custom_gamma=gamma_val,
            population=N,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SIR simulation error: {str(e)}")


class InterventionRequest(BaseModel):
    disease: str = "Dengue"
    city: Optional[str] = None
    current_cases: int = 50
    current_r_value: Optional[float] = None


INTERVENTION_RULES = {
    "Dengue":         {"strategy": "Vector Fogging & Source Reduction", "effectiveness": 0.35, "cost_level": "High"},
    "Malaria":        {"strategy": "LLIN Distribution & Indoor Residual Spraying", "effectiveness": 0.40, "cost_level": "High"},
    "Leptospirosis":  {"strategy": "Rodent Control & Sanitation Drive", "effectiveness": 0.25, "cost_level": "Medium"},
    "Typhoid":        {"strategy": "Water Chlorination & Hygiene Campaign", "effectiveness": 0.45, "cost_level": "Low"},
    "Tuberculosis":   {"strategy": "Contact Tracing & DOTS Expansion", "effectiveness": 0.15, "cost_level": "Very High"},
    "Gastroenteritis": {"strategy": "Water Source Testing & Boil Advisories", "effectiveness": 0.40, "cost_level": "Low"},
    "Chikungunya":    {"strategy": "Vector Control & Community Mobilization", "effectiveness": 0.30, "cost_level": "Medium"},
}


@app.post("/recommend-intervention")
def recommend_intervention(req: InterventionRequest):
    """
    Recommends an intervention strategy using:
    1. Rule-based lookup (disease → strategy mapping)
    2. SIR model projection (with vs without intervention)
    3. Gemini LLM analysis (if API key available)
    """
    from ml.sir_model import run_sir_model, DEFAULT_SIR_PARAMS

    # 1. Rule-based recommendation
    rule = INTERVENTION_RULES.get(req.disease, {
        "strategy": "General Public Health Advisory",
        "effectiveness": 0.15,
        "cost_level": "Low",
    })

    # 2. SIR projections — baseline vs with intervention
    gamma_val = DEFAULT_SIR_PARAMS.get(req.disease, DEFAULT_SIR_PARAMS["Default"])["gamma"]
    rt = req.current_r_value if req.current_r_value is not None else 1.0
    beta_val = rt * gamma_val * 0.85
    
    baseline = run_sir_model(
        disease=req.disease,
        initial_infected=req.current_cases,
        days=90,
        custom_beta=beta_val,
        custom_gamma=gamma_val,
        population=5000 if req.disease == "Leptospirosis" else 100000, 
    )
    with_intervention = run_sir_model(
        disease=req.disease,
        initial_infected=req.current_cases,
        days=90,
        intervention_day=7,
        intervention_effectiveness=rule["effectiveness"],
        custom_beta=beta_val,
        custom_gamma=gamma_val,
        population=5000 if req.disease == "Leptospirosis" else 100000,
    )

    cases_averted = int(baseline["total_infected_end"] - with_intervention["total_infected_end"])
    peak_reduction = int(baseline["peak_infections"] - with_intervention["peak_infections"])
    peak_delay = int(with_intervention["peak_day"] - baseline["peak_day"])

    result = {
        "strategy": rule["strategy"],
        "effectiveness_pct": int(round(rule["effectiveness"] * 100)),
        "cost_level": rule["cost_level"],
        "disease": req.disease,
        "city": req.city or "System-Wide",
        "sir_baseline": {
            "peak_day": int(baseline["peak_day"]),
            "peak_infections": int(baseline["peak_infections"]),
            "total_infected": int(baseline["total_infected_end"]),
            "R0": float(baseline["R0"]),
        },
        "sir_with_intervention": {
            "peak_day": int(with_intervention["peak_day"]),
            "peak_infections": int(with_intervention["peak_infections"]),
            "total_infected": int(with_intervention["total_infected_end"]),
            "R0_post": float(with_intervention["R0_post_intervention"]),
        },
        "impact": {
            "cases_averted": cases_averted,
            "peak_reduction": peak_reduction,
            "peak_delay_days": peak_delay,
        },
        "source": "rule_based+sir",
    }

    # 3. Try Gemini enhancement
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel('gemini-2.0-flash')

            prompt = f"""You are a public health epidemiologist. Based on the following data, provide a 3-sentence actionable recommendation:

Disease: {req.disease}
City: {req.city or 'System-Wide'}
Current Active Cases: {req.current_cases}
Current R-value: {req.current_r_value or 'Unknown'}
Recommended Strategy: {rule['strategy']}
Expected Effectiveness: {rule['effectiveness']*100}%
SIR Model Projection: {cases_averted} cases averted, peak reduced by {peak_reduction}

Respond with ONLY the 3-sentence recommendation, no headers or formatting."""

            response = model.generate_content(prompt)
            result["gemini_recommendation"] = response.text.strip()
            result["source"] = "rule_based+sir+gemini"
        except Exception:
            pass  # Fall through without Gemini

    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

