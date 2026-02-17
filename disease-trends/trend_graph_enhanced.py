#!/usr/bin/env python3
"""
Disease Trend Graph Visualization - ENHANCED
=============================================

Interactive time-series visualization with:
- Weekly/Monthly toggle (no rebuild)
- % change vs previous period
- Moving average overlay
- Enhanced spike detection
- Modern glassmorphic styling

Dependencies: pip install pandas plotly numpy
"""

import pandas as pd
import numpy as np
import plotly.graph_objects as go
from datetime import datetime, timedelta
import random


# ============================================================================
# CONFIGURATION
# ============================================================================

DISEASE_COLORS = {
    'Dengue': '#FF6B6B',
    'Malaria': '#4ECDC4',
    'Typhoid': '#FFD93D',
    'Flu': '#95E1D3',
    'COVID-19': '#A8E6CF',
    'Cholera': '#FF8B94'
}

OUTBREAK_THRESHOLD = 1.5
SPIKE_COLOR = '#FF0000'
MA_WINDOW = 4  # Moving average window


# ============================================================================
# DATA GENERATION
# ============================================================================

def generate_sample_data(weeks=16, diseases=None, cities=None):
    """Generate sample data with realistic patterns"""
    if diseases is None:
        diseases = ['Dengue', 'Malaria', 'Typhoid']
    if cities is None:
        cities = ['Mumbai', 'Pune', 'Nashik']
    
    areas = {
        'Mumbai': ['Kurla', 'Dadar', 'Andheri', 'Bandra'],
        'Pune': ['Kothrud', 'Hinjewadi', 'Shivaji Nagar'],
        'Nashik': ['Nehru Nagar', 'College Road']
    }
    
    age_groups = ['0-18', '19-45', '46-65', '65+']
    start_date = datetime.now() - timedelta(weeks=weeks)
    data = []
    
    for disease in diseases:
        base_count = random.randint(8, 25)
        
        for day in range(weeks * 7):
            current_date = start_date + timedelta(days=day)
            seasonal_factor = 1 + 0.4 * np.sin(day / 7)
            spike_factor = random.uniform(2.5, 4.0) if random.random() < 0.08 else 1.0
            weekend_factor = 0.6 if current_date.weekday() >= 5 else 1.0
            
            daily_cases = int(base_count * seasonal_factor * spike_factor * weekend_factor)
            
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
    print(f"✓ Generated {len(df)} records ({df['date'].min().date()} to {df['date'].max().date()})")
    return df


# ============================================================================
# ENHANCED AGGREGATION WITH ANALYTICS
# ============================================================================

def aggregate_with_analytics(df, city_filter=None):
    """
    Aggregate data for BOTH weekly and monthly periods with analytics
    Returns dict with both aggregations and analytics
    """
    if city_filter:
        df = df[df['city'] == city_filter].copy()
        print(f"✓ Filtered to {city_filter}: {len(df)} records")
    
    df['date'] = pd.to_datetime(df['date'])
    
    results = {}
    
    # Process both periods
    for period_key, period_code in [('weekly', 'W'), ('monthly', 'M')]:
        agg = df.groupby([
            pd.Grouper(key='date', freq=period_code),
            'disease'
        ]).size().reset_index(name='cases')
        
        # Add analytics for each disease
        analytics_data = []
        for disease in agg['disease'].unique():
            disease_df = agg[agg['disease'] == disease].sort_values('date').copy()
            
            # 1. Moving Average (3-4 periods)
            disease_df['moving_avg'] = disease_df['cases'].rolling(window=MA_WINDOW, min_periods=1).mean()
            
            # 2. % Change vs Previous Period (rounded to 3 decimals)
            disease_df['pct_change'] = disease_df['cases'].pct_change() * 100
            disease_df['pct_change'] = disease_df['pct_change'].fillna(0).round(3)
            
            # 3. Baseline for spike detection
            disease_df['baseline'] = disease_df['cases'].rolling(window=MA_WINDOW, min_periods=1).mean().shift(1)
            
            # 4. Enhanced spike detection
            disease_df['is_spike'] = (
                (disease_df['cases'] > disease_df['baseline'] * OUTBREAK_THRESHOLD) &
                (disease_df['baseline'].notna())
            )
            
            analytics_data.append(disease_df)
        
        results[period_key] = pd.concat(analytics_data, ignore_index=True)
        print(f"✓ {period_key.capitalize()}: {len(results[period_key])} points with analytics")
    
    return results


# ============================================================================
# ENHANCED VISUALIZATION WITH MODERN STYLING
# ============================================================================

def create_enhanced_chart(data_dict, title="Disease Trends Dashboard", city=None):
    """
    Create enhanced interactive chart with:
    - Weekly/Monthly toggle
    - Moving average lines
    - % change display
    - Enhanced spike markers
    - Glassmorphic styling
    """
    if city:
        title = f"{title} - {city}"
    
    fig = go.Figure()
    
    # Track trace indices properly for visibility toggling
    weekly_trace_indices = []
    monthly_trace_indices = []
    
    # Create traces for BOTH weekly and monthly
    for period_idx, (period_name, period_data) in enumerate([('Weekly', data_dict['weekly']), ('Monthly', data_dict['monthly'])]):
        trace_list = weekly_trace_indices if period_idx == 0 else monthly_trace_indices
        
        for disease in period_data['disease'].unique():
            disease_df = period_data[period_data['disease'] == disease].copy()
            color = DISEASE_COLORS.get(disease, '#808080')
            
            hovertemplate = (
                f'<b>{disease}</b><br>' +
                'Cases: %{y}<br>' +
                '<span style="color:%{customdata[1]}">%{customdata[0]:+.3f}% %{customdata[2]}</span><br>' +
                '<extra></extra>'
            )
            
            # Create custom data with trend info (high contrast colors)
            customdata = np.column_stack([
                disease_df['pct_change'],
                ['#00AA00' if x < 0 else '#CC0000' for x in disease_df['pct_change']],
                ['↓' if x < 0 else '↑' for x in disease_df['pct_change']]
            ])
            
            # 1. Main trend line
            trace_list.append(len(fig.data))
            fig.add_trace(go.Scatter(
                x=disease_df['date'],
                y=disease_df['cases'],
                mode='lines+markers',
                name=f'{disease} ({period_name})',
                line=dict(color=color, width=3.5),
                marker=dict(size=7, line=dict(width=1, color='white')),
                visible=(period_idx == 0),  # Show weekly by default
                hovertemplate=hovertemplate,
                customdata=customdata
            ))
            
            # 2. Moving average line
            trace_list.append(len(fig.data))
            fig.add_trace(go.Scatter(
                x=disease_df['date'],
                y=disease_df['moving_avg'],
                mode='lines',
                name=f'{disease} MA ({period_name})',
                line=dict(color=color, width=2, dash='dot'),
                opacity=0.6,
                visible=(period_idx == 0),
                hovertemplate=(
                    f'<b>{disease}</b> (MA)<br>' +
                    '%{y:.0f} cases<br>' +
                    '<extra></extra>'
                )
            ))
            
            # 3. Spike markers (only if spikes exist)
            spikes = disease_df[disease_df['is_spike'] == True]
            if len(spikes) > 0:
                spike_customdata = np.column_stack([
                    spikes['pct_change'],
                    ['#CC0000'] * len(spikes),
                    ['↑'] * len(spikes)
                ])
                
                trace_list.append(len(fig.data))
                fig.add_trace(go.Scatter(
                    x=spikes['date'],
                    y=spikes['cases'],
                    mode='markers',
                    name=f'{disease} Spikes ({period_name})',
                    marker=dict(
                        color=SPIKE_COLOR,
                        size=9,
                        symbol='circle',
                        line=dict(color='white', width=1.5)
                    ),
                    visible=(period_idx == 0),
                    hovertemplate=(
                        f'<b>{disease}</b> ⚠️ OUTBREAK<br>' +
                        'Cases: %{y}<br>' +
                        '<span style="color:#CC0000">+%{customdata[0]:.3f}% ↑ Cases Rising</span><br>' +
                        '<extra></extra>'
                    ),
                    customdata=spike_customdata,
                    showlegend=False
                ))
    
    # Create visibility arrays for toggle buttons
    def create_visibility_array(show_weekly):
        """Create boolean array for trace visibility"""
        visibility = [False] * len(fig.data)
        indices = weekly_trace_indices if show_weekly else monthly_trace_indices
        for idx in indices:
            visibility[idx] = True
        return visibility
    
    # Toggle buttons
    updatemenus = [
        dict(
            type="buttons",
            direction="left",
            x=0.12,
            y=1.15,
            buttons=[
                dict(
                    label="📊 Weekly",
                    method="update",
                    args=[
                        {"visible": create_visibility_array(True)},
                        {"title.text": f"<b>{title} - Weekly View</b>"}
                    ]
                ),
                dict(
                    label="📅 Monthly",
                    method="update",
                    args=[
                        {"visible": create_visibility_array(False)},
                        {"title.text": f"<b>{title} - Monthly View</b>"}
                    ]
                )
            ],
            bgcolor="rgba(255, 255, 255, 0.2)",
            bordercolor="rgba(255, 255, 255, 0.5)",
            borderwidth=2,
            font=dict(size=14, color='#333'),
            pad=dict(t=10, b=10, l=10, r=10),
        )
    ]
    
    # Glassmorphic + Modern Layout
    fig.update_layout(
        title=dict(
            text=f"<b>{title} - Weekly View</b>",
            font=dict(size=24, color='#1a1a1a', family='Arial Black'),
            x=0.5,
            xanchor='center'
        ),
        xaxis=dict(
            title='<b>Timeline</b>',
            showgrid=True,
            gridcolor='rgba(200, 200, 200, 0.3)',
            gridwidth=1,
            zeroline=False,
            title_font=dict(size=14, color='#555')
        ),
        yaxis=dict(
            title='<b>Number of Cases</b>',
            showgrid=True,
            gridcolor='rgba(200, 200, 200, 0.3)',
            gridwidth=1,
            zeroline=False,
            title_font=dict(size=14, color='#555')
        ),
        updatemenus=updatemenus,
        hovermode='x unified',
        
        # Glassmorphic styling
        plot_bgcolor='rgba(240, 248, 255, 0.4)',
        paper_bgcolor='#F0F4F8',
        
        # Enhanced legend
        legend=dict(
            orientation='v',
            yanchor='top',
            y=0.98,
            xanchor='left',
            x=1.02,
            bgcolor='rgba(255, 255, 255, 0.15)',
            bordercolor='rgba(255, 255, 255, 0.3)',
            borderwidth=2,
            font=dict(size=11, color='#333')
        ),
        
        height=700,
        margin=dict(t=120, r=250, b=80, l=80),
        
        hoverlabel=dict(
            bgcolor="rgba(255, 255, 255, 0.9)",
            font_size=12,
            font_family="Arial",
            bordercolor="rgba(0,0,0,0.1)"
        )
    )
    
    # Spike counter annotation (moved to right side to avoid overlap)
    spike_count_weekly = data_dict['weekly']['is_spike'].sum()
    
    fig.add_annotation(
        text=f"🏆 {spike_count_weekly} Spikes",
        xref="paper", yref="paper",
        x=0.98, y=1.12,  # Moved to top-right
        xanchor='right',
        showarrow=False,
        font=dict(size=13, color='#FF6B6B', family='Arial Black'),
        bgcolor='rgba(255, 255, 255, 0.8)',
        bordercolor='#FF6B6B',
        borderwidth=2,
        borderpad=8
    )
    
    print(f"✓ Chart created: {len(weekly_trace_indices)} weekly traces, {len(monthly_trace_indices)} monthly traces")
    return fig



# ============================================================================
# MAIN FUNCTION
# ============================================================================

def create_enhanced_trends(df=None, city=None, output_path='enhanced_dashboard_v2.html'):
    """
    Create enhanced disease trend visualization
    
    Features:
    - Weekly/Monthly toggle (no rebuild)
    - % change calculations
    - Moving average overlay
    - Enhanced spike detection
    - Modern glassmorphic styling
    """
    print("\n" + "="*70)
    print("  ENHANCED DISEASE TREND DASHBOARD")
    print("="*70)
    
    if df is None:
        print("\n📊 Generating sample data...")
        df = generate_sample_data(weeks=16)
    
    print("\n🔄 Aggregating with analytics (weekly + monthly)...")
    data_dict = aggregate_with_analytics(df, city_filter=city)
    
    weekly_spikes = data_dict['weekly']['is_spike'].sum()
    monthly_spikes = data_dict['monthly']['is_spike'].sum()
    
    print(f"   - Weekly spikes: {weekly_spikes}")
    print(f"   - Monthly spikes: {monthly_spikes}")
    
    print("\n📈 Creating enhanced visualization...")
    fig = create_enhanced_chart(data_dict, city=city)
    
    print(f"\n💾 Saving to {output_path}...")
    fig.write_html(output_path)
    
    print("\n" + "="*70)
    print("✅ ENHANCED DASHBOARD COMPLETE!")
    print("="*70)
    print(f"\n📁 File: {output_path}")
    print(f"\n✨ NEW FEATURES:")
    print(f"   ✓ Weekly/Monthly toggle (click buttons)")
    print(f"   ✓ % change vs previous period (hover)")
    print(f"   ✓ Moving average line ({MA_WINDOW}-period, dashed)")
    print(f"   ✓ Enhanced spike markers (star ⚠️)")
    print(f"   ✓ Glassmorphic modern UI")
    print(f"   ✓ Gamified elements (spike counter)")
    if city:
        print(f"   ✓ Filtered to: {city}")
    print()
    
    return output_path


# ============================================================================
# USAGE EXAMPLES
# ============================================================================

if __name__ == '__main__':
    # Enhanced dashboard
    print("📌 Creating Enhanced Disease Trend Dashboard\n")
    create_enhanced_trends(
        output_path='enhanced_trend_dashboard.html'
    )
    
    print("\n" + "="*70 + "\n")
    print("🎉 Dashboard Features:")
    print("  📊 Click 'Weekly' or 'Monthly' to toggle views")
    print("  📈 Hover over points to see % change")
    print("  📉 Dashed lines show moving averages")
    print("  ⚠️  Star markers indicate outbreak spikes")
    print("  🎨 Modern glassmorphic design")
