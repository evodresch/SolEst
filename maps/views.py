from django.shortcuts import render
from .utils import reverse_geocode
from django.http import JsonResponse


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