#!/usr/bin/env python3
"""
Disease Heatmap Generator - Main Script
Generates interactive disease heatmaps for healthcare analytics

Usage:
    python heatmap_generator.py                    # Use default sample data
    python heatmap_generator.py --input data.csv   # Use custom CSV file
    python heatmap_generator.py --input data.json --format json
"""

import argparse
import sys
import os

# Add modules to path
sys.path.insert(0, os.path.dirname(__file__))

from modules import data_loader, data_cleaner, geocoder, aggregator, visualizer


def pipeline(input_file='data/sample_data.csv', 
             output_file='output/disease_heatmap.html',
             file_format='csv',
             use_geocoding=True,
             detect_outbreaks=False):
    """
    Complete pipeline to generate disease heatmap
    
    Parameters:
    -----------
    input_file : str
        Path to input data file
    output_file : str
        Path to output HTML file
    file_format : str
        Input file format ('csv' or 'json')
    use_geocoding : bool
        Whether to use Nominatim for missing coordinates
    detect_outbreaks : bool
        Whether to detect outbreak clusters
        
    Returns:
    --------
    str
        Path to generated heatmap HTML file
    """
    print("\n" + "="*60)
    print("  DISEASE HEATMAP GENERATOR")
    print("="*60)
    
    try:
        # Step 1: Load data
        print("\n📂 STEP 1: Loading data...")
        df = data_loader.load_data(input_file, format=file_format)
        
        # Step 2: Clean data
        print("\n🧹 STEP 2: Cleaning data...")
        df = data_cleaner.clean_data(df)
        data_cleaner.validate_data(df)
        
        # Step 3: Geocode cities
        print("\n🌍 STEP 3: Geocoding cities...")
        df = geocoder.map_city_to_coords(df, use_geocoding=use_geocoding)
        
        # Step 4: Aggregate cases
        print("\n📊 STEP 4: Aggregating cases...")
        df_agg, city_totals = aggregator.aggregate_cases(df)
        
        # Print summaries
        print("\n📋 Disease Summary:")
        print(aggregator.get_disease_summary(df_agg))
        
        print("\n📋 Top 10 Cities by Cases:")
        print(aggregator.get_city_summary(df_agg).head(10))
        
        # Step 5: Generate heatmap
        print("\n🗺️  STEP 5: Generating heatmap...")
        output_path = visualizer.generate_heatmap(
            df_agg, 
            output_path=output_file,
            detect_outbreaks=detect_outbreaks
        )
        
        print("\n" + "="*60)
        print("✅ SUCCESS!")
        print("="*60)
        print(f"\n🎉 Heatmap generated successfully!")
        print(f"📁 Location: {os.path.abspath(output_path)}")
        print(f"🌐 Open this file in your browser to view the interactive map\n")
        
        return output_path
        
    except Exception as e:
        print("\n" + "="*60)
        print("❌ ERROR")
        print("="*60)
        print(f"\n{str(e)}\n")
        raise


def main():
    """Main entry point when run as script"""
    parser = argparse.ArgumentParser(
        description='Generate interactive disease heatmaps for healthcare analytics',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python heatmap_generator.py
  python heatmap_generator.py --input my_data.csv --output my_map.html
  python heatmap_generator.py --input data.json --format json --outbreaks
        """
    )
    
    parser.add_argument(
        '--input', '-i',
        default='data/sample_data.csv',
        help='Input data file (CSV or JSON)'
    )
    
    parser.add_argument(
        '--output', '-o',
        default='output/disease_heatmap.html',
        help='Output HTML file path'
    )
    
    parser.add_argument(
        '--format', '-f',
        choices=['csv', 'json'],
        default='csv',
        help='Input file format'
    )
    
    parser.add_argument(
        '--no-geocoding',
        action='store_true',
        help='Disable Nominatim geocoding (only use pre-mapped cities)'
    )
    
    parser.add_argument(
        '--outbreaks',
        action='store_true',
        help='Enable outbreak detection using clustering'
    )
    
    args = parser.parse_args()
    
    # Run pipeline
    pipeline(
        input_file=args.input,
        output_file=args.output,
        file_format=args.format,
        use_geocoding=not args.no_geocoding,
        detect_outbreaks=args.outbreaks
    )


if __name__ == '__main__':
    main()
