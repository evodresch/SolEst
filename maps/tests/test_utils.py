from django.test import TestCase
from maps.utils import get_climate_data
from pandas import DataFrame


class GetClimateDataTests(TestCase):
    def test_get_climate_data(self):
        # Define a test location (latitude and longitude)
        test_location = {'latitude': 48.0, 'longitude': 8.0}

        # Call the function to get the climate data
        climate_data = get_climate_data(test_location)

        # Get the separate data from the dictionary
        result_irr = climate_data['irradiation'][0]
        result_temp = climate_data['temperature'][0]

        # Add assertions to check the expected output
        self.assertIsInstance(climate_data, dict)

        expected_years = [1994, 2023]
        for year in expected_years:
            self.assertIn(year, result_irr.columns)
            self.assertIn(year, result_temp.columns)

        for month in range(1, 13):
            self.assertIn(month, result_irr.index)
            self.assertIn(month, result_temp.index)

        for value in result_irr.loc['Yearly Sum',:]:
            self.assertGreater(value, 500, 'Implausibly low yearly sum')

        for value in result_temp.loc['Yearly Average',:]:
            self.assertGreater(value, 5, 'Implausibly low average temperature')
            self.assertLess(value, 20, 'Implausibly high average temperature')
