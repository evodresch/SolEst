import os
from .utils import reverse_geocode, get_climate_data
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render
import json


# View for the map page
def map_page(request):
    return render(request, 'maps/map_page.html')


def get_location(request):
    lat = request.GET.get('lat')
    lng = request.GET.get('lng')

    if lat and lng:
        location = reverse_geocode(float(lat), float(lng))
        return JsonResponse({'location': location})
    else:
        return JsonResponse({'error': 'Missing latitude or longitude'}, status=400)


@csrf_exempt
def get_irradiation_temperature(request):
    """
    Retrieve irradiation data using the get_irradiation_data function
    """
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            location = {'latitude': data['lat'], 'longitude': data['lon']}
            climate_data = get_climate_data(location)

            # Get the temperature and irradiation data from the dictionary
            df_irr, yearly_sums_irr, long_term_average_irr = climate_data['irradiation']
            df_temp, yearly_averages_temp, long_term_average_temp = climate_data['temperature']

            # Convert the DataFrames to dictionaries with 'index' orientation
            df_dict_irr = df_irr.to_dict(orient='index')
            yearly_sums_dict_irr = yearly_sums_irr.to_dict()
            df_dict_temp = df_temp.to_dict(orient='index')
            yearly_averages_dict_temp = yearly_averages_temp.to_dict()

            response_data = {'irradiation': df_dict_irr,
                             'yearly_sums_irr': yearly_sums_dict_irr,
                             'long_term_average_irr': long_term_average_irr,
                             'temperature': df_dict_temp,
                             'yearly_averages_temp': yearly_averages_dict_temp,
                             'long_term_average_temp': long_term_average_temp}
            return JsonResponse(response_data)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({"error": "Invalid request method"}, status=405)