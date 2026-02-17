#!/usr/bin/env python3
"""
Disease Heatmap - ROOT CAUSE FIXES
==================================

Fixes implemented:
1. Proper bounds fitting using fit_bounds() with bounding box
2. Structured location data: locality, city, state (not concatenated strings)
3. High-contrast color palette for visibility
4. Clean location hierarchy in popups

Dependencies: pip install pandas folium
"""

import pandas as pd
import folium
from folium.plugins import HeatMap


# ============================================================================
# CONFIGURATION - HIGH CONTRAST COLORS
# ============================================================================

# HIGH-CONTRAST gradient for dark basemap visibility
SEVERITY_GRADIENT = {
    0.0: '#00ff00',    # Bright green (low)
    0.3: '#7fff00',    # Spring green
    0.5: '#ffd400',    # Bright yellow (medium) - HIGH CONTRAST
    0.7: '#ff8c00',    # Dark orange (high)
    0.85: '#ff4500',   # Orange red
    1.0: '#ff0000'     # Pure red (critical)
}

# Marker color thresholds - HIGH CONTRAST COLORS
CASE_THRESHOLDS = {
    'low': (0, 5, '#00ff00', 'Low Risk'),        # Bright green
    'medium': (5, 10, '#ffd400', 'Medium Risk'), # Bright yellow
    'high': (10, 20, '#ff8c00', 'High Risk'),    # Dark orange
    'critical': (20, 9999, '#ff0000', 'Critical') # Pure red
}

# Heatmap parameters
HEATMAP_CONFIG = {
    'radius': 30,
    'blur': 15,
    'min_opacity': 0.6,  # Increased for better visibility
    'max_zoom': 13,
    'gradient': SEVERITY_GRADIENT
}


# ============================================================================
# CORE LOGIC - PROPER IMPLEMENTATION
# ============================================================================

def validate_structured_data(df):
    """
    Validate DataFrame has STRUCTURED location fields
    
    Required columns:
    - latitude, longitude: coordinates
    - locality: specific area/neighborhood (e.g., "Kurla", "Nehru Nagar")
    - city: city name (e.g., "Mumbai", "Nashik")
    - state: state name (e.g., "Maharashtra")
    - cases: number of cases
    - disease_type: type of disease
    
    Args:
        df (pd.DataFrame): Input data
        
    Returns:
        pd.DataFrame: Validated and cleaned data
    """
    required = ['latitude', 'longitude', 'locality', 'city', 'state', 'cases', 'disease_type']
    missing = [col for col in required if col not in df.columns]
    
    if missing:
        raise ValueError(f"Missing required columns: {missing}\n"
                        f"Required: {required}")
    
    # Clean data
    df = df.dropna(subset=required)
    
    # Ensure numeric types
    df['latitude'] = pd.to_numeric(df['latitude'], errors='coerce')
    df['longitude'] = pd.to_numeric(df['longitude'], errors='coerce')
    df['cases'] = pd.to_numeric(df['cases'], errors='coerce')
    
    # Remove invalid rows
    df = df.dropna()
    
    # Standardize text fields
    df['locality'] = df['locality'].str.strip()
    df['city'] = df['city'].str.strip()
    df['state'] = df['state'].str.strip()
    df['disease_type'] = df['disease_type'].str.strip()
    
    print(f"✓ Validated {len(df)} records with structured location data")
    return df


def calculate_bounds(df):
    """
    Calculate PROPER bounding box for all points
    
    Args:
        df (pd.DataFrame): Data with latitude, longitude
        
    Returns:
        list: [[south, west], [north, east]] - bounds for fit_bounds()
    """
    min_lat = df['latitude'].min()
    max_lat = df['latitude'].max()
    min_lon = df['longitude'].min()
    max_lon = df['longitude'].max()
    
    # Add padding (5% on each side)
    lat_range = max_lat - min_lat
    lon_range = max_lon - min_lon
    padding_lat = lat_range * 0.05
    padding_lon = lon_range * 0.05
    
    bounds = [
        [min_lat - padding_lat, min_lon - padding_lon],  # Southwest
        [max_lat + padding_lat, max_lon + padding_lon]   # Northeast
    ]
    
    print(f"✓ Calculated bounds: SW={bounds[0]}, NE={bounds[1]}")
    return bounds


def get_severity_color(case_count):
    """
    Get HIGH-CONTRAST color based on case count
    
    Args:
        case_count (int): Number of cases
        
    Returns:
        tuple: (hex_color, severity_label)
    """
    for _, (min_val, max_val, color, label) in CASE_THRESHOLDS.items():
        if min_val <= case_count < max_val:
            return color, label
    return '#808080', 'Unknown'


def create_base_map():
    """
    Create base map - will be auto-fitted to bounds later
    
    Returns:
        folium.Map: Base map (initial position doesn't matter - will be fitted)
    """
    # Initial position doesn't matter - fit_bounds() will override
    m = folium.Map(
        location=[20.0, 77.0],  # Temporary center
        zoom_start=5,           # Temporary zoom
        tiles='OpenStreetMap',  # Light theme
        attr='OpenStreetMap'
    )
    
    print("✓ Created light basemap (will auto-fit to data)")
    return m


def add_heatmap(map_obj, df):
    """
    Add weighted heatmap with HIGH-CONTRAST gradient
    
    Args:
        map_obj (folium.Map): Base map
        df (pd.DataFrame): Data with coordinates and cases
        
    Returns:
        folium.Map: Map with heatmap
    """
    # Prepare weighted heat data
    heat_data = df[['latitude', 'longitude', 'cases']].values.tolist()
    
    HeatMap(
        heat_data,
        name='Disease Severity Heatmap',
        **HEATMAP_CONFIG
    ).add_to(map_obj)
    
    print(f"✓ Added high-contrast heatmap ({len(heat_data)} points)")
    return map_obj


def add_structured_markers(map_obj, df):
    """
    Add markers with STRUCTURED location hierarchy
    
    Popup shows:
    - Locality (PRIMARY - the outbreak area)
    - City (secondary context)
    - State
    - Disease type
    - Case count
    - Risk level
    
    Args:
        map_obj (folium.Map): Base map
        df (pd.DataFrame): Structured data
        
    Returns:
        folium.Map: Map with markers
    """
    marker_layer = folium.FeatureGroup(name='Disease Markers')
    
    for idx, row in df.iterrows():
        lat = row['latitude']
        lon = row['longitude']
        locality = row['locality']
        city = row['city']
        state = row['state']
        disease = row['disease_type']
        cases = int(row['cases'])
        
        # Get high-contrast color
        color, severity = get_severity_color(cases)
        
        # STRUCTURED popup - clear location hierarchy
        popup_html = f"""
        <div style="font-family: Arial, sans-serif; min-width: 220px; padding: 10px;">
            <div style="background: {color}; color: white; padding: 8px; margin: -10px -10px 10px -10px; border-radius: 3px 3px 0 0;">
                <h3 style="margin: 0; font-size: 16px;">📍 {locality}</h3>
            </div>
            
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                <tr style="background-color: #f5f5f5;">
                    <td style="padding: 6px; font-weight: bold; width: 40%;">Location:</td>
                    <td style="padding: 6px;">
                        <b>{locality}</b><br>
                        <span style="color: #666; font-size: 11px;">{city}, {state}</span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 6px; font-weight: bold;">Disease:</td>
                    <td style="padding: 6px;"><b>{disease}</b></td>
                </tr>
                <tr style="background-color: #f5f5f5;">
                    <td style="padding: 6px; font-weight: bold;">Cases:</td>
                    <td style="padding: 6px;"><b style="font-size: 16px; color: {color};">{cases}</b></td>
                </tr>
                <tr>
                    <td style="padding: 6px; font-weight: bold;">Risk Level:</td>
                    <td style="padding: 6px;">
                        <span style="background: {color}; color: white; padding: 3px 8px; border-radius: 3px; font-weight: bold;">
                            {severity}
                        </span>
                    </td>
                </tr>
            </table>
        </div>
        """
        
        # Tooltip shows full hierarchy
        tooltip = f"{locality}, {city} | {cases} {disease} cases | {severity}"
        
        # Circle marker with high-contrast color
        folium.CircleMarker(
            location=[lat, lon],
            radius=8,
            popup=folium.Popup(popup_html, max_width=300),
            tooltip=tooltip,
            color=color,
            fill=True,
            fillColor=color,
            fillOpacity=0.8,
            weight=3
        ).add_to(marker_layer)
    
    marker_layer.add_to(map_obj)
    
    print(f"✓ Added {len(df)} high-contrast markers with location hierarchy")
    return map_obj


def apply_bounds_fit(map_obj, bounds):
    """
    Apply PROPER bounds fitting - this is the correct way to auto-fit
    
    Args:
        map_obj (folium.Map): Map object
        bounds (list): [[south, west], [north, east]]
        
    Returns:
        folium.Map: Map with bounds fitted
    """
    map_obj.fit_bounds(bounds)
    
    print(f"✓ Applied fit_bounds() - map will auto-fit to all data points")
    return map_obj


def add_legend(map_obj):
    """
    Add legend with HIGH-CONTRAST color indicators
    
    Args:
        map_obj (folium.Map): Map object
        
    Returns:
        folium.Map: Map with legend
    """
    legend_html = '''
    <div style="position: fixed; 
                bottom: 50px; left: 50px; width: 240px; 
                background-color: white; 
                border: 2px solid #333; 
                border-radius: 8px;
                z-index: 9999; 
                padding: 15px;
                color: #333;
                font-family: Arial, sans-serif;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
        
        <h4 style="margin: 0 0 12px 0; 
                   color: #333; 
                   border-bottom: 2px solid #ff6b6b; 
                   padding-bottom: 8px;
                   font-size: 15px;">
            🗺️ Disease Outbreak Map
        </h4>
        
        <div style="margin-bottom: 12px; 
                    background: #e3f2fd; 
                    padding: 8px; 
                    border-radius: 5px;">
            <p style="margin: 0; font-size: 11px; font-weight: bold; color: #1976d2;">
                💡 Map auto-fits to all outbreak zones
            </p>
            <p style="margin: 3px 0 0 0; font-size: 10px; color: #555;">
                Click markers for detailed location info
            </p>
        </div>
        
        <h5 style="margin: 5px 0 8px 0; 
                   font-size: 12px; 
                   color: #d32f2f;">
            Risk Levels (High-Contrast):
        </h5>
        
        <div style="font-size: 11px;">
            <div style="display: flex; align-items: center; margin: 5px 0;">
                <div style="width: 18px; height: 18px; 
                           background: #00ff00; 
                           border: 2px solid #333; 
                           border-radius: 3px; 
                           margin-right: 10px;"></div>
                <span>Low (0-5 cases)</span>
            </div>
            
            <div style="display: flex; align-items: center; margin: 5px 0;">
                <div style="width: 18px; height: 18px; 
                           background: #ffd400; 
                           border: 2px solid #333; 
                           border-radius: 3px; 
                           margin-right: 10px;"></div>
                <span>Medium (5-10)</span>
            </div>
            
            <div style="display: flex; align-items: center; margin: 5px 0;">
                <div style="width: 18px; height: 18px; 
                           background: #ff8c00; 
                           border: 2px solid #333; 
                           border-radius: 3px; 
                           margin-right: 10px;"></div>
                <span>High (10-20)</span>
            </div>
            
            <div style="display: flex; align-items: center; margin: 5px 0;">
                <div style="width: 18px; height: 18px; 
                           background: #ff0000; 
                           border: 2px solid #333; 
                           border-radius: 3px; 
                           margin-right: 10px;"></div>
                <span>Critical (20+)</span>
            </div>
        </div>
        
        <div style="margin-top: 12px; 
                    padding-top: 10px; 
                    border-top: 1px solid #ddd; 
                    font-size: 9px; 
                    color: #666;">
            🔥 Heat intensity = case density
        </div>
    </div>
    '''
    
    map_obj.get_root().html.add_child(folium.Element(legend_html))
    
    print("✓ Added high-contrast legend")
    return map_obj


def create_disease_heatmap(df, output_path='disease_heatmap_fixed.html'):
    """
    MAIN FUNCTION - Generate heatmap with ROOT CAUSE FIXES
    
    Fixes implemented:
    1. ✓ Proper bounds fitting using fit_bounds()
    2. ✓ Structured location data (locality, city, state)
    3. ✓ High-contrast colors for visibility
    4. ✓ Clean location hierarchy display
    
    Args:
        df (pd.DataFrame): Data with columns:
            - locality: area/neighborhood (e.g., "Kurla", "Nehru Nagar")
            - city: city name (e.g., "Mumbai")
            - state: state name (e.g., "Maharashtra")
            - latitude, longitude: coordinates
            - cases: case count
            - disease_type: disease name
        output_path (str): Output HTML file path
        
    Returns:
        str: Path to generated file
    """
    print("\n" + "="*70)
    print("  DISEASE HEATMAP - ROOT CAUSE FIXES")
    print("="*70)
    
    # Step 1: Validate structured data
    print("\n📊 Validating structured location data...")
    df = validate_structured_data(df)
    
    # Step 2: Calculate proper bounds
    print("\n📐 Calculating bounding box...")
    bounds = calculate_bounds(df)
    
    # Step 3: Create base map
    print("\n🗺️  Creating light basemap...")
    m = create_base_map()
    
    # Step 4: Add high-contrast heatmap
    print("\n🔥 Adding high-contrast heatmap...")
    m = add_heatmap(m, df)
    
    # Step 5: Add structured markers
    print("\n📍 Adding markers with location hierarchy...")
    m = add_structured_markers(m, df)
    
    # Step 6: Apply bounds fit (PROPER WAY)
    print("\n🎯 Applying fit_bounds() for auto-zoom...")
    m = apply_bounds_fit(m, bounds)
    
    # Step 7: Add legend
    print("\n📋 Adding high-contrast legend...")
    m = add_legend(m)
    
    # Step 8: Add layer control
    folium.LayerControl(position='topright').add_to(m)
    
    # Step 9: Save
    print(f"\n💾 Saving to {output_path}...")
    m.save(output_path)
    
    print("\n" + "="*70)
    print("✅ ROOT CAUSE FIXES APPLIED!")
    print("="*70)
    print("\n🔧 Fixes:")
    print("   ✓ fit_bounds() with proper bounding box")
    print("   ✓ Structured location: locality, city, state")
    print("   ✓ High-contrast colors (visible on dark map)")
    print("   ✓ Clear outbreak area identification")
    print(f"\n📁 File: {output_path}")
    print("🌐 Open in browser - map will auto-fit to all data!\n")
    
    return output_path


# ============================================================================
# SAMPLE DATA WITH PROPER STRUCTURE
# ============================================================================

def create_structured_sample_data():
    """
    Create sample data with PROPER STRUCTURE
    
    Returns:
        pd.DataFrame: Properly structured data
    """
    data = {
        'locality': [
            'Kurla',         # Specific area (PRIMARY)
            'Dadar',
            'Andheri',
            'Kothrud',
            'Hinjewadi',
            'Sitabuldi',
            'Nehru Nagar',
            'Garkheda',
            'Vartak Nagar',
            'Rajarampuri'
        ],
        'city': [
            'Mumbai',        # City context (SECONDARY)
            'Mumbai',
            'Mumbai',
            'Pune',
            'Pune',
            'Nagpur',
            'Nashik',
            'Aurangabad',
            'Thane',
            'Kolhapur'
        ],
        'state': [
            'Maharashtra',   # State context
            'Maharashtra',
            'Maharashtra',
            'Maharashtra',
            'Maharashtra',
            'Maharashtra',
            'Maharashtra',
            'Maharashtra',
            'Maharashtra',
            'Maharashtra'
        ],
        'latitude': [
            19.0626, 19.0760, 19.1136, 18.5204, 18.5642,
            21.1458, 19.9672, 19.8762, 19.2183, 16.7050
        ],
        'longitude': [
            72.8820, 72.8777, 72.8697, 73.8567, 73.9120,
            79.0882, 73.7540, 75.3433, 72.9781, 74.2433
        ],
        'cases': [
            28, 22, 15, 18, 8, 12, 6, 5, 25, 4
        ],
        'disease_type': [
            'Dengue', 'Dengue', 'Malaria', 'Typhoid', 'Flu',
            'Malaria', 'Dengue', 'Flu', 'Dengue', 'Flu'
        ]
    }
    
    return pd.DataFrame(data)


# ============================================================================
# MAIN EXECUTION
# ============================================================================

if __name__ == '__main__':
    """
    Demo with properly structured data
    """
    print("Creating properly structured sample data...")
    sample_df = create_structured_sample_data()
    
    # Show data structure
    print("\n📋 Data Structure:")
    print(sample_df[['locality', 'city', 'state', 'disease_type', 'cases']].head())
    
    # Generate heatmap
    output_file = create_disease_heatmap(
        df=sample_df,
        output_path='disease_heatmap_fixed.html'
    )
    
    print(f"\n🎉 Complete! The map will auto-fit to show all outbreak areas.\n")
