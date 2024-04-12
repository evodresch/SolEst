from django.shortcuts import render

# View for the map page
def map_page(request):
    return render(request, 'maps/map_page.html')