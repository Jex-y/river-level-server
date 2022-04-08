/* global Chart */
/* global moment */

// Get the water level measurements for the last 24 hours

const config = {
    overallLimit: 0.95,
    juniorsLimit: 0.775,
    universityLimit: 0.65,
    landingStages: 0.44,
    maxWaterLevel: 1.0,
    govStationId: '0240120'
};

window.addEventListener('load', async () => {
    const ctx = document.getElementById('riverLevelChart').getContext('2d');
    // Chart with labels every hour

    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: []
        },
        options: {
            scales: {
                yAxes: {
                    max: config.maxWaterLevel,
                    min: 0,
                    ticks: {
                        callback: function(value, index, values) {
                            return value.toFixed(2);
                        }
                    }
                },
                xAxes: {
                    type: 'time',
                    max: new Date(),
                    min: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    time: {
                        unit: 'hour',
                        unitStepSize: 1,
                        displayFormats: {
                            hour: 'HH:mm'
                        },
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            return moment(context.raw.x).format('HH:mm') + ' - ' + context.raw.y.toFixed(2) + 'm';
                        },
                        title: (items) => {
                            return items[0].dataset.label;
                        }
                    }
                }
            }
        }
    });

    getWaterLevelMeasurements().then((measurements) => {
        chart.data.datasets.push({
            label: 'Data from sensor',
            data: measurements.map(measurement => ({
                y: measurement.waterLevel,
                x: measurement.timestamp
            })),
            lineTension: 0,
        });
        chart.update();
    });

    getMeasurementsFromGovAPI().then((data) => {
        const measurements = data.items;
        chart.data.datasets.push({
            label: 'Data from flooding API',
            data: measurements.map(measurement => ({
                y: measurement.value,
                x: measurement.dateTime
            })),
        });
        chart.update();
    });
});

async function getWaterLevelMeasurements() {
    const url = '/api/waterLevelMeasurement/last24hours';
    const options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const dummyData = [];
    const n = 100;
    let last = Math.random() * config.maxWaterLevel;
    for (let i = 0; i < n; i++) {
        let next = Math.max(0, Math.min(last + (Math.random() - 0.5) * 0.1, config.maxWaterLevel));
        dummyData.push({
            timestamp: new Date(Date.now() - (i/n) * 24 * 60 * 60 * 1000),
            waterLevel: next
        });
        last = next;
    }
    return dummyData;

    // return fetch(url, options)
    //     .then(response => {
    //         if (response.status === 200) {
    //             return response.json();
    //         } else {
    //             return response.json().then(error => {
    //                 console.error(error);
    //             });
    //         }
    //     });
}

async function getMeasurementsFromGovAPI() {
    // Get last 24 hours of data
    const url = `https://environment.data.gov.uk/flood-monitoring/id/stations/${config.govStationId}/readings?since=${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}`;
    
    const options = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    };

    return fetch(url, options)
        .then(response => {
            if (response.status === 200) {
                return response.json();
            } else {
                return response.json().then(error => {
                    console.error(error);
                });
            }
        });
}