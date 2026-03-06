import pandas as pd
from supabase import create_client
import os

from dotenv import load_dotenv
load_dotenv()

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))

disease = "Leptospirosis"
window = 7
smooth_window = 21

result = supabase.rpc("get_filtered_medical_records", {"p_disease": disease}).execute()
records = result.data

df = pd.DataFrame(records)
df['date'] = pd.to_datetime(df['created_at']).dt.date
daily = df.groupby('date').size().reset_index(name='count').sort_values('date')

df['month'] = pd.to_datetime(df['date']).dt.month
monthly_avg = df.groupby('month').size() / (df.groupby('month')['date'].nunique() + 1e-9)
current_month = pd.to_datetime(daily['date'].iloc[-1]).month if len(daily) > 0 else 1

counts = daily['count'].values
recent_slice = counts[-smooth_window:]
previous_slice = counts[-2*smooth_window:-smooth_window]

recent_avg = float(pd.Series(recent_slice).mean()) if len(recent_slice) > 0 else 0.0
previous_avg = float(pd.Series(previous_slice).mean()) if len(previous_slice) > 0 else 0.0

print(f"Total Leptospirosis cases: {len(df)}")
print(f"Current Month: {current_month}")
print(f"Smooth Window: {smooth_window} days")
print(f"Recent Avg (last 21d): {recent_avg:.2f}")
print(f"Previous Avg (prior 21d): {previous_avg:.2f}")

print(f"\nCondition 1: Is previous_avg < 10 / smooth_window ({10/smooth_window:.2f})? {previous_avg < 10 / smooth_window}")

hist_avg = monthly_avg.get(current_month, 0)
print(f"\nHist Avg for month {current_month}: {hist_avg:.2f}")
stb_ratio = abs(recent_avg - hist_avg) / max(hist_avg, 1)
print(f"Condition 3: Is stb_ratio ({stb_ratio:.2f}) <= 0.40? {stb_ratio <= 0.40}")

if previous_avg > 0:
    raw_rt = recent_avg / previous_avg
    print(f"\nRaw Rt before dampeners: {raw_rt:.2f}")
