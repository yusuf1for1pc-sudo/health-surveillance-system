"""
Aggregator Module
Aggregates disease cases by location and disease type
"""

import pandas as pd


def aggregate_cases(df, groupby_cols=['city', 'disease', 'latitude', 'longitude']):
    """
    Aggregate disease cases by specified columns
    
    Parameters:
    -----------
    df : pd.DataFrame
        DataFrame with disease data and coordinates
    groupby_cols : list
        Columns to group by (default: city, disease, lat, lon)
        
    Returns:
    --------
    pd.DataFrame
        Aggregated DataFrame with case counts
    """
    print("\n📊 Aggregating cases...")
    
    # Ensure required columns exist
    required = ['city', 'disease', 'latitude', 'longitude']
    missing = [col for col in required if col not in df.columns]
    
    if missing:
        raise ValueError(f"Missing required columns: {missing}")
    
    # Create aggregation
    agg_df = df.groupby(groupby_cols, dropna=False).size().reset_index(name='case_count')
    
    # Also aggregate by city only for total counts
    city_totals = df.groupby(['city', 'latitude', 'longitude']).size().reset_index(name='total_cases')
    
    print(f"  • Aggregated into {len(agg_df)} disease-location pairs")
    print(f"  • Total locations: {len(city_totals)}")
    
    # Add some useful summary info
    print(f"  • Total cases: {agg_df['case_count'].sum()}")
    print(f"  • Top disease: {agg_df.groupby('disease')['case_count'].sum().idxmax()}")
    print(f"  • Top city: {city_totals.loc[city_totals['total_cases'].idxmax(), 'city']}")
    
    print(f"✓ Aggregation complete")
    
    return agg_df, city_totals


def get_disease_summary(df):
    """
    Get summary statistics for diseases
    
    Parameters:
    -----------
    df : pd.DataFrame
        Aggregated DataFrame
        
    Returns:
    --------
    pd.DataFrame
        Summary by disease
    """
    disease_summary = df.groupby('disease').agg({
        'case_count': ['sum', 'mean', 'max'],
        'city': 'count'
    }).round(2)
    
    disease_summary.columns = ['Total Cases', 'Avg per Location', 'Max in One Location', 'Locations Affected']
    
    return disease_summary.sort_values('Total Cases', ascending=False)


def get_city_summary(df):
    """
    Get summary statistics for cities
    
    Parameters:
    -----------
    df : pd.DataFrame
        Aggregated DataFrame
        
    Returns:
    --------
    pd.DataFrame
        Summary by city
    """
    city_summary = df.groupby('city').agg({
        'case_count': 'sum',
        'disease': 'nunique'
    }).round(2)
    
    city_summary.columns = ['Total Cases', 'Diseases']
    
    return city_summary.sort_values('Total Cases', ascending=False)
