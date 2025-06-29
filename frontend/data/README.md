# Data Folder

This folder contains static data files used by the frontend application.

## Structure

- `cambodia_provinces_communes.json` - Contains all provinces and communes data for Cambodia extracted from precipitation Excel files

## Usage

These JSON files are imported directly into React components for dropdown options and other UI elements.

## Future Countries

When adding data for other countries, follow the same naming convention:
- `{country}_provinces_communes.json` - For province/commune data
- `{country}_cities.json` - For city data (if needed)
- etc.

## Data Generation

The Cambodia data was generated using the `extract_provinces_communes.py` script in the root directory, which processes Excel files from `backend/files/precipitation/Cambodia/`. 