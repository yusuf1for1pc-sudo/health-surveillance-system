"""
Geocoder Module
Maps city names to latitude/longitude coordinates
"""

import pandas as pd
import json
import os
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
import time


def load_city_mapping(mapping_file='data/indian_cities.json'):
    """
    Load pre-mapped city coordinates from JSON file
    
    Parameters:
    -----------
    mapping_file : str
        Path to city mapping JSON file
        
    Returns:
    --------
    dict
        Dictionary mapping city names to [lat, lon]
    """
    try:
        with open(mapping_file, 'r') as f:
            city_coords = json.load(f)
        print(f"✓ Loaded {len(city_coords)} pre-mapped cities")
        return city_coords
    except FileNotFoundError:
        print(f"⚠ City mapping file not found: {mapping_file}")
        return {}


def geocode_city(city, state=None, country='India', user_agent='disease_heatmap_app'):
    """
    Geocode a single city using Nominatim (free service)
    
    Parameters:
    -----------
    city : str
        City name
    state : str, optional
        State name for better accuracy
    country : str
        Country name (default: India)
    user_agent : str
        User agent for Nominatim API
        
    Returns:
    --------
    tuple or None
        (latitude, longitude) or None if not found
    """
    try:
        geolocator = Nominatim(user_agent=user_agent, timeout=10)
        
        # Build query string
        query = f"{city}"
        if state:
            query += f", {state}"
        query += f", {country}"
        
        # Add delay to respect rate limits (1 request per second for Nominatim)
        time.sleep(1)
        
        location = geolocator.geocode(query)
        
        if location:
            return (location.latitude, location.longitude)
        else:
            print(f"  ⚠ Could not geocode: {city}")
            return None
            
    except (GeocoderTimedOut, GeocoderServiceError) as e:
        print(f"  ⚠ Geocoding error for {city}: {str(e)}")
        return None


def map_city_to_coords(df, mapping_file='data/indian_cities.json', use_geocoding=True):
    """
    Add latitude and longitude columns to DataFrame
    
    Parameters:
    -----------
    df : pd.DataFrame
        DataFrame with 'city' column
    mapping_file : str
        Path to pre-mapped city coordinates
    use_geocoding : bool
        If True, use Nominatim for cities not in mapping file
        
    Returns:
    --------
    pd.DataFrame
        DataFrame with 'latitude' and 'longitude' columns added
    """
    print("\n🌍 Geocoding cities...")
    
    df_geo = df.copy()
    
    # Load pre-mapped coordinates
    city_coords = load_city_mapping(mapping_file)
    
    # Track geocoding stats
    mapped_count = 0
    geocoded_count = 0
    failed_count = 0
    
    # Add coordinates for each row
    for idx, row in df_geo.iterrows():
        city = row['city']
        
        # Skip if coordinates already exist
        if pd.notna(row.get('latitude')) and pd.notna(row.get('longitude')):
            continue
        
        # Try pre-mapped coordinates first
        if city in city_coords:
            df_geo.at[idx, 'latitude'] = city_coords[city][0]
            df_geo.at[idx, 'longitude'] = city_coords[city][1]
            mapped_count += 1
        
        # Fallback to Nominatim geocoding
        elif use_geocoding:
            state = row.get('state', None)
            coords = geocode_city(city, state)
            
            if coords:
                df_geo.at[idx, 'latitude'] = coords[0]
                df_geo.at[idx, 'longitude'] = coords[1]
                geocoded_count += 1
                
                # Cache the result
                city_coords[city] = list(coords)
            else:
                failed_count += 1
        else:
            failed_count += 1
    
    # Save updated cache
    if geocoded_count > 0:
        try:
            os.makedirs(os.path.dirname(mapping_file), exist_ok=True)
            with open(mapping_file, 'w') as f:
                json.dump(city_coords, f, indent=2)
            print(f"  • Saved {geocoded_count} new coordinates to cache")
        except Exception as e:
            print(f"  ⚠ Could not save cache: {str(e)}")
    
    # Report results
    print(f"  • Pre-mapped: {mapped_count} cities")
    if geocoded_count > 0:
        print(f"  • Geocoded: {geocoded_count} cities")
    if failed_count > 0:
        print(f"  ⚠ Failed: {failed_count} cities")
    
    # Remove rows with missing coordinates
    before = len(df_geo)
    df_geo = df_geo.dropna(subset=['latitude', 'longitude'])
    dropped = before - len(df_geo)
    if dropped > 0:
        print(f"  • Removed {dropped} records with missing coordinates")
    
    print(f"✓ Geocoding complete: {len(df_geo)} records with coordinates")
    
    return df_geo
