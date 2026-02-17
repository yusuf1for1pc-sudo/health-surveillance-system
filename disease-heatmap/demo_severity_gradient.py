#!/usr/bin/env python3
"""
QUICK START EXAMPLE - Enhanced Disease Heatmap with Severity Gradient
This demonstrates the upgraded green→yellow→orange→red heatmap
"""

import pandas as pd
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import the heatmap generator
import heatmap_generator

def create_sample_outbreak_data():
    """
    Create sample data showing different severity levels
    This demonstrates how the gradient works
    """
    data = {
        'disease': [
            # Pune - CRITICAL OUTBREAK (will show as RED)
            'Dengue', 'Dengue', 'Dengue', 'Dengue', 'Dengue',
            'Dengue', 'Dengue', 'Dengue', 'Dengue', 'Dengue',
            
            # Mumbai - HIGH (will show as ORANGE)
            'Flu', 'Flu', 'Flu', 'Flu', 'Flu', 'Flu', 'Flu',
            
            # Nagpur - MEDIUM (will show as YELLOW)
            'Malaria', 'Malaria', 'Malaria', 'Malaria',
            
            # Nashik - LOW (will show as GREEN/LIME)
            'Typhoid', 'Typhoid',
        ],
        'city': [
            # Pune cases
            'Pune', 'Pune', 'Pune', 'Pune', 'Pune',
            'Pune', 'Pune', 'Pune', 'Pune', 'Pune',
            
            # Mumbai cases
            'Mumbai', 'Mumbai', 'Mumbai', 'Mumbai', 'Mumbai', 'Mumbai', 'Mumbai',
            
            # Nagpur cases
            'Nagpur', 'Nagpur', 'Nagpur', 'Nagpur',
            
            # Nashik cases
            'Nashik', 'Nashik',
        ],
        'state': ['Maharashtra'] * 23,
        'age_group': ['25-35'] * 23,
        'gender': ['M'] * 23,
        'date': ['2024-02-16'] * 23
    }
    
    df = pd.DataFrame(data)
    
    # Save to CSV
    output_file = 'data/severity_demo.csv'
    df.to_csv(output_file, index=False)
    print(f"\n✅ Created sample data: {output_file}")
    print(f"   - Pune: 10 cases (RED - Critical)")
    print(f"   - Mumbai: 7 cases (ORANGE - High)")
    print(f"   - Nagpur: 4 cases (YELLOW - Medium)")
    print(f"   - Nashik: 2 cases (GREEN - Low)")
    
    return output_file

def main():
    """
    Demo: Generate enhanced heatmap with severity gradient
    """
    print("\n" + "="*70)
    print("  ENHANCED DISEASE HEATMAP DEMO")
    print("  Multi-Color Severity Gradient: GREEN → YELLOW → ORANGE → RED")
    print("="*70)
    
    # Create sample data
    input_file = create_sample_outbreak_data()
    
    # Generate heatmap with severity gradient
    print("\n🔥 Generating heatmap with SEVERITY GRADIENT...")
    output_file = heatmap_generator.pipeline(
        input_file=input_file,
        output_file='output/severity_gradient_demo.html'
    )
    
    print("\n" + "="*70)
    print("✅ DEMO COMPLETE!")
    print("="*70)
    print(f"\n📊 What to look for in the map:")
    print(f"   🔴 Pune area should be RED (10 cases - critical outbreak)")
    print(f"   🟠 Mumbai area should be ORANGE (7 cases - high)")
    print(f"   🟡 Nagpur area should be YELLOW (4 cases - medium)")
    print(f"   🟢 Nashik area should be GREEN (2 cases - low)")
    print(f"\n💡 Compare this to the old blue/purple blur!")
    print(f"\n🌐 Open: {os.path.abspath(output_file)}\n")

if __name__ == '__main__':
    main()
