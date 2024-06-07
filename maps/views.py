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
def get_irradiation(request):
    """
    Retrieve irradiation data using the get_irradiation_data function
    """
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            location = {'latitude': data['lat'], 'longitude': data['lon']}
            df, yearly_sums, long_term_average = get_irradiation_data(location)

            # Convert the DataFrame to a dictionary with 'index' orientation
            df_dict = df.to_dict(orient='index')
            yearly_sums_dict = yearly_sums.to_dict()

            response_data = {'irradiation': df_dict,
                             'yearly_sums': yearly_sums_dict,
                             'long_term_average': long_term_average}
            return JsonResponse(response_data)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({"error": "Invalid request method"}, status=405)