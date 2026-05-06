import pandas as pd
import glob
import os

# Path to raw data
raw_path = r"C:\Users\91935\DA Projects\capstone_village_api\data_cleaning\raw\*.xls"

files = glob.glob(raw_path)

all_data = []

for file in files:
    print(f"Processing: {file}")
    
    try:
        df = pd.read_excel(file)
        
        # Rename columns
        df.columns = [
            "state_code", "state_name",
            "district_code", "district_name",
            "subdistrict_code", "subdistrict_name",
            "village_code", "village_name"
        ]
        
        all_data.append(df)
    
    except Exception as e:
        print(f"Error in {file}: {e}")

# Combine all files
df = pd.concat(all_data, ignore_index=True)

print("Total rows before cleaning:", len(df))

# ---------------- CLEANING ---------------- #

# Remove invalid rows
df = df[df["village_code"] != 0]

# Remove duplicates
df = df.drop_duplicates()

# Clean text
for col in ["state_name", "district_name", "subdistrict_name", "village_name"]:
    df[col] = df[col].astype(str).str.strip()

print("Total rows after cleaning:", len(df))

# ---------------- SPLIT TABLES ---------------- #

states = df[["state_code", "state_name"]].drop_duplicates()
districts = df[["district_code", "district_name", "state_code"]].drop_duplicates()
subdistricts = df[["subdistrict_code", "subdistrict_name", "district_code"]].drop_duplicates()
villages = df[["village_code", "village_name", "subdistrict_code"]]

# ---------------- SAVE FILES ---------------- #

output_path = r"C:\Users\91935\DA Projects\capstone_village_api\data_cleaning\cleaned"

os.makedirs(output_path, exist_ok=True)

states.to_csv(os.path.join(output_path, "states.csv"), index=False)
districts.to_csv(os.path.join(output_path, "districts.csv"), index=False)
subdistricts.to_csv(os.path.join(output_path, "subdistricts.csv"), index=False)
villages.to_csv(os.path.join(output_path, "villages.csv"), index=False)

print("✅ All cleaned files saved in 'cleaned' folder!")