from django.urls import path
from .views import map_page, get_location, get_irradiation_temperature

urlpatterns = [
    path('get-location/', get_location, name='get_location'),
    path('get-irradiation-temperature/', get_irradiation_temperature, name='get_irradiation_temperature')
]