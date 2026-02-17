"""
Data Loader Module
Handles loading data from CSV or JSON files
"""

import pandas as pd
import json


def load_data(filepath, format='csv'):
    """
    Load disease data from CSV or JSON file
    
    Parameters:
    -----------
    filepath : str
        Path to the data file
    format : str
        File format - 'csv' or 'json'
        
    Returns:
    --------
    pd.DataFrame
        Loaded data as pandas DataFrame
    """
    try:
        if format.lower() == 'csv':
            df = pd.read_csv(filepath)
            print(f"✓ Loaded {len(df)} records from CSV file: {filepath}")
        elif format.lower() == 'json':
            df = pd.read_json(filepath)
            print(f"✓ Loaded {len(df)} records from JSON file: {filepath}")
        else:
            raise ValueError(f"Unsupported format: {format}. Use 'csv' or 'json'")
        
        return df
    
    except FileNotFoundError:
        print(f"✗ Error: File not found - {filepath}")
        raise
    except Exception as e:
        print(f"✗ Error loading data: {str(e)}")
        raise


def load_dataframe(df):
    """
    Validate and return a pandas DataFrame
    Useful when data is already loaded programmatically
    
    Parameters:
    -----------
    df : pd.DataFrame
        Input DataFrame
        
    Returns:
    --------
    pd.DataFrame
        Validated DataFrame
    """
    if not isinstance(df, pd.DataFrame):
        raise TypeError("Input must be a pandas DataFrame")
    
    print(f"✓ DataFrame validated with {len(df)} records")
    return df
