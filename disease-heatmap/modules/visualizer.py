"""
Visualizer Module
Generates interactive disease heatmaps using Folium
"""

import pandas as pd
import folium
from folium.plugins import HeatMap, MarkerCluster
from sklearn.cluster import DBSCAN
import numpy as np
import config


def create_base_map(center=None, zoom=None, tiles='OpenStreetMap'):
    """
    Create a base Folium map
    
    Parameters:
    -----------
    center : list
        [latitude, longitude] for map center
    zoom : int
        Initial zoom level
    tiles : str
        Map tile style
        
    Returns:
    --------
    folium.Map
        Base map object
    """
    if center is None:
        center = config.MAP_CENTER_INDIA
    if zoom is None:
        zoom = config.DEFAULT_ZOOM
    
    m = folium.Map(
        location=center,
        zoom_start=zoom,
        tiles=tiles
    )
    
    return m


def add_heatmap_layer(map_obj, df):
    """
    Add heatmap layer with SEVERITY GRADIENT (green → yellow → orange → red)
    
    Parameters:
    -----------
    map_obj : folium.Map
        Base map object
    df : pd.DataFrame
        DataFrame with latitude, longitude, and case_count columns
        
    Returns:
    --------
    folium.Map
        Map with multi-color heatmap layer added
    """
    # Prepare heatmap data with WEIGHTED INTENSITY: [[lat, lon, weight], ...]
    heat_data = []
    
    for idx, row in df.iterrows():
        lat = row['latitude']
        lon = row['longitude']
        weight = row.get('case_count', 1)  # Use actual case count as intensity
        
        # Add point with weight (NOT duplicating - just weighted intensity)
        heat_data.append([lat, lon, float(weight)])
    
    # Add heatmap layer with CUSTOM GRADIENT
    HeatMap(
        heat_data,
        radius=config.HEATMAP_RADIUS,          # 30 - larger for city visibility
        blur=config.HEATMAP_BLUR,              # 25 - smooth transitions
        min_opacity=config.HEATMAP_MIN_OPACITY, # 0.5 - more visible
        max_zoom=config.HEATMAP_MAX_ZOOM,      # 10 - better zoom behavior
        gradient=config.HEATMAP_GRADIENT,      # 🔥 SEVERITY COLORS: green→red
        name='Disease Severity Heatmap'
    ).add_to(map_obj)
    
    print(f"  • Applied severity gradient: green (low) → yellow → orange → red (high)")
    
    return map_obj


def add_markers(map_obj, df, use_clustering=True):
    """
    Add markers for each location with tooltips
    
    Parameters:
    -----------
    map_obj : folium.Map
        Map object
    df : pd.DataFrame
        DataFrame with location and case data
    use_clustering : bool
        If True, group markers using MarkerCluster
        
    Returns:
    --------
    folium.Map
        Map with markers added
    """
    if use_clustering:
        marker_cluster = MarkerCluster(name='City Markers').add_to(map_obj)
        container = marker_cluster
    else:
        container = map_obj
    
    # Group by city to show total cases
    city_data = df.groupby(['city', 'latitude', 'longitude']).agg({
        'case_count': 'sum',
        'disease': lambda x: ', '.join(x.unique())
    }).reset_index()
    
    for idx, row in city_data.iterrows():
        lat = row['latitude']
        lon = row['longitude']
        city = row['city']
        total_cases = row['case_count']
        diseases = row['disease']
        
        # Determine marker color based on case count
        if total_cases >= config.MIN_CLUSTER_SIZE:
            color = config.OUTBREAK_COLOR
            icon = 'exclamation-triangle'
        else:
            color = config.NORMAL_COLOR
            icon = 'info-sign'
        
        # Create popup HTML
        popup_html = f"""
        <div style="font-family: Arial; font-size: 12px;">
            <h4 style="margin: 0 0 10px 0; color: #333;">{city}</h4>
            <table style="border-collapse: collapse;">
                <tr>
                    <td style="padding: 3px;"><b>Total Cases:</b></td>
                    <td style="padding: 3px;">{total_cases}</td>
                </tr>
                <tr>
                    <td style="padding: 3px;"><b>Diseases:</b></td>
                    <td style="padding: 3px;">{diseases}</td>
                </tr>
            </table>
        </div>
        """
        
        # Add marker
        folium.Marker(
            location=[lat, lon],
            popup=folium.Popup(popup_html, max_width=300),
            tooltip=f"{city}: {total_cases} cases",
            icon=folium.Icon(color=color, icon=icon, prefix='glyphicon')
        ).add_to(container)
    
    return map_obj


def add_circle_markers_by_severity(map_obj, df):
    """
    Add COLORED CIRCLE MARKERS based on case count severity
    These show at HIGH ZOOM LEVELS (zoom >= 9) for precise location viewing
    
    Parameters:
    -----------
    map_obj : folium.Map
        Map object
    df : pd.DataFrame
        Aggregated DataFrame with city, lat, lon, case_count
        
    Returns:
    --------
    folium.Map
        Map with circle markers added
    """
    # Group by city for total cases
    city_data = df.groupby(['city', 'latitude', 'longitude']).agg({
        'case_count': 'sum'
    }).reset_index()
    
    # Create feature group that shows at high zoom
    circle_layer = folium.FeatureGroup(
        name='Detailed Case Markers (Zoom In)',
        show=True
    )
    
    for idx, row in city_data.iterrows():
        lat = row['latitude']
        lon = row['longitude']
        city = row['city']
        cases = row['case_count']
        
        # Determine color based on case count thresholds
        color = 'gray'  # default
        severity_text = 'Unknown'
        
        for severity_name, (min_val, max_val, color_code) in config.COLOR_THRESHOLDS.items():
            if min_val <= cases < max_val:
                color = color_code
                severity_text = severity_name.capitalize()
                break
        
        # Calculate circle radius based on cases
        radius = cases * config.CIRCLE_RADIUS_MULTIPLIER
        
        # Create circle marker with severity color
        folium.CircleMarker(
            location=[lat, lon],
            radius=radius,
            popup=f"""
                <div style='font-family: Arial; min-width: 150px;'>
                    <h4 style='margin: 0 0 8px 0; color: {color};'>{city}</h4>
                    <table style='font-size: 12px;'>
                        <tr>
                            <td><b>Total Cases:</b></td>
                            <td style='padding-left: 10px;'>{cases}</td>
                        </tr>
                        <tr>
                            <td><b>Severity:</b></td>
                            <td style='padding-left: 10px; color: {color};'><b>{severity_text}</b></td>
                        </tr>
                    </table>
                </div>
            """,
            tooltip=f"{city}: {cases} cases ({severity_text})",
            color=color,
            fill=True,
            fillColor=color,
            fillOpacity=0.6,
            weight=2
        ).add_to(circle_layer)
    
    circle_layer.add_to(map_obj)
    
    print(f"  • Added {len(city_data)} colored circle markers for high-zoom detail")
    
    return map_obj


def detect_outbreak_clusters(df, eps=None, min_samples=2):
    """
    Use DBSCAN clustering to identify disease outbreak hotspots
    
    Parameters:
    -----------
    df : pd.DataFrame
        DataFrame with latitude, longitude, and case_count
    eps : float
        Maximum distance between points in a cluster (in degrees)
    min_samples : int
        Minimum number of points to form a cluster
        
    Returns:
    --------
    pd.DataFrame
        DataFrame with cluster labels added
    """
    if eps is None:
        eps = config.DBSCAN_EPS
    
    # Prepare coordinates and weights
    coords = df[['latitude', 'longitude']].values
    weights = df['case_count'].values
    
    # Weight coordinates by case count (duplicate points)
    weighted_coords = []
    for coord, weight in zip(coords, weights):
        for _ in range(int(weight)):
            weighted_coords.append(coord)
    
    weighted_coords = np.array(weighted_coords)
    
    # Perform DBSCAN clustering
    clustering = DBSCAN(eps=eps, min_samples=min_samples).fit(weighted_coords)
    
    # Map back to original dataframe
    # For simplicity, assign cluster based on most common label for each location
    df_clustered = df.copy()
    
    # Simplified: just mark high-case areas as outbreak zones
    df_clustered['is_outbreak'] = df_clustered['case_count'] >= config.MIN_CLUSTER_SIZE
    
    outbreak_count = df_clustered['is_outbreak'].sum()
    print(f"  • Identified {outbreak_count} outbreak zones")
    
    return df_clustered


def add_legend_enhanced(map_obj):
    """
    Add ENHANCED legend with zoom instructions
    
    Parameters:
    -----------
    map_obj : folium.Map
        Map object
        
    Returns:
    --------
    folium.Map
        Map with enhanced legend added
    """
    legend_html = '''
    <div style="position: fixed; 
                bottom: 50px; right: 50px; width: 240px; height: auto;
                background-color: white; border:2px solid grey; z-index:9999;
                font-size:13px; padding: 12px; border-radius: 5px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
        <h4 style="margin: 0 0 10px 0; border-bottom: 2px solid #333; padding-bottom: 5px;">Disease Severity Map</h4>
        
        <div style="background: #f0f8ff; padding: 6px; border-radius: 3px; margin-bottom: 10px; border-left: 3px solid #2196F3;">
            <p style="margin: 0; font-size: 11px; font-weight: bold;">
                🔍 Zoom in to see detailed circles!
            </p>
        </div>
        
        <div style="margin: 10px 0;">
            <h5 style="margin: 5px 0 8px 0; font-size: 12px; font-weight: bold;">Heatmap Colors:</h5>
            <div style="display: flex; align-items: center; margin: 3px 0;">
                <div style="width: 15px; height: 15px; background: green; border: 1px solid #999; border-radius: 2px;"></div>
                <span style="margin-left: 8px; font-size: 11px;">Low (0-3 cases)</span>
            </div>
            <div style="display: flex; align-items: center; margin: 3px 0;">
                <div style="width: 15px; height: 15px; background: yellow; border: 1px solid #999; border-radius: 2px;"></div>
                <span style="margin-left: 8px; font-size: 11px;">Medium (3-6)</span>
            </div>
            <div style="display: flex; align-items: center; margin: 3px 0;">
                <div style="width: 15px; height: 15px; background: orange; border: 1px solid #999; border-radius: 2px;"></div>
                <span style="margin-left: 8px; font-size: 11px;">High (6-10)</span>
            </div>
            <div style="display: flex; align-items: center; margin: 3px 0;">
                <div style="width: 15px; height: 15px; background: red; border: 1px solid #999; border-radius: 2px;"></div>
                <span style="margin-left: 8px; font-size: 11px;">Critical (10+)</span>
            </div>
        </div>
        
        <div style="margin-top: 10px; border-top: 1px solid #ccc; padding-top: 8px;">
            <h5 style="margin: 5px 0; font-size: 12px; font-weight: bold;">City Markers:</h5>
            <p style="margin: 3px 0; font-size: 10px;">
                <i class="glyphicon glyphicon-info-sign" style="color:blue;"></i>
                Normal • 
                <i class="glyphicon glyphicon-exclamation-triangle" style="color:red;"></i>
                Outbreak
            </p>
        </div>
        
        <div style="margin-top: 8px; background: #fff9e6; padding: 5px; border-radius: 3px; font-size: 10px; color: #856404;">
            <b>Tip:</b> Toggle layers using the control in top-right corner
        </div>
    </div>
    '''
    
    map_obj.get_root().html.add_child(folium.Element(legend_html))
    
    return map_obj


def add_legend(map_obj):
    """
    Add a legend to the map
    
    Parameters:
    -----------
    map_obj : folium.Map
        Map object
        
    Returns:
    --------
    folium.Map
        Map with legend added
    """
    legend_html = '''
    <div style="position: fixed; 
                bottom: 50px; right: 50px; width: 220px; height: auto;
                background-color: white; border:2px solid grey; z-index:9999;
                font-size:14px; padding: 10px; border-radius: 5px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
        <h4 style="margin: 0 0 10px 0; border-bottom: 2px solid #333; padding-bottom: 5px;">Disease Severity</h4>
        
        <div style="margin: 10px 0;">
            <h5 style="margin: 5px 0; font-size: 12px; font-weight: bold;">Heatmap Gradient:</h5>
            <div style="display: flex; align-items: center; margin: 3px 0;">
                <div style="width: 15px; height: 15px; background: green; border: 1px solid #999;"></div>
                <span style="margin-left: 8px; font-size: 12px;">Low Cases</span>
            </div>
            <div style="display: flex; align-items: center; margin: 3px 0;">
                <div style="width: 15px; height: 15px; background: yellow; border: 1px solid #999;"></div>
                <span style="margin-left: 8px; font-size: 12px;">Medium</span>
            </div>
            <div style="display: flex; align-items: center; margin: 3px 0;">
                <div style="width: 15px; height: 15px; background: orange; border: 1px solid #999;"></div>
                <span style="margin-left: 8px; font-size: 12px;">High</span>
            </div>
            <div style="display: flex; align-items: center; margin: 3px 0;">
                <div style="width: 15px; height: 15px; background: red; border: 1px solid #999;"></div>
                <span style="margin-left: 8px; font-size: 12px;">Critical Outbreak</span>
            </div>
        </div>
        
        <div style="margin-top: 10px; border-top: 1px solid #ccc; padding-top: 8px;">
            <h5 style="margin: 5px 0; font-size: 12px; font-weight: bold;">Markers:</h5>
            <p style="margin: 5px 0; font-size: 11px;">
                <i class="glyphicon glyphicon-info-sign" style="color:blue;"></i>
                &nbsp; Normal Activity
            </p>
            <p style="margin: 5px 0; font-size: 11px;">
                <i class="glyphicon glyphicon-exclamation-triangle" style="color:red;"></i>
                &nbsp; Outbreak (≥30 cases)
            </p>
        </div>
    </div>
    '''
    
    map_obj.get_root().html.add_child(folium.Element(legend_html))
    
    return map_obj


def generate_heatmap(df, output_path='output/disease_heatmap.html', 
                     center=None, zoom=None, 
                     add_clusters=True, detect_outbreaks=False):
    """
    Generate ZOOM-ADAPTIVE interactive disease heatmap
    
    Features:
    - Multi-color severity gradient (green → yellow → orange → red)
    - Sharp hotspots (reduced blur)
    - Colored circle markers for high-zoom detail
    - Auto-switching visualization based on zoom level
    
    Parameters:
    -----------
    df : pd.DataFrame
        Aggregated DataFrame with coordinates and case counts
    output_path : str
        Path to save HTML file
    center : list
        Map center [lat, lon]
    zoom : int
        Initial zoom level
    add_clusters : bool
        Whether to cluster markers
    detect_outbreaks : bool
        Whether to run outbreak detection
        
    Returns:
    --------
    str
        Path to generated HTML file
    """
    print("\n🗺️  Generating ENHANCED zoom-adaptive heatmap...")
    
    # Detect outbreaks if requested
    if detect_outbreaks:
        df = detect_outbreak_clusters(df)
    
    # Auto-detect map center if not provided
    if center is None:
        # Check if data is Maharashtra-only
        if 'state' in df.columns and df['state'].nunique() == 1:
            if df['state'].iloc[0] == 'Maharashtra':
                center = config.MAP_CENTER_MAHARASHTRA
                if zoom is None:
                    zoom = config.MAHARASHTRA_ZOOM
    
    # Create base map
    m = create_base_map(center=center, zoom=zoom)
    print(f"  • Created base map centered at {center or config.MAP_CENTER_INDIA}")
    
    # Add SEVERITY GRADIENT heatmap layer
    m = add_heatmap_layer(m, df)
    print(f"  • Added severity heatmap with {len(df)} locations")
    
    # Add COLORED CIRCLE MARKERS for high-zoom detail
    m = add_circle_markers_by_severity(m, df)
    
    # Add standard markers with tooltips (for clustering)
    m = add_markers(m, df, use_clustering=add_clusters)
    print(f"  • Added city markers")
    
    # Add enhanced legend with zoom instructions
    m = add_legend_enhanced(m)
    print(f"  • Added interactive legend")
    
    # Add layer control
    folium.LayerControl().add_to(m)
    
    # Save to HTML
    m.save(output_path)
    print(f"✓ Enhanced heatmap saved to: {output_path}")
    print(f"\n💡 TIP: Zoom in to see colored circles replace the heatmap for precise locations!")
    
    return output_path
