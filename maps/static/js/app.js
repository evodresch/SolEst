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

    function updateTableAndChart(data) {
        console.log('Data received for table and chart:', data);

        // Extract the yearly sums data
        const yearlySums = data.yearly_sums;
        console.log('Yearly sums:', yearlySums);

        // Update the table
        const table = document.getElementById('irradiation-table');
        if (table) {
            let tableHeader = '<tr><th>Year</th>';
            let tableRow = '<tr><td>Irradiation (kWh/m²)</td>';

            for (const [year, irradiation] of Object.entries(yearlySums)) {
                tableHeader += `<th>${year}</th>`;
                tableRow += `<td>${irradiation.toFixed()}</td>`;
            }
            tableHeader += '</tr>';
            tableRow += '</tr>';
            table.innerHTML = tableHeader + tableRow;
        }

        // Update the chart
        const ctx = document.getElementById('irradiation-chart').getContext('2d');
        const chartLabels = Object.keys(yearlySums);
        const chartValues = Object.values(yearlySums);

        if (chart) {
            chart.destroy();
        }

        chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'Yearly Irradiation (kWh/m²)',
                    data: chartValues,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)'
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Irradiation (kWh/m²)'
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
                    })
                    .catch(error => console.log('Error:', error));

                // Get the irradiation data
                fetch('/maps/get-irradiation/', {  // Update the URL here
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({'lat': lat, 'lon': lng})
                })
                .then(response => response.text())  // Get the raw response text
                .then(text => {
                    console.log('Raw response text:', text);  // Log the raw response text
                    return JSON.parse(text);  // Attempt to parse it as JSON
                })
                .then(data => {
                    if (data.error) {
                        console.error(data.error);
                        document.getElementById('irradiation-info').innerText = "No irradiation data found.";
                    } else {
                        updateTableAndChart(data);
                    }
                })
                .catch(error => console.error('Error fetching irradiation:', error));
            } else {
                document.getElementById('info').innerHTML = "Please select a location within Germany only.";
            }
        } else {
            console.log('GeoJSON layer is not ready or undefined.');
        }
    });
});
