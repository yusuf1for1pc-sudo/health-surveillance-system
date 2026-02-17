# Disease Trend Graph

Interactive time-series visualization for disease surveillance with automated outbreak detection.

## Features

- **Multi-Disease Tracking**: Display multiple diseases on the same chart
- **Time Aggregation**: Daily or weekly views
- **City Filtering**: Focus on specific cities
- **Outbreak Detection**: Automated spike detection with red markers
- **Interactive Dashboard**: Hover for details, toggle diseases
- **Export Ready**: Generates standalone HTML files

## Quick Start

```python
from trend_graph import create_disease_trends

# Basic usage (generates sample data)
create_disease_trends(
    period='W',  # Weekly aggregation
    output_path='my_dashboard.html'
)
```

## Data Format

Your data should have these columns:

```python
{
    'disease': str,      # e.g., 'Dengue', 'Malaria'
    'date': datetime,    # Case reported date
    'city': str,         # City name
    'area': str,         # Locality/area
    'age_group': str     # e.g., '0-18', '19-45'
}
```

## Usage Examples

### Example 1: All Cities, Weekly View

```python
create_disease_trends(
    period='W',
    output_path='trend_weekly.html'
)
```

### Example 2: City Filter, Daily View

```python
import pandas as pd
from trend_graph import create_disease_trends

# Load your data
df = pd.read_csv('disease_data.csv')
df['date'] = pd.to_datetime(df['date'])

# Create filtered trend
create_disease_trends(
    df=df,
    period='D',          # Daily
    city='Mumbai',       # Filter to Mumbai
    threshold=1.5,       # 50% spike threshold
    output_path='mumbai_daily.html'
)
```

### Example 3: Custom Sample Data

```python
from trend_graph import generate_sample_data, create_disease_trends

# Generate custom sample data
df = generate_sample_data(
    weeks=16,
    diseases=['Dengue', 'Malaria', 'COVID-19'],
    cities=['Mumbai', 'Delhi', 'Bangalore']
)

create_disease_trends(df=df, period='W')
```

## Outbreak Detection

The spike detection algorithm:

```python
for each time period:
    avg_baseline = mean(last 4 periods)
    
    if current_cases > avg_baseline * threshold:
        mark as "Possible Outbreak"
        show red dot with ⚠️ marker
```

Default threshold: **1.5** (50% increase over baseline)

## Parameters

### `create_disease_trends()`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `df` | DataFrame | None | Input data (generates sample if None) |
| `period` | str | 'W' | 'D' for daily, 'W' for weekly |
| `city` | str | None | City filter (None = all cities) |
| `threshold` | float | 1.5 | Outbreak spike threshold |
| `output_path` | str | 'trend_dashboard.html' | Output HTML file |

## Dependencies

```bash
pip install pandas plotly numpy
```

## Output

Generates interactive HTML dashboard with:
- ✓ Multi-disease line charts
- ✓ Hover tooltips
- ✓ Red outbreak markers (⚠️)
- ✓ Toggle diseases on/off
- ✓ Zoom and pan
- ✓ Export to PNG

## Integration

Perfect for:
- Health department dashboards
- Hospital analytics systems
- Public health monitoring
- Research analysis

## File Structure

```
disease-trends/
├── trend_graph.py           # Main module
├── README.md                # This file
├── trend_all_cities_weekly.html   # Example output 1
└── trend_mumbai_daily.html        # Example output 2
```

## Run Examples

```bash
cd disease-trends
python trend_graph.py
```

This generates 2 example dashboards you can open in your browser!
