from opencage.geocoder import OpenCageGeocode
from django.conf import settings

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