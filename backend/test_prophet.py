import os
import pandas as pd
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

result = supabase.rpc("get_filtered_medical_records", {}).execute()
records = result.data

df = pd.DataFrame(records)
print("Records count:", len(df))
if len(df) > 0:
    print("Columns:", df.columns)

df['ds'] = pd.to_datetime(df['created_at']).dt.date
daily_counts = df.groupby('ds').size().reset_index(name='y')

from prophet import Prophet
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
print("Fit successful!")
