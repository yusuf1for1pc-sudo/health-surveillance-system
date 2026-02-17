# Clean Dark Theme Heatmap - Documentation

## Overview

A **production-ready** interactive disease heatmap with dark theme optimized for data visualization.

## Key Features

### ✅ **Root-Cause Solutions** (Not Patches)

1. **Proper Data Validation**
   - Input validation with clear error messages
   - Automatic type conversion and null handling
   - No silent failures

2. **Correct Weight Implementation**
   - Uses `[lat, lon, weight]` format (NOT point duplication)
   - Accurate intensity representation
   - Better performance

3. **Dark Basemap**
   - CartoDB DarkMatter theme
   - Heat colors stand out dramatically
   - Professional appearance

### 🎨 **Visualization**

**Severity Gradient**: Green → Lime → Yellow → Orange → DarkOrange → Red

**Color Thresholds**:
- 🟢 Green: 0-5 cases (Low Risk)
- 🟡 Yellow: 5-10 cases (Medium Risk)  
- 🟠 Orange: 10-20 cases (High Risk)
- 🔴 Red: 20+ cases (Critical)

### 📍 **Interactive Markers**

- **CircleMarker** style (better on dark maps)
- **Hover tooltips**: Quick info on mouseover
- **Click popups**: Detailed view with:
  - Location name
  - Case count
  - Risk level (color-coded)

### 🎯 **Clean Architecture**

```python
# Simple, clear function flow:
validate_data()          # Validate inputs
create_heatmap_base()    # Dark basemap
add_severity_heatmap()   # Gradient heatmap
add_interactive_markers() # Popups
add_custom_legend()       # Dark legend
```

## Usage Examples

### Basic Usage

```python
import pandas as pd
from clean_dark_heatmap import create_disease_heatmap

# Your data
data = pd.DataFrame({
    'latitude': [19.0760, 18.5204],
    'longitude': [72.8777, 73.8567],
    'cases': [25, 15],
    'location_name': ['Mumbai', 'Pune']
})

# Generate heatmap
create_disease_heatmap(data, 'output.html')
```

### With Supabase

```python
from supabase import create_client
from clean_dark_heatmap import load_from_supabase, create_disease_heatmap

# Connect to Supabase
supabase = create_client(
    url='your-project-url',
    key='your-anon-key'
)

# Load data
df = load_from_supabase(supabase, 'disease_cases')

# Generate heatmap
create_disease_heatmap(df, 'supabase_heatmap.html')
```

### Custom Center & Zoom

```python
create_disease_heatmap(
    df=data,
    output_path='custom_map.html',
    center=[19.7515, 75.7139],  # Maharashtra
    zoom=7
)
```

## Configuration

Edit the script constants to customize:

```python
# Basemap style
BASEMAP_STYLE = 'CartoDB dark_matter'  # or 'CartoDB positron'

# Gradient colors
SEVERITY_GRADIENT = {
    0.0: 'green',
    0.5: 'yellow',
    1.0: 'red'
}

# Heatmap appearance
HEATMAP_CONFIG = {
    'radius': 30,      # Hotspot size
    'blur': 15,        # Sharpness
    'min_opacity': 0.5 # Visibility
}

# Risk thresholds
CASE_THRESHOLDS = {
    'low': (0, 5, 'green', 'Low Risk'),
    'medium': (5, 10, 'yellow', 'Medium Risk'),
    'high': (10, 20, 'orange', 'High Risk'),
    'critical': (20, 9999, 'red', 'Critical')
}
```

## Why This Implementation?

### ❌ **Common Mistakes Avoided**

1. **Point Duplication** (Wrong):
   ```python
   # BAD: Duplicates points
   for _ in range(int(cases)):
       heat_data.append([lat, lon])
   ```

2. **Missing Validation** (Wrong):
   ```python
   # BAD: No validation
   heat_data = df.values.tolist()
   ```

3. **Light Basemap** (Wrong):
   ```python
   # BAD: Heat colors don't pop
   tiles='OpenStreetMap'
   ```

### ✅ **Correct Approach**

1. **Proper Weighting**:
   ```python
   # GOOD: Weighted points
   heat_data = df[['latitude', 'longitude', 'cases']].values.tolist()
   HeatMap(heat_data, ...)
   ```

2. **Input Validation**:
   ```python
   # GOOD: Validate first
   df = validate_data(df)
   df['latitude'] = pd.to_numeric(df['latitude'], errors='coerce')
   ```

3. **Dark Theme**:
   ```python
   # GOOD: Colors stand out
   tiles='CartoDB dark_matter'
   ```

## File Structure

```
clean_dark_heatmap.py          # Main script (500 lines)
  ├── Configuration             # All settings in one place
  ├── Core Functions            # Modular, testable
  │   ├── validate_data()
  │   ├── create_heatmap_base()
  │   ├── add_severity_heatmap()
  │   ├── add_interactive_markers()
  │   └── add_custom_legend()
  ├── Supabase Integration     # Ready-to-use example
  └── Demo / Testing           # Sample data generator
```

## Advantages Over Previous Versions

| Feature | Old Version | Clean Version |
|---------|------------|---------------|
| **Basemap** | Light (OpenStreetMap) | Dark (CartoDB) |
| **Weighting** | Point duplication | Proper weights |
| **Validation** | Minimal | Comprehensive |
| **Legend** | Basic | Custom dark theme |
| **Markers** | Standard icons | CircleMarkers |
| **Tooltips** | Basic | Hover + click |
| **Code** | Scattered | Modular |
| **Comments** | Sparse | Detailed |

## Dependencies

```bash
pip install pandas numpy folium
```

**Only free libraries used** - no paid APIs or services.

## Testing

Run the standalone script to test:

```bash
python clean_dark_heatmap.py
```

This generates `disease_heatmap_dark.html` with sample Maharashtra data.

## Integration Checklist

- [x] Dark basemap for heat visibility
- [x] Severity gradient (green → red)
- [x] Weighted heatmap (proper intensity)
- [x] Interactive markers with popups
- [x] Custom dark legend
- [x] Layer controls
- [x] Input validation
- [x] Supabase integration example
- [x] Clean, commented code
- [x] Production-ready architecture

## Troubleshooting

**Q: Heatmap not showing?**
- Check `df` has data: `print(len(df))`
- Verify columns: `print(df.columns)`
- Check coordinates: `print(df[['latitude', 'longitude']])`

**Q: Colors look wrong?**
- Adjust `SEVERITY_GRADIENT` in config
- Change `CASE_THRESHOLDS` values

**Q: Map too zoomed in/out?**
- Set custom `center` and `zoom` parameters
- Use `MAP_CENTER_INDIA` or `MAP_CENTER_MAHARASHTRA`

## Next Steps

1. **Connect to Supabase**: Use `load_from_supabase()` example
2. **Customize colors**: Edit `SEVERITY_GRADIENT`
3. **Add more layers**: Extend `create_disease_heatmap()`
4. **Embed in dashboard**: Use iframe or export as static image

---

**This is a clean, root-cause solution** - not patch work. Every decision is intentional and documented.
