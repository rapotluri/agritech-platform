#!/usr/bin/env python3
"""
Excel to Parquet Converter for Weather Data
Converts Excel files to Parquet format for improved performance in optimization.
"""

import os
import pandas as pd
import glob
from pathlib import Path
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def convert_excel_to_parquet():
    """
    Convert all Excel files in the precipitation/Cambodia directory to Parquet format.
    """
    # Define paths
    excel_dir = Path("files/temperature/Cambodia")
    parquet_dir = Path("climate_data/temperature/Cambodia")
    
    # Create output directory if it doesn't exist
    parquet_dir.mkdir(parents=True, exist_ok=True)
    
    # Find all Excel files
    excel_files = glob.glob(str(excel_dir / "*.xlsx"))
    
    if not excel_files:
        logger.error(f"No Excel files found in {excel_dir}")
        return
    
    logger.info(f"Found {len(excel_files)} Excel files to convert")
    
    converted_count = 0
    error_count = 0
    
    for excel_file in excel_files:
        try:
            # Get filename without extension
            filename = Path(excel_file).stem
            parquet_file = parquet_dir / f"{filename}.parquet"
            
            logger.info(f"Converting {filename}.xlsx...")
            
            # Read Excel file
            df = pd.read_excel(excel_file, parse_dates=['Date'])
            
            # Validate data
            if 'Date' not in df.columns:
                logger.warning(f"Skipping {filename}: No 'Date' column found")
                continue
                
            if df.empty:
                logger.warning(f"Skipping {filename}: Empty dataframe")
                continue
            
            # Convert Date column to datetime if needed
            df['Date'] = pd.to_datetime(df['Date'])
            
            # Sort by date to ensure chronological order
            df = df.sort_values('Date')
            
            # Save as Parquet
            df.to_parquet(parquet_file, index=False, compression='snappy')
            
            # Verify the file was created and can be read
            test_df = pd.read_parquet(parquet_file)
            if len(test_df) == len(df):
                logger.info(f"✓ Successfully converted {filename}.xlsx ({len(df)} rows)")
                converted_count += 1
            else:
                logger.error(f"✗ Data mismatch for {filename}")
                error_count += 1
                
        except Exception as e:
            logger.error(f"✗ Error converting {filename}: {str(e)}")
            error_count += 1
    
    # Summary
    logger.info(f"\n=== CONVERSION SUMMARY ===")
    logger.info(f"Total files processed: {len(excel_files)}")
    logger.info(f"Successfully converted: {converted_count}")
    logger.info(f"Errors: {error_count}")
    logger.info(f"Output directory: {parquet_dir.absolute()}")
    
    if converted_count > 0:
        logger.info(f"\nParquet files are ready for use!")
        logger.info(f"Update _get_weather_data() to use: {parquet_dir}/{{province}}.parquet")

def validate_parquet_files():
    """
    Validate that all converted Parquet files can be read correctly.
    """
    parquet_dir = Path("climate_data/precipitation/Cambodia")
    
    if not parquet_dir.exists():
        logger.error(f"Parquet directory {parquet_dir} does not exist")
        return
    
    parquet_files = glob.glob(str(parquet_dir / "*.parquet"))
    
    if not parquet_files:
        logger.error(f"No Parquet files found in {parquet_dir}")
        return
    
    logger.info(f"Validating {len(parquet_files)} Parquet files...")
    
    for parquet_file in parquet_files:
        try:
            filename = Path(parquet_file).stem
            df = pd.read_parquet(parquet_file)
            
            # Basic validation
            if 'Date' not in df.columns:
                logger.warning(f"⚠ {filename}: Missing 'Date' column")
                continue
                
            if df.empty:
                logger.warning(f"⚠ {filename}: Empty dataframe")
                continue
            
            # Check date range
            date_range = df['Date'].agg(['min', 'max'])
            commune_count = len([col for col in df.columns if col != 'Date'])
            
            logger.info(f"✓ {filename}: {len(df)} rows, {commune_count} communes, "
                       f"date range: {date_range['min'].strftime('%Y-%m-%d')} to {date_range['max'].strftime('%Y-%m-%d')}")
            
        except Exception as e:
            logger.error(f"✗ Error validating {filename}: {str(e)}")

if __name__ == "__main__":
    print("=== Excel to Parquet Converter ===")
    print("This script converts weather data Excel files to Parquet format for improved performance.")
    print()
    
    # Check if we're in the right directory
    if not Path("files/precipitation/Cambodia").exists():
        print("Error: Please run this script from the backend directory")
        print("Expected path: backend/files/precipitation/Cambodia")
        exit(1)
    
    # Convert files
    convert_excel_to_parquet()
    
    print("\n=== Validation ===")
    validate_parquet_files()
    
    print("\n=== Next Steps ===")
    print("1. Update _get_weather_data() in insure_smart_premium_calc.py")
    print("2. Test the new Parquet format")
    print("3. Remove this script after successful migration") 