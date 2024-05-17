from django.test import TestCase
from maps.utils import get_irradiation_data
from pandas import DataFrame

class GetIrradiationDataTests(TestCase):
    def test_get_irradiation_data(self):
        # Define a test location (latitude and longitude)
        test_location = {'latitude': 48.0, 'longitude': 8.0}

        # Call the function to get the irradiation data
        result, yearly_sums = get_irradiation_data(test_location)

        # Add assertions to check the expected output
        # Example check: Assert that the function returns a dictionary
        self.assertIsInstance(result, DataFrame)

        expected_years = [1994, 2023]
        for year in expected_years:
            self.assertIn(year, result.columns)

        # Example check: Assert that the DataFrame contains expected months (1-12)
        for month in range(1, 13):
            self.assertIn(month, result.index)

        # Example check: Assert that the yearly sums are plausible (>700 kWh/m2)
        for value in result.loc['Yearly Sum',:]:
            self.assertGreater(value, 500, 'Unplausibly low yearly sum')