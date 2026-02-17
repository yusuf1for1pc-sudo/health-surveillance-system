#!/usr/bin/env python3
"""
Interactive Disease Heatmap with Dark Theme
============================================

A clean, production-ready implementation using Folium for geospatial visualization.
Features:
- Dark basemap (CartoDB DarkMatter) for better heat color visibility
- Severity gradient: green → yellow → orange → red
- Interactive markers with location details
- Weighted heatmap based on case counts
- Ready for Supabase/database integration

Dependencies:
    pip install pandas numpy folium

Author: Geospatial Visualization System
"""

import pandas as pd
import numpy as np
import folium
from folium.plugins import HeatMap


# ============================================================================
# CONFIGURATION
# ============================================================================

# Map settings
MAP_CENTER_INDIA = [20.5937, 78.9629]  # India center
MAP_CENTER_MAHARASHTRA = [19.7515, 75.7139]  # Maharashtra center
DEFAULT_ZOOM = 5

# Light basemap for clean, professional look
BASEMAP_STYLE = 'OpenStreetMap'  # Clean light theme

# Severity gradient configuration
SEVERITY_GRADIENT = {
    0.0: 'green',       # 0-25% = Low cases
    0.25: 'lime',       # 25-40% = Low-medium
    0.40: 'yellow',     # 40-60% = Medium
    0.60: 'orange',     # 60-80% = High
    0.80: 'darkorange', # 80-95% = Very high
    1.0: 'red'          # 95-100% = Critical
}

# Heatmap visual parameters
HEATMAP_CONFIG = {
    'radius': 30,           # Hotspot size
    'blur': 15,             # Sharpness (lower = sharper)
    'min_opacity': 0.5,     # Minimum visibility
    'max_zoom': 13,         # Maximum zoom for heatmap
    'gradient': SEVERITY_GRADIENT
}

# Marker color thresholds (for popup markers)
CASE_THRESHOLDS = {
    'low': (0, 5, 'green', 'Low Risk'),
    'medium': (5, 10, 'yellow', 'Medium Risk'),
    'high': (10, 20, 'orange', 'High Risk'),
    'critical': (20, 9999, 'red', 'Critical')
}


# ============================================================================
# CORE FUNCTIONS
# ============================================================================

def validate_data(df):
    """
    Validate input DataFrame has required columns
    
    Args:
        df (pd.DataFrame): Input dataframe
        
    Returns:
        pd.DataFrame: Validated dataframe
        
    Raises:
        ValueError: If required columns are missing
    """
    required_cols = ['latitude', 'longitude', 'cases', 'location_name']
    missing = [col for col in required_cols if col not in df.columns]
    
    if missing:
        raise ValueError(f"Missing required columns: {missing}")
    
    # Drop rows with null critical values
    df = df.dropna(subset=['latitude', 'longitude', 'cases', 'location_name'])
    
    # Ensure numeric types
    df['latitude'] = pd.to_numeric(df['latitude'], errors='coerce')
    df['longitude'] = pd.to_numeric(df['longitude'], errors='coerce')
    df['cases'] = pd.to_numeric(df['cases'], errors='coerce')
    
    # Remove invalid coordinates
    df = df.dropna()
    
    print(f"✓ Validated {len(df)} records")
    return df


def create_heatmap_base(center=None, zoom=None, tiles=BASEMAP_STYLE):
    """
    Create base Folium map with DARK theme
    
    Args:
        center (list): [lat, lon] for map center
        zoom (int): Initial zoom level
        tiles (str): Basemap style
        
    Returns:
        folium.Map: Configured base map
    """
    if center is None:
        center = MAP_CENTER_INDIA
    if zoom is None:
        zoom = DEFAULT_ZOOM
    
    # Create map with dark theme
    m = folium.Map(
        location=center,
        zoom_start=zoom,
        tiles=tiles,
        attr='CartoDB'  # Attribution
    )
    
    print(f"✓ Created dark basemap centered at {center}")
    return m


def add_severity_heatmap(map_obj, df):
    """
    Add WEIGHTED heatmap layer with severity gradient
    
    Uses case counts as intensity weights for accurate representation.
    Gradient: green (low) → yellow (medium) → orange (high) → red (critical)
    
    Args:
        map_obj (folium.Map): Base map
        df (pd.DataFrame): Data with latitude, longitude, cases
        
    Returns:
        folium.Map: Map with heatmap layer
    """
    # Prepare heat data: [[lat, lon, weight], ...]
    # Weight = case count (NOT duplicating points - proper weighting)
    heat_data = df[['latitude', 'longitude', 'cases']].values.tolist()
    
    # Add heatmap with custom severity gradient
    HeatMap(
        heat_data,
        name='Disease Heatmap',
        **HEATMAP_CONFIG  # Unpack all config parameters
    ).add_to(map_obj)
    
    print(f"✓ Added heatmap with severity gradient ({len(heat_data)} locations)")
    return map_obj


def get_severity_color(case_count):
    """
    Determine marker color based on case count thresholds
    
    Args:
        case_count (int/float): Number of cases
        
    Returns:
        tuple: (color, severity_label)
    """
    for severity_name, (min_val, max_val, color, label) in CASE_THRESHOLDS.items():
        if min_val <= case_count < max_val:
            return color, label
    
    return 'gray', 'Unknown'


def add_interactive_markers(map_obj, df):
    """
    Add INTERACTIVE markers with CLICK-TO-ZOOM and detailed popups
    
    Each marker shows:
    - Location name (area/neighborhood)
    - Case count  
    - Disease type (if available)
    - Severity level (color-coded)
    
    CLICK MARKER TO ZOOM IN to that location!
    
    Args:
        map_obj (folium.Map): Base map
        df (pd.DataFrame): Data with location info
        
    Returns:
        folium.Map: Map with clickable zoom markers
    """
    # Create marker cluster layer (optional - can be toggled)
    marker_layer = folium.FeatureGroup(name='Location Markers')
    
    for idx, row in df.iterrows():
        lat = row['latitude']
        lon = row['longitude']
        location = row['location_name']
        cases = row['cases']
        
        # Get disease type if available
        disease = row.get('disease_type', 'Not specified')
        
        # Get severity color
        color, severity = get_severity_color(cases)
        
        # Create enhanced popup HTML with disease type
        popup_html = f"""
        <div style="font-family: Arial, sans-serif; min-width: 200px; padding: 8px;">
            <h4 style="margin: 0 0 10px 0; color: {color}; border-bottom: 2px solid {color}; padding-bottom: 5px;">
                📍 {location}
            </h4>
            <table style="width: 100%; font-size: 13px;">
                <tr style="background-color: #f5f5f5;">
                    <td style="padding: 6px; font-weight: bold;">Disease:</td>
                    <td style="padding: 6px; text-align: right;"><b>{disease}</b></td>
                </tr>
                <tr>
                    <td style="padding: 6px; font-weight: bold;">Cases:</td>
                    <td style="padding: 6px; text-align: right;"><b>{int(cases)}</b></td>
                </tr>
                <tr style="background-color: #f5f5f5;">
                    <td style="padding: 6px; font-weight: bold;">Risk Level:</td>
                    <td style="padding: 6px; text-align: right; color: {color};">
                        <b>{severity}</b>
                    </td>
                </tr>
            </table>
            <button onclick="map.setView([{lat}, {lon}], 13);" 
                    style="margin-top: 10px; width: 100%; padding: 8px; 
                           background: {color}; color: white; border: none; 
                           border-radius: 4px; cursor: pointer; font-weight: bold;">
                🔍 Zoom to Location
            </button>
        </div>
        """
        
        # Add circle marker with enhanced popup
        marker = folium.CircleMarker(
            location=[lat, lon],
            radius=8,
            popup=folium.Popup(popup_html, max_width=280),
            tooltip=f"{location}: {int(cases)} {disease} cases",  # Enhanced hover tooltip
            color=color,
            fill=True,
            fillColor=color,
            fillOpacity=0.7,
            weight=2
        )
        
        # Add click event to zoom
        marker.add_child(folium.Element(f"""
        <script>
            (function() {{
                var markers = document.querySelectorAll('[fill="{color}"]');
                markers.forEach(function(m) {{
                    m.addEventListener('click', function() {{
                        map.setView([{lat}, {lon}], 13);
                    }});
                }});
            }})();
        </script>
        """))
        
        marker.add_to(marker_layer)
    
    marker_layer.add_to(map_obj)
    
    print(f"✓ Added {len(df)} interactive click-to-zoom markers")
    return map_obj


def add_custom_legend(map_obj):
    """
    Add CUSTOM legend explaining the visualization
    
    Shows:
    - Severity color scale
    - Risk level thresholds
    - Usage instructions
    
    Args:
        map_obj (folium.Map): Map object
        
    Returns:
        folium.Map: Map with legend
    """
    legend_html = '''
    <div style="position: fixed; 
                bottom: 50px; left: 50px; width: 250px; 
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
                   font-size: 16px;">
            🗺️ Disease Severity Map
        </h4>
        
        <div style="margin-bottom: 12px; 
                    background: #e3f2fd; 
                    padding: 8px; 
                    border-radius: 5px;">
            <p style="margin: 0; font-size: 11px; font-weight: bold; color: #1976d2;">
                💡 Click markers to zoom in
            </p>
            <p style="margin: 3px 0 0 0; font-size: 11px; color: #555;">
                Hover for quick info
            </p>
        </div>
        
        <h5 style="margin: 5px 0 8px 0; 
                   font-size: 13px; 
                   color: #d32f2f;">
            Risk Levels:
        </h5>
        
        <div style="font-size: 12px;">
            <div style="display: flex; align-items: center; margin: 5px 0;">
                <div style="width: 20px; height: 20px; 
                           background: green; 
                           border: 2px solid #333; 
                           border-radius: 3px; 
                           margin-right: 10px;"></div>
                <span>Low (0-5 cases)</span>
            </div>
            
            <div style="display: flex; align-items: center; margin: 5px 0;">
                <div style="width: 20px; height: 20px; 
                           background: yellow; 
                           border: 2px solid #333; 
                           border-radius: 3px; 
                           margin-right: 10px;"></div>
                <span>Medium (5-10)</span>
            </div>
            
            <div style="display: flex; align-items: center; margin: 5px 0;">
                <div style="width: 20px; height: 20px; 
                           background: orange; 
                           border: 2px solid #333; 
                           border-radius: 3px; 
                           margin-right: 10px;"></div>
                <span>High (10-20)</span>
            </div>
            
            <div style="display: flex; align-items: center; margin: 5px 0;">
                <div style="width: 20px; height: 20px; 
                           background: red; 
                           border: 2px solid #333; 
                           border-radius: 3px; 
                           margin-right: 10px;"></div>
                <span>Critical (20+)</span>
            </div>
        </div>
        
        <div style="margin-top: 12px; 
                    padding-top: 10px; 
                    border-top: 1px solid #ddd; 
                    font-size: 10px; 
                    color: #666;">
            🔥 Heat intensity = case density
        </div>
    </div>
    '''
    
    map_obj.get_root().html.add_child(folium.Element(legend_html))
    
    print("✓ Added custom legend")
    return map_obj


def add_fit_screen_button(map_obj, initial_center, initial_zoom):
    """
    Add FIT SCREEN button to reset map view
    
    Args:
        map_obj (folium.Map): Map object
        initial_center (list): Initial map center [lat, lon]
        initial_zoom (int): Initial zoom level
        
    Returns:
        folium.Map: Map with fit screen button
    """
    fit_button_html = f'''
    <div style="position: fixed; 
                top: 80px; right: 10px; 
                z-index: 9999;">
        <button onclick="map.setView([{initial_center[0]}, {initial_center[1]}], {initial_zoom});"
                style="padding: 10px 15px; 
                       background: white; 
                       border: 2px solid #333;
                       border-radius: 6px; 
                       cursor: pointer; 
                       font-family: Arial, sans-serif;
                       font-size: 13px;
                       font-weight: bold;
                       box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                       transition: all 0.2s;">
            🏠 Fit Screen
        </button>
    </div>
    
    <style>
        button:hover {{
            background: #f0f0f0;
            transform: scale(1.05);
        }}
    </style>
    '''
    
    map_obj.get_root().html.add_child(folium.Element(fit_button_html))
    
    print("✓ Added Fit Screen button")
    return map_obj


def create_disease_heatmap(df, output_path='disease_heatmap_dark.html', 
                          center=None, zoom=None):
    """
    MAIN FUNCTION: Generate complete interactive disease heatmap
    
    Features:
    - CLICK MARKERS TO ZOOM directly to that location
    - FIT SCREEN button to reset view
    - Enhanced popups showing: area name, disease type, cases, risk level
    - All colored markers (green/yellow/orange/red) show full information
    
    Workflow:
    1. Validate input data
    2. Create light basemap
    3. Add severity-colored heatmap
    4. Add interactive click-to-zoom markers
    5. Add custom legend
    6. Add FIT SCREEN button
    7. Add layer controls
    8. Save to HTML
    
    Args:
        df (pd.DataFrame): Data with columns: latitude, longitude, cases, location_name
                          Optional: disease_type
        output_path (str): Where to save HTML file
        center (list, optional): Map center [lat, lon]
        zoom (int, optional): Initial zoom level
        
    Returns:
        str: Path to generated HTML file
        
    Example:
        >>> data = pd.DataFrame({
        ...     'latitude': [19.0760, 18.5204],
        ...     'longitude': [72.8777, 73.8567],
        ...     'cases': [25, 15],
        ...     'location_name': ['Kurla, Mumbai', 'Kothrud, Pune'],
        ...     'disease_type': ['Dengue', 'Malaria']
        ... })
        >>> create_disease_heatmap(data, 'output.html')
    """
    print("\n" + "="*70)
    print("  INTERACTIVE DISEASE HEATMAP GENERATOR")
    print("="*70 + "\n")
    
    # Step 1: Validate data
    print("📊 Step 1: Validating data...")
    df = validate_data(df)
    
    # Determine initial center and zoom
    if center is None:
        center = MAP_CENTER_MAHARASHTRA
    if zoom is None:
        zoom = 7
    
    # Step 2: Create base map
    print("\n🗺️  Step 2: Creating basemap...")
    m = create_heatmap_base(center=center, zoom=zoom)
    
    # Step 3: Add heatmap layer
    print("\n🔥 Step 3: Adding severity heatmap...")
    m = add_severity_heatmap(m, df)
    
    # Step 4: Add interactive click-to-zoom markers
    print("\n📍 Step 4: Adding click-to-zoom markers...")
    m = add_interactive_markers(m, df)
    
    # Step 5: Add legend
    print("\n📋 Step 5: Adding custom legend...")
    m = add_custom_legend(m)
    
    # Step 6: Add FIT SCREEN button
    print("\n🏠 Step 6: Adding Fit Screen button...")
    m = add_fit_screen_button(m, center, zoom)
    
    # Step 7: Add layer control (toggle layers on/off)
    folium.LayerControl(position='topright').add_to(m)
    
    # Step 8: Save to HTML
    print(f"\n💾 Step 7: Saving to {output_path}...")
    m.save(output_path)
    
    print("\n" + "="*70)
    print("✅ SUCCESS! Interactive heatmap generated!")
    print("="*70)
    print(f"\n📁 File: {output_path}")
    print(f"\n✨ Features:")
    print(f"   • Click any marker to zoom to that location")
    print(f"   • Click 'Fit Screen' button to reset view")
    print(f"   • All markers show area, disease type, & case count")
    print(f"🌐 Open this file in your browser now!\n")
    
    return output_path


# ============================================================================
# SUPABASE INTEGRATION EXAMPLE
# ============================================================================

def load_from_supabase(supabase_client, table_name='medical_records'):
    """
    EXAMPLE: Load data from Supabase
    
    This shows how to integrate with your Supabase database.
    Modify the query and column mapping as needed.
    
    Args:
        supabase_client: Initialized Supabase client
        table_name (str): Database table name
        
    Returns:
        pd.DataFrame: Data ready for heatmap
        
    Example:
        >>> from supabase import create_client
        >>> supabase = create_client(url, key)
        >>> df = load_from_supabase(supabase, 'disease_cases')
        >>> create_disease_heatmap(df)
    """
    # Query data from Supabase
    response = supabase_client.table(table_name).select('*').execute()
    
    # Convert to DataFrame
    df = pd.DataFrame(response.data)
    
    # Map your database columns to required format
    df = df.rename(columns={
        'lat': 'latitude',     # Adjust to your column names
        'lon': 'longitude',
        'case_count': 'cases',
        'city': 'location_name'
    })
    
    return df


# ============================================================================
# DEMO / TESTING
# ============================================================================

def create_sample_data():
    """
    Generate sample data with SPECIFIC AREA NAMES and DISEASE TYPES
    Shows neighborhoods/localities like Kurla, Nehru Nagar, etc.
    
    Returns:
        pd.DataFrame: Sample disease data with area-level granularity
    """
    data = {
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
        'location_name': [
            'Kurla, Mumbai',           # Specific area in Mumbai
            'Dadar, Mumbai',           # Specific area in Mumbai  
            'Andheri, Mumbai',         # Specific area in Mumbai
            'Kothrud, Pune',           # Specific area in Pune
            'Hinjewadi, Pune',         # Specific area in Pune
            'Sitabuldi, Nagpur',       # Specific area in Nagpur
            'Nehru Nagar, Nashik',     # Specific area in Nashik
            'Garkheda, Aurangabad',    # Specific area in Aurangabad
            'Vartak Nagar, Thane',     # Specific area in Thane
            'Rajarampuri, Kolhapur'    # Specific area in Kolhapur
        ],
        'disease_type': [
            'Dengue',      # Kurla - Critical
            'Dengue',      # Dadar - Critical
            'Malaria',     # Andheri - High
            'Typhoid',     # Kothrud - High
            'Flu',         # Hinjewadi - Medium
            'Malaria',     # Sitabuldi - High
            'Dengue',      # Nehru Nagar - Medium
            'Flu',         # Garkheda - Low
            'Dengue',      # Vartak Nagar - Critical
            'Flu'          # Rajarampuri - Low
        ]
    }
    
    return pd.DataFrame(data)


# ============================================================================
# MAIN EXECUTION
# ============================================================================

if __name__ == '__main__':
    """
    Standalone execution - generates demo heatmap with AREA NAMES
    """
    # Generate sample data with specific areas
    print("Generating sample data with specific area names...")
    sample_df = create_sample_data()
    
    # Create heatmap
    output_file = create_disease_heatmap(
        df=sample_df,
        output_path='disease_heatmap_areas.html',
        center=MAP_CENTER_MAHARASHTRA,
        zoom=7
    )
    
    print(f"\n🎉 Demo complete! Open {output_file} in your browser.")
    print(f"💡 Notice: Markers now show specific areas like 'Kurla' instead of just 'Mumbai'\n")
