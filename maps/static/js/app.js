document.addEventListener('DOMContentLoaded', function () {
    var map = L.map('mapid').setView([51.1657, 10.4515], 5); // Center map on Germany
    var germanyLayer; // The layer with the German territory

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    // Fetch and add GeoJSON layer of Germany
    fetch('/static/data/3_mittel.geo.json')
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            germanyLayer = L.geoJSON(data, {
                style: function (feature) {
                    return {
                        fillColor: '#ff7800',  // Color of the fill
                        fillOpacity: 0.1,      // Transparency of the fill
                        color: '#000',         // Color of the border
                        weight: 1,             // Thickness of the border
                        opacity: 0.8           // Transparency of the border
                    };
                }
            }).addTo(map);
        });

    let chart;

    function updateTableAndChart(data, type) {
        console.log('Data received for table and chart:', data);

        // Extract the yearly sums data
        const yearlySums = data.yearly_sums_irr;
        const yearlyAveragesTemp = data.yearly_averages_temp;

        // Extract the mean irradiation value
        const meanIrradiation = data.long_term_average_irr.toFixed(1);
        const meanTemperature = data.long_term_average_temp.toFixed(1);
        console.log('Mean Irradiation:', meanIrradiation);
        console.log('Mean Temperature:', meanTemperature);

        // Update the table
        const table = document.getElementById('climate-table');
        if (table) {
            let tableRows = '<tr><th>Variable</th><th>Value</th></tr>';
            tableRows += `<tr><td>Average horizontal irradiation (1994-2023)</td><td>${meanIrradiation} kWh/m²</td></tr>`;
            tableRows += `<tr><td>Average temperature (1994-2023)</td><td>${meanTemperature} °C</td></tr>`;
            table.innerHTML = tableRows;
        }

        // Update the chart
        const ctx = document.getElementById('chart').getContext('2d');
        const chartLabels = Object.keys(type === 'irradiation' ? yearlySums : yearlyAveragesTemp);
        const chartValues = Object.values(type === 'irradiation' ? yearlySums : yearlyAveragesTemp);

        if (chart) {
            chart.destroy();
        }

        // Define colors for the bars
        const colors = type === 'irradiation' ? 'rgba(255, 180, 27, 0.5)' : 'rgba(54, 162, 235, 0.5)'; // Change colors as needed

        chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: type === 'irradiation' ? 'Yearly Global Horizontal Irradiation (kWh/m²)' : 'Yearly Average Temperature (°C)',
                    data: chartValues,
                    backgroundColor: colors, // Set the bar colors here
                    borderColor: type === 'irradiation' ? 'rgba(255, 180, 27, 1)' : 'rgba(54, 162, 235, 1)', // Optional: border color
                    borderWidth: 1 // Optional: border width
                }]
            },
            options: {
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: type === 'irradiation' ? 'DWD Yearly Global Horizontal Irradiation (kWh/m²)' : 'DWD Yearly Average Temperature (°C)',
                        align: 'start'
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return context.raw.toFixed(1) + (type === 'irradiation' ? ' kWh/m²' : ' °C');
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: type === 'irradiation' ? 'Irradiation (kWh/m²)' : 'Temperature (°C)',
                            position: 'left'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Year'
                        }
                    }
                }
            }
        });
    }

    function fetchDataAndUpdate(lat, lng, type) {
        fetch('/maps/get-irradiation-temperature/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 'lat': lat, 'lon': lng })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error(data.error);
                document.getElementById('info').innerText = "No climate data found.";
            } else {
                updateTableAndChart(data, type);
            }
        })
        .catch(error => console.error('Error fetching climate data:', error));
    }

    map.on('click', function(e) {
        if (germanyLayer) {
            var clickPoint = turf.point([e.latlng.lng, e.latlng.lat]); // Create a point for the click location
            var features = germanyLayer.toGeoJSON();
            var isWithinGermany = false;

            if (features.type === 'FeatureCollection') {
                features.features.forEach(function(feature) {
                    if (turf.booleanPointInPolygon(clickPoint, feature.geometry)) {
                        isWithinGermany = true;
                    }
                });
            }

            if (isWithinGermany) {
                var coord = e.latlng;
                var lat = coord.lat.toFixed(2);
                var lng = coord.lng.toFixed(2);
                console.log('Fetching location for:', lat, lng);  // Log fetching operation
                fetch(`/maps/get-location/?lat=${lat}&lng=${lng}`)
                    .then(response => response.json())
                    .then(data => {
                        document.getElementById('info').innerHTML = "Last selected location";
                        document.getElementById('coordinates').innerHTML = "Latitude: " + lat + ", Longitude: " + lng;
                        document.getElementById('town_name').innerHTML = "Nearest town/city: " + data.location;
                        document.getElementById('subtitle').innerHTML = "<h3>Climate data for location</h3>";
                        document.getElementById('controls').innerHTML = `
                            <label for="data-type">Choose data type to be displayed on graph:</label>
                            <select id="data-type">
                                <option value="irradiation">Irradiation</option>
                                <option value="temperature">Temperature</option>
                            </select>
                        `;
                        document.getElementById('data-type').addEventListener('change', function() {
                            fetchDataAndUpdate(lat, lng, this.value);
                        });

                        fetchDataAndUpdate(lat, lng, 'irradiation');
                    })
                    .catch(error => console.log('Error:', error));
            } else {
                document.getElementById('info').innerHTML = "Please select a location within Germany only.";
            }
        } else {
            console.log('GeoJSON layer is not ready or undefined.');
        }
    });
});
