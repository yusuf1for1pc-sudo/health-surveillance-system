# Configuration settings for disease heatmap system

# Map settings
MAP_CENTER_INDIA = [20.5937, 78.9629]  # Latitude, Longitude for India center
MAP_CENTER_MAHARASHTRA = [19.7515, 75.7139]  # Maharashtra center
DEFAULT_ZOOM = 5
MAHARASHTRA_ZOOM = 7

# Heatmap settings - Enhanced for severity visualization
HEATMAP_RADIUS = 30  # Larger radius for better visibility in cities
HEATMAP_BLUR = 15  # REDUCED BLUR for sharper hotspots (was 25)
HEATMAP_MIN_OPACITY = 0.5  # More visible minimum
HEATMAP_MAX_ZOOM = 13  # Allow heatmap at higher zoom levels

# Custom gradient: green → yellow → orange → red (severity levels)
HEATMAP_GRADIENT = {
    0.0: 'green',      # Low cases
    0.3: 'lime',       # Low-medium
    0.5: 'yellow',     # Medium  
    0.7: 'orange',     # Medium-high
    0.85: 'darkorange', # High
    1.0: 'red'         # Critical outbreak
}

# Circle marker settings for high-zoom view
CIRCLE_MIN_ZOOM = 9  # Show circles at zoom level 9+
CIRCLE_RADIUS_MULTIPLIER = 3  # Circle size = case_count * multiplier

# Color thresholds for circle markers
COLOR_THRESHOLDS = {
    'low': (0, 3, 'green'),       # 0-3 cases = green
    'medium': (3, 6, 'yellow'),   # 3-6 cases = yellow
    'high': (6, 10, 'orange'),    # 6-10 cases = orange
    'critical': (10, 999, 'red')  # 10+ cases = red
}

# Geocoding settings
GEOCODING_CACHE_FILE = "data/geocoding_cache.json"
USE_NOMINATIM = True  # Free geocoding service
NOMINATIM_USER_AGENT = "disease_heatmap_app"

# Color scheme for markers
OUTBREAK_COLOR = "red"
NORMAL_COLOR = "blue"
CLUSTER_COLOR = "orange"

# Clustering settings
MIN_CLUSTER_SIZE = 30  # Minimum cases to be considered outbreak
DBSCAN_EPS = 1.5  # degrees (roughly 150-200 km)
DBSCAN_MIN_SAMPLES = 2
