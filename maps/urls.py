from django.urls import path
from .views import map_page, get_location, get_irradiation

urlpatterns = [
    path('get-location/', get_location, name='get_location'),
    path('get-irradiation/', get_irradiation, name='get_irradiation')
]