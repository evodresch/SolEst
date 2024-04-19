from django.urls import path
from .views import map_page, get_location

urlpatterns = [
    path('get-location/', get_location, name='get_location')
]