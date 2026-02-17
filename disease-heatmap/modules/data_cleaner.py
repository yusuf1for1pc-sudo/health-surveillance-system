"""
Data Cleaner Module
Handles data validation, cleaning, and standardization
"""

import pandas as pd
import re


def clean_data(df):
    """
    Clean and validate disease data
    
    Parameters:
    -----------
    df : pd.DataFrame
        Raw data DataFrame
        
    Returns:
    --------
    pd.DataFrame
        Cleaned DataFrame
    """
    print("\n🧹 Cleaning data...")
    
    # Create a copy to avoid modifying original
    df_clean = df.copy()
    
    # Track cleaning stats
    original_count = len(df_clean)
    
    # 1. Remove duplicates
    df_clean = df_clean.drop_duplicates()
    duplicates_removed = original_count - len(df_clean)
    if duplicates_removed > 0:
        print(f"  • Removed {duplicates_removed} duplicate records")
    
    # 2. Handle missing values in critical columns
    required_columns = ['disease', 'city']
    for col in required_columns:
        if col in df_clean.columns:
            before = len(df_clean)
            df_clean = df_clean.dropna(subset=[col])
            dropped = before - len(df_clean)
            if dropped > 0:
                print(f"  • Removed {dropped} records with missing {col}")
    
    # 3. Standardize city names (capitalize first letter of each word)
    if 'city' in df_clean.columns:
        df_clean['city'] = df_clean['city'].str.title().str.strip()
        print(f"  • Standardized city names")
    
    # 4. Standardize state names
    if 'state' in df_clean.columns:
        df_clean['state'] = df_clean['state'].str.title().str.strip()
        print(f"  • Standardized state names")
    
    # 5. Standardize disease names
    if 'disease' in df_clean.columns:
        df_clean['disease'] = df_clean['disease'].str.title().str.strip()
        print(f"  • Standardized disease names")
    
    # 6. Convert date column to datetime if present
    if 'date' in df_clean.columns:
        try:
            df_clean['date'] = pd.to_datetime(df_clean['date'])
            print(f"  • Converted date column to datetime format")
        except Exception as e:
            print(f"  ⚠ Warning: Could not convert date column - {str(e)}")
    
    # 7. Fill missing latitude/longitude with NaN (will be geocoded later)
    for col in ['latitude', 'longitude']:
        if col not in df_clean.columns:
            df_clean[col] = None
    
    print(f"✓ Cleaning complete: {len(df_clean)} clean records (from {original_count} original)")
    
    return df_clean


def validate_data(df):
    """
    Validate that DataFrame has required columns
    
    Parameters:
    -----------
    df : pd.DataFrame
        DataFrame to validate
        
    Returns:
    --------
    bool
        True if valid, raises exception otherwise
    """
    required_cols = ['disease', 'city']
    missing_cols = [col for col in required_cols if col not in df.columns]
    
    if missing_cols:
        raise ValueError(f"Missing required columns: {missing_cols}")
    
    if len(df) == 0:
        raise ValueError("DataFrame is empty")
    
    print(f"✓ Data validation passed")
    return True
