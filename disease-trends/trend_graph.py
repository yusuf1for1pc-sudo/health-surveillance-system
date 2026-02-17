#!/usr/bin/env python3
"""
Disease Trend Graph Visualization
==================================

Interactive time-series visualization showing disease case trends 
with automated outbreak spike detection.

Features:
- Multi-disease line charts
- Daily/weekly aggregation
- City filtering
- Outbreak spike detection (red dots)
- Dashboard-ready HTML export

Dependencies: pip install pandas plotly numpy
"""

import pandas as pd
import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from datetime import datetime, timedelta
import random


# ============================================================================
# CONFIGURATION
# ============================================================================

DISEASE_COLORS = {
    'Dengue': '#FF6B6B',      # Red
    'Malaria': '#4ECDC4',     # Teal
    'Typhoid': '#FFD93D',     # Yellow
    'Flu': '#95E1D3',         # Mint
    'COVID-19': '#A8E6CF',    # Light Green
    'Cholera': '#FF8B94'      # Pink
}

OUTBREAK_THRESHOLD = 1.5  # 50% increase over 4-period average
SPIKE_COLOR = '#FF0000'   # Red dots for outbreaks


# ============================================================================
# DATA GENERATION
# ============================================================================

def generate_sample_data(weeks=12, diseases=None, cities=None):
    """
    Generate realistic sample healthcare data
    
    Args:
        weeks: Number of weeks of data
        diseases: List of diseases (default: ['Dengue', 'Malaria', 'Typhoid'])
        cities: List of cities (default: ['Mumbai', 'Pune', 'Nashik'])
    
    Returns:
        DataFrame with columns: disease, date, city, area, age_group
    """
    if diseases is None:
        diseases = ['Dengue', 'Malaria', 'Typhoid']
    
    if cities is None:
        cities = ['Mumbai', 'Pune', 'Nashik']
    
    areas = {
        'Mumbai': ['Kurla', 'Dadar', 'Andheri', 'Bandra'],
        'Pune': ['Kothrud', 'Hinjewadi', 'Shivaji Nagar', 'Koregaon Park'],
        'Nashik': ['Nehru Nagar', 'College Road', 'Gangapur Road']
    }
    
    age_groups = ['0-18', '19-45', '46-65', '65+']
    
    start_date = datetime.now() - timedelta(weeks=weeks)
    
    data = []
    
    for disease in diseases:
        # Base case count for this disease
        base_count = random.randint(5, 20)
        
        for day in range(weeks * 7):
            current_date = start_date + timedelta(days=day)
            
            # Create seasonal variation
            seasonal_factor = 1 + 0.3 * np.sin(day / 7)
            
            # Random spikes (outbreaks)
            spike_factor = 1.0
            if random.random() < 0.08:  # 8% chance of spike
                spike_factor = random.uniform(2.0, 3.5)
            
            # Weekend reduction
            weekend_factor = 0.7 if current_date.weekday() >= 5 else 1.0
            
            daily_cases = int(base_count * seasonal_factor * spike_factor * weekend_factor)
            
            # Generate individual case records
            for _ in range(daily_cases):
                city = random.choice(cities)
                
                data.append({
                    'disease': disease,
                    'date': current_date,
                    'city': city,
                    'area': random.choice(areas.get(city, ['Unknown'])),
                    'age_group': random.choice(age_groups)
                })
    
    df = pd.DataFrame(data)
    print(f"✓ Generated {len(df)} sample records")
    print(f"  - Date range: {df['date'].min().date()} to {df['date'].max().date()}")
    print(f"  - Diseases: {', '.join(diseases)}")
    print(f"  - Cities: {', '.join(cities)}")
    
    return df


# ============================================================================
# DATA AGGREGATION
# ============================================================================

def aggregate_by_period(df, period='W', city_filter=None):
    """
    Aggregate case counts by time period
    
    Args:
        df: Input DataFrame
        period: 'D' for daily, 'W' for weekly
        city_filter: Optional city name to filter by
    
    Returns:
        DataFrame with aggregated counts
    """
    # Apply city filter if specified
    if city_filter:
        df = df[df['city'] == city_filter].copy()
        print(f"✓ Filtered to city: {city_filter} ({len(df)} records)")
    
    # Aggregate by disease and date
    df['date'] = pd.to_datetime(df['date'])
    
    aggregated = df.groupby([
        pd.Grouper(key='date', freq=period),
        'disease'
    ]).size().reset_index(name='cases')
    
    period_name = 'week' if period == 'W' else 'day'
    print(f"✓ Aggregated by {period_name}: {len(aggregated)} data points")
    
    return aggregated


# ============================================================================
# OUTBREAK DETECTION
# ============================================================================

def detect_spikes(df, threshold=OUTBREAK_THRESHOLD, lookback=4):
    """
    Detect outbreak spikes using moving average
    
    Algorithm:
        - For each time period, calculate average of last N periods
        - If current > avg * threshold, mark as spike
    
    Args:
        df: Aggregated DataFrame (must have 'date', 'disease', 'cases')
        threshold: Multiplier for spike detection (e.g., 1.5 = 50% increase)
        lookback: Number of previous periods to average
    
    Returns:
        DataFrame with additional 'is_spike' and 'avg_baseline' columns
    """
    spikes_data = []
    
    for disease in df['disease'].unique():
        disease_df = df[df['disease'] == disease].sort_values('date').copy()
        
        disease_df['avg_baseline'] = disease_df['cases'].rolling(
            window=lookback, 
            min_periods=1
        ).mean().shift(1)
        
        disease_df['is_spike'] = (
            (disease_df['cases'] > disease_df['avg_baseline'] * threshold) &
            (disease_df['avg_baseline'].notna())
        )
        
        spikes_data.append(disease_df)
    
    result = pd.concat(spikes_data, ignore_index=True)
    
    spike_count = result['is_spike'].sum()
    print(f"✓ Detected {spike_count} potential outbreak spikes (threshold: {threshold}x)")
    
    return result


# ============================================================================
# VISUALIZATION
# ============================================================================

def create_trend_chart(df, title="Disease Trends Over Time", city=None):
    """
    Create interactive Plotly line chart with outbreak detection
    
    Args:
        df: Aggregated DataFrame with spike detection
        title: Chart title
        city: City name (for title)
    
    Returns:
        Plotly Figure object
    """
    if city:
        title = f"{title} - {city}"
    
    fig = go.Figure()
    
    # Add line for each disease
    for disease in df['disease'].unique():
        disease_df = df[df['disease'] == disease]
        
        color = DISEASE_COLORS.get(disease, '#808080')
        
        # Main trend line
        fig.add_trace(go.Scatter(
            x=disease_df['date'],
            y=disease_df['cases'],
            mode='lines+markers',
            name=disease,
            line=dict(color=color, width=2),
            marker=dict(size=6),
            hovertemplate=(
                f'<b>{disease}</b><br>' +
                'Date: %{x|%Y-%m-%d}<br>' +
                'Cases: %{y}<br>' +
                '<extra></extra>'
            )
        ))
        
        # Add spike markers
        spikes = disease_df[disease_df['is_spike'] == True]
        
        if len(spikes) > 0:
            fig.add_trace(go.Scatter(
                x=spikes['date'],
                y=spikes['cases'],
                mode='markers+text',
                name=f'{disease} - Outbreak Spikes',
                marker=dict(
                    color=SPIKE_COLOR,
                    size=12,
                    symbol='circle',
                    line=dict(color='white', width=2)
                ),
                text=['⚠️'] * len(spikes),
                textposition='top center',
                textfont=dict(size=14),
                hovertemplate=(
                    f'<b>⚠️ POSSIBLE OUTBREAK</b><br>' +
                    f'{disease}<br>' +
                    'Date: %{x|%Y-%m-%d}<br>' +
                    'Cases: %{y}<br>' +
                    'Baseline avg: %{customdata:.1f}<br>' +
                    '<extra></extra>'
                ),
                customdata=spikes['avg_baseline'],
                showlegend=True
            ))
    
    # Update layout
    fig.update_layout(
        title=dict(
            text=title,
            font=dict(size=20, color='#333')
        ),
        xaxis=dict(
            title='Date',
            showgrid=True,
            gridcolor='#E0E0E0'
        ),
        yaxis=dict(
            title='Number of Cases',
            showgrid=True,
            gridcolor='#E0E0E0'
        ),
        hovermode='x unified',
        plot_bgcolor='white',
        legend=dict(
            orientation='v',
            yanchor='top',
            y=1,
            xanchor='left',
            x=1.02,
            bgcolor='rgba(255,255,255,0.8)',
            bordercolor='#333',
            borderwidth=1
        ),
        height=600,
        margin=dict(r=200)
    )
    
    print(f"✓ Created interactive trend chart")
    return fig


# ============================================================================
# MAIN FUNCTION
# ============================================================================

def create_disease_trends(df=None, period='W', city=None, 
                          threshold=OUTBREAK_THRESHOLD, 
                          output_path='trend_dashboard.html'):
    """
    Main function to create disease trend visualization
    
    Args:
        df: Input DataFrame (if None, generates sample data)
        period: 'D' for daily, 'W' for weekly
        city: Optional city filter
        threshold: Outbreak detection threshold
        output_path: Path to save HTML file
    
    Returns:
        Path to generated HTML file
    """
    print("\n" + "="*70)
    print("  DISEASE TREND GRAPH GENERATOR")
    print("="*70)
    
    # Generate sample data if not provided
    if df is None:
        print("\n📊 No data provided - generating sample data...")
        df = generate_sample_data(weeks=12)
    
    print(f"\n🔄 Aggregating data by {'week' if period == 'W' else 'day'}...")
    aggregated = aggregate_by_period(df, period=period, city_filter=city)
    
    print("\n🔬 Detecting outbreak spikes...")
    with_spikes = detect_spikes(aggregated, threshold=threshold)
    
    print("\n📈 Creating visualization...")
    fig = create_trend_chart(with_spikes, city=city)
    
    print(f"\n💾 Saving to {output_path}...")
    fig.write_html(output_path)
    
    print("\n" + "="*70)
    print("✅ SUCCESS!")
    print("="*70)
    print(f"\n📁 File: {output_path}")
    print(f"🔍 Open in browser to view interactive chart")
    print(f"\n📊 Chart features:")
    print(f"   ✓ Multi-disease trend lines")
    print(f"   ✓ Hover for details")
    print(f"   ✓ Red dots = outbreak spikes (>{threshold}x baseline)")
    print(f"   ✓ Toggle diseases in legend")
    if city:
        print(f"   ✓ Filtered to: {city}")
    print()
    
    return output_path


# ============================================================================
# USAGE EXAMPLES
# ============================================================================

if __name__ == '__main__':
    # Example 1: Basic usage with default sample data
    print("📌 Example 1: All cities, weekly aggregation\n")
    create_disease_trends(
        period='W',
        output_path='trend_all_cities_weekly.html'
    )
    
    print("\n" + "="*70 + "\n")
    
    # Example 2: Filter by city
    print("📌 Example 2: Mumbai only, daily aggregation\n")
    df = generate_sample_data(weeks=8, diseases=['Dengue', 'Malaria', 'Flu'])
    create_disease_trends(
        df=df,
        period='D',
        city='Mumbai',
        output_path='trend_mumbai_daily.html'
    )
    
    print("\n" + "="*70 + "\n")
    print("🎉 Generated 2 example dashboards!")
    print("   1. trend_all_cities_weekly.html - All cities, weekly view")
    print("   2. trend_mumbai_daily.html - Mumbai only, daily view")
