import sys
import re
import os

def clean_file(path):
    fullpath = os.path.join(r"C:\Users\mdyus\OneDrive\Pictures\Documents\hackathon\health-surveillance-system", path)
    if not os.path.exists(fullpath):
        print(f"Skipping {fullpath}, does not exist")
        return
        
    try:
        with open(fullpath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Specific replacements for GovSurveillance.tsx
        if "GovSurveillance.tsx" in path:
            content = re.sub(r'\s*"COVID-19":\s*"#[0-9a-fA-F]+",', "", content)
            content = re.sub(r'\s*Influenza:\s*"#[0-9a-fA-F]+",', "", content)
        # Specific replacements for icdCodes.ts
        elif "icdCodes.ts" in path:
            content = re.sub(r"\s*\{\s*code:\s*'U07\.1'.*?\},", "", content)
            content = re.sub(r"\s*\{\s*code:\s*'U07\.2'.*?\},", "", content)
            
        # General replacements for mockData.ts and public JSONs
        else:
            content = re.sub(r",\s*'COVID-19':\s*\d+", "", content)
            content = re.sub(r",\s*\"COVID-19\":\s*\d+", "", content)
            content = re.sub(r"\s*'COVID-19':\s*\d+,", "", content)
            content = re.sub(r"\s*\"COVID-19\":\s*\d+,", "", content)
            content = re.sub(r",\s*Influenza:\s*\d+", "", content)
            content = re.sub(r",\s*\"Influenza\":\s*\d+", "", content)
            content = re.sub(r"\s*Influenza:\s*\d+,", "", content)
            content = re.sub(r"\s*\"Influenza\":\s*\d+,", "", content)
            content = re.sub(r",\s*'Influenza A':\s*\d+", "", content)
            content = re.sub(r"\s*'Influenza A':\s*\d+,", "", content)
            
            lines = content.split('\n')
            new_lines = []
            skip = False
            for l in lines:
                if 'disease: \'COVID-19\'' in l or 'disease: \'Influenza A\'' in l:
                    continue
                if 'label: \'COVID-19\'' in l or 'label: \'Influenza A\'' in l:
                    continue
                if 'U07' in l or 'J09' in l:
                    continue
                if '"COVID-19 Sub-variant Monitoring' in l or '"Influenza A Surge' in l:
                    skip = True
                    continue
                if skip and ('}' in l or ']' in l):
                    # just skip block simply in json
                    skip = False
                    continue
                if skip:
                    continue
                if '"disease": "COVID-19"' in l or '"disease": "Influenza A"' in l:
                    # In json arrays we might leave empty {}, handled by formatting but here we just skip lines
                    continue
                    
                new_lines.append(l)
            
            # Simple clean up for empty objects left from line skips
            content = '\n'.join(new_lines)
            content = content.replace("{\n\n            },", "")
            content = content.replace("{\n            },", "")
            content = content.replace("{            },", "")
            
        with open(fullpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Cleaned {path}")
    except Exception as e:
        print(f"Error on {path}: {e}")

files = [
    "src/lib/mockData.ts",
    "public/demo-data/trends.json",
    "public/demo-data/alerts.json",
    "public/demo-data/heatmap.json",
    "public/demo-data/distribution.json",
    "supabase/server_demo_seed.sql",
    "migration.sql",
    "src/data/icdCodes.ts",
    "src/pages/gov/GovSurveillance.tsx",
]

for f in files:
    clean_file(f)
