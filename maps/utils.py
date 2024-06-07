from opencage.geocoder import OpenCageGeocode
import numpy as np
import pandas as pd
from osgeo import gdal
from pyproj import Transformer
import os
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

# Turn exceptions of gdal off
gdal.DontUseExceptions()

# Check if the settings have been configured correctly
try:
    dwd_data_dir = settings.DWD_DATA_GLOBAL_IRR_DIR
except ImproperlyConfigured:
    # Configure settings manually here if needed
    import django

    # Set the default Django settings module
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'solest_project.settings')

    # Import the project module
    import solest_project
    django.setup()

# Get the name of town from the coordinates
def reverse_geocode(lat, lng):
    geocoder = OpenCageGeocode(settings.OPENCAGE_API_KEY)
    query = f"{lat}, {lng}"
    results = geocoder.reverse_geocode(lat, lng)
    if results and len(results) > 0:
        # Only get the PLZ and municipality name
        address = results[0]['formatted'].split(',')[-2]
        return address
    else:
        return "No location found"

def get_climate_data(location):
    """
    Extract irradiation and temperature data for a specific location and return as two DataFrames.

    Args:
        location (dict): A dictionary containing 'latitude' and 'longitude'.

    Returns:
        climate_data (dict): Dictionary with two keys (irradiation and temperature) years as columns and months as
        indexes, including a sum for the whole year (irradiation) or an average (temperature) and long-term averages
        for the data.
    """
    transformer = Transformer.from_crs("EPSG:4326", "EPSG:31467", always_xy=True)
    x, y = transformer.transform(location['longitude'], location['latitude'])

    # Results dictionary
    climate_data = {}

    # Dictionary to temporarily gather the data before converting them to a dataframe
    data_dict = {}

    # Global irradiation
    for file_name in os.listdir(settings.DWD_DATA_GLOBAL_IRR_DIR):
        if file_name.endswith(".tif"):
            # Get the year and month from the filename
            year_month = file_name.split('_')[-1].split('.')[0]
            year, month = int(year_month[:4]), int(year_month[4:])

            file_path = os.path.join(settings.DWD_DATA_GLOBAL_IRR_DIR, file_name)
            dataset = gdal.Open(file_path)
            if not dataset:
                continue

            band = dataset.GetRasterBand(1)
            array = band.ReadAsArray()
            array_data = np.where(array == -999, np.nan, array)
            gt = dataset.GetGeoTransform()
            x_offset = int((x - gt[0]) / gt[1])
            y_offset = int((y - gt[3]) / -gt[5])

            if x_offset < 0 or y_offset < 0 or x_offset >= dataset.RasterXSize or y_offset >= dataset.RasterYSize:
                data_dict.setdefault(year, {})[month] = None
            else:
                value = np.round(float(array_data[-y_offset, x_offset]), 1)
                data_dict.setdefault(year, {})[month] = value if value is not None else None
    df = pd.DataFrame(data_dict).T

    # Transpose to get months as row indexes and years as columns and sort indexes/columns
    df = df.T
    df = df.sort_index()
    df = df[sorted(df.columns)]
    df.loc['Yearly Sum',:] = df.sum(axis=0)
    df = df.round(1)

    # Get only yearly sums for the bar chart
    yearly_sums = df.loc['Yearly Sum',:]

    # Get the long term average
    long_term_average = np.round(np.mean(yearly_sums), 1)

    # Gather irradiation data for the results dict
    climate_data['irradiation'] = [df, yearly_sums, long_term_average]

    # Temperature
    for file_name in os.listdir(settings.DWD_DATA_AMBIENT_TEMPERATURE_DIR):
        if file_name.endswith(".tif"):
            # Get the year and month from the filename
            year_month = file_name.split('_')[-1].split('.')[0]
            year, month = int(year_month[:4]), int(year_month[4:])

            file_path = os.path.join(settings.DWD_DATA_AMBIENT_TEMPERATURE_DIR, file_name)
            dataset = gdal.Open(file_path)
            if not dataset:
                continue

            band = dataset.GetRasterBand(1)
            array = band.ReadAsArray()
            array_data = np.where(array == -999, np.nan, array)
            gt = dataset.GetGeoTransform()
            x_offset = int((x - gt[0]) / gt[1])
            y_offset = int((y - gt[3]) / -gt[5])

            if x_offset < 0 or y_offset < 0 or x_offset >= dataset.RasterXSize or y_offset >= dataset.RasterYSize:
                data_dict.setdefault(year, {})[month] = None
            else:
                value = np.round(float(array_data[-y_offset, x_offset]), 1)
                data_dict.setdefault(year, {})[month] = value if value is not None else None
    df = pd.DataFrame(data_dict).T

    # Transpose to get months as row indexes and years as columns and sort indexes/columns
    df = df.T
    df = df.sort_index()
    df = df[sorted(df.columns)]
    df.loc['Yearly Average',:] = df.mean(axis=0)
    df = df.round(1)

    # Get only yearly averages for the bar chart
    yearly_averages = df.loc['Yearly Average',:]

    # Get the long term average
    long_term_average = np.round(np.mean(yearly_averages), 1)

    # Gather temperature data
    climate_data['temperature'] = [df, yearly_averages, long_term_average]

    return climate_data
