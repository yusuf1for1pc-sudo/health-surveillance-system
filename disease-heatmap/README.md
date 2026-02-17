# Disease Heatmap Visualization System 🗺️

A Python-based geospatial visualization system for healthcare analytics that generates interactive disease heatmaps for India/Maharashtra.

## Features ✨

- 📊 **Interactive Heatmaps**: Visualize disease outbreaks with color-coded intensity
- 🌍 **Smart Geocoding**: Pre-mapped 50+ Indian cities + Nominatim fallback
- 🔍 **Disease Analytics**: Automatic aggregation and summary statistics
- 🚨 **Outbreak Detection**: Identify hotspots with configurable thresholds
- 📁 **Flexible Input**: Supports CSV and JSON formats
- 🔄 **Automation-Ready**: Modular design for Supabase/API integration
- 💾 **Offline Maps**: Generated HTML works without internet

## Quick Start 🚀

### Installation

```bash
# Navigate to project directory
cd disease-heatmap

# Install dependencies
pip install -r requirements.txt
```

### Basic Usage

```bash
# Use sample data (included)
python heatmap_generator.py

# Use your own CSV file
python heatmap_generator.py --input your_data.csv --output my_map.html

# Use JSON file with outbreak detection
python heatmap_generator.py --input data.json --format json --outbreaks
```

### Python API Usage

```python
import heatmap_generator

# Run complete pipeline
heatmap_generator.pipeline(
    input_file='data/sample_data.csv',
    output_file='output/my_heatmap.html',
    detect_outbreaks=True
)
```

## Input Data Format 📥

Your CSV or JSON must have these columns:

| Column | Required | Description |
|--------|----------|-------------|
| `disease` | ✅ | Disease name (e.g., "Dengue") |
| `city` | ✅ | City name |
| `state` | ⚪ | State name (helps geocoding) |
| `latitude` | ⚪ | Auto-geocoded if missing |
| `longitude` | ⚪ | Auto-geocoded if missing |
| `age_group` | ⚪ | Patient age group |
| `gender` | ⚪ | Patient gender |
| `date` | ⚪ | Case date |

### Example CSV

```csv
disease,city,state,age_group,gender,date
Dengue,Pune,Maharashtra,25-35,M,2024-01-15
Malaria,Nagpur,Maharashtra,18-25,F,2024-01-16
Flu,Mumbai,Maharashtra,35-45,M,2024-01-17
```

## Module Architecture 🏗️

```
disease-heatmap/
├── heatmap_generator.py      # 🎯 Main script & pipeline
├── config.py                  # ⚙️ Configuration settings
├── modules/
│   ├── data_loader.py         # 📂 Load CSV/JSON
│   ├── data_cleaner.py        # 🧹 Clean & validate
│   ├── geocoder.py            # 🌍 City → coordinates
│   ├── aggregator.py          # 📊 Count & summarize
│   └── visualizer.py          # 🗺️ Generate heatmap
├── data/
│   ├── sample_data.csv        # Example dataset
│   └── indian_cities.json     # Pre-mapped coordinates
└── output/
    └── disease_heatmap.html   # Generated map
```

## Command-Line Options 🛠️

```bash
python heatmap_generator.py [OPTIONS]

Options:
  -i, --input FILE       Input CSV/JSON file (default: data/sample_data.csv)
  -o, --output FILE      Output HTML file (default: output/disease_heatmap.html)
  -f, --format FORMAT    File format: csv or json (default: csv)
  --no-geocoding         Disable online geocoding, use only cached cities
  --outbreaks            Enable outbreak detection (≥30 cases = outbreak)
  -h, --help             Show help message
```

## Configuration ⚙️

Edit `config.py` to customize:

- Map center coordinates
- Heatmap colors and intensity
- Outbreak threshold (default: 30 cases)
- Clustering parameters
- Geocoding settings

## Future Automation 🔄

Integrate with Supabase or any API:

```python
from supabase import create_client
import pandas as pd
import heatmap_generator

# Fetch data from Supabase
supabase = create_client(url, key)
response = supabase.table('medical_records').select('*').execute()

# Convert to DataFrame
df = pd.DataFrame(response.data)

# Generate heatmap
heatmap_generator.pipeline(df)
```

## Examples 📸

The generated HTML file includes:

- ✅ Interactive pan/zoom controls
- ✅ Heatmap layer showing disease density
- ✅ Clickable markers with city details
- ✅ Tooltips on hover
- ✅ Color-coded outbreak zones (red = outbreak, blue = normal)
- ✅ Legend explaining symbols

## Technology Stack 🧰

- **pandas** - Data manipulation
- **folium** - Interactive maps (Leaflet.js)
- **geopandas** - Geospatial operations
- **geopy** - Free geocoding (Nominatim)
- **scikit-learn** - Clustering algorithms
- **numpy** - Numerical operations

## Troubleshooting 🔧

**Missing coordinates for some cities?**
- Add them to `data/indian_cities.json`
- Or enable geocoding (removes `--no-geocoding` flag)

**Geocoding is slow?**
- Nominatim has 1 request/second limit
- Pre-map common cities in JSON file

**Map doesn't center correctly?**
- Check if your data is regional (e.g., Maharashtra only)
- Manually set center in `config.py`

## License & Credits 📄

Built with ❤️ for healthcare analytics
Uses free and open-source libraries only

---

**Ready to visualize disease outbreaks? Run `python heatmap_generator.py` now!** 🚀
