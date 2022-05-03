/* global Chart */
/* global moment */

// Get the water level measurements for the last 24 hours

const config = {
    maxWaterLevel: 1.0,
    govStationId: '0240120',
    limits: [
        {
            name: 'Overall Limit',
            limit: 0.95,
        },
        {
            name: 'Juniors Limit',
            limit: 0.775,
        },
        {
            name: 'University Limit',
            limit: 0.65,
        },
        {
            name: 'Landing Stages',
            limit: 0.44,
        },
    ]
};

moment.updateLocale('en', {
    relativeTime: {
        future: 'in %s',
        past: '%s',
        s: 'now',
        ss: '%d secs',
        m: 'a min',
        mm: '%d mins',
        h: 'an hour',
        hh: '%d hours',
        d: 'a day',
        dd: '%d days',
        M: 'a month',
        MM: '%d months',
        y: 'a year',
        yy: '%d years',
    }
});

const MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

window.addEventListener('load', async () => {
    const ctx = document.getElementById('riverLevelChart').getContext('2d');
    // Chart with labels every hour

    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: []
        },
        options: {
            maintainAspectRatio: false,
            scales: {
                y: {
                    max: config.maxWaterLevel,
                    min: 0,
                    ticks: {
                        callback: function (value, _index, _values) {
                            return value.toFixed(2) + 'm';
                        },
                        font: {
                            size: MOBILE ? 8 : 12,
                        }
                    }
                },
                x: {
                    type: 'time',
                    max: new Date(),
                    min: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    time: {
                        unit: 'hour',
                        unitStepSize: 1,
                        displayFormats: {
                            hour: 'HH:mm'
                        },
                    },
                    ticks: {
                        font: {
                            size: MOBILE ? 8 : 12,
                        }
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
                },
                annotation: {
                    annotations: config.limits.map((limit) => ({
                        type: 'line',
                        mode: 'horizontal',
                        scaleID: 'y',
                        value: limit.limit,
                        borderWidth: 2,
                        label: {
                            content: limit.name,
                            enabled: true,
                            position: 'start',
                            font: {
                                size: MOBILE ? 8 : 12,
                            },
                        }
                    }))
                },
                legend: {
                    position: 'bottom',
                    align: 'center',
                    labels: {
                        font: {
                            size: MOBILE ? 8 : 12,
                        }
                    }
                }
            }
        }
    });

    // TODO: Make promises so can await them and send api calls without race conditions, put in global scope
    // TODO: Make update card function

    const lastestCard = makeCard(
        'Latest',
        [
            {
                name: 'Level',
                id: 'latestLevel',
                text: '-',
            },
            {
                name: 'Time',
                id: 'latestTime',
                text: '-',
            },
            {
                name: 'Age',
                id: 'latestAge',
                text: '-'
            }
        ]);
        
    const summaryCard = makeCard(
        'Summary',
        [
            {
                name: 'Average',
                id: 'averageLevel',
                text: '-',
            },
            {
                name: 'Min',
                id: 'minLevel',
                text: '-',
            },
            {
                name: 'Max',
                id: 'maxLevel',
                text: '-',
            }
        ]
    );

    getApiEndpoint('/api/waterLevelMeasurement/last24Hours')
        .then((data) => {
            if (data.waterLevelMeasurements.length > 0) {
                chart.data.datasets.push({
                    label: 'Data from sensor',
                    data: data.waterLevelMeasurements.map(measurement => ({
                        y: measurement.waterLevel,
                        x: measurement.timestamp
                    })),
                    lineTension: 0,
                    borderColor: '#0FF4C6',
                    pointRadius: 0,
                    pointHitRadius: 5,
                });
                chart.update();
                let latestMeasurement = data.waterLevelMeasurements[data.waterLevelMeasurements.length - 1];
                updateLatestLevel(latestMeasurement.waterLevel, latestMeasurement.timestamp);

                document.getElementById('averageLevel').innerText = data.summary.average.toFixed(2) + 'm';
                document.getElementById('minLevel').innerText = data.summary.min.toFixed(2) + 'm';
                document.getElementById('maxLevel').innerText = data.summary.max.toFixed(2) + 'm';
            }
        });

    getApiEndpoint(`https://environment.data.gov.uk/flood-monitoring/id/stations/${config.govStationId}/readings?since=${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}&_sorted`)
        .then((data) => {
            const measurements = data.items;
            chart.data.datasets.push({
                label: 'Data from Environment Agency',
                data: measurements.map(measurement => ({
                    y: measurement.value,
                    x: measurement.dateTime
                })),
                lineTension: 0,
                borderColor: '#FF01FB',
                pointRadius: 0,
                pointHitRadius: 5,
            });
            chart.update();
            let latestMeasurement = measurements[0];
            updateLatestLevel(latestMeasurement.value, latestMeasurement.dateTime);
        });
    
});

async function getApiEndpoint(url) {
    const options = {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
    };
    
    return fetch(url, options).then(response => {
        if (response.status === 200) {
            return response.json();
        }
        else {
            return response.json().then(error => {
                console.error(error);
            });
        }
    });
}

function updateLatestLevel(level, time) {
    if (!updateLatestLevel.latestTime || time > updateLatestLevel.latestTime) {
        updateLatestLevel.latestTime = time;

        document.getElementById('latestLevel').innerText = level.toFixed(2) + 'm';
        document.getElementById('latestTime').innerText = moment(time).format('HH:mm');
        document.getElementById('latestAge').innerText = moment(time).fromNow(false);
        
    }

}

function _makeAttributeHTML(id, name, value='-') {
    if (!id || !name) {
        return '';
    }

    return `
    <div class="row">
        <div class="col">
            <p>${name}:</p>
        </div>
        <div class="col text-nowrap">
            <p id=${id}>${value}</p>
        </div>
    </div>
    `;
}

function _makeCardHTML(title='', attributes=[]) {

    const attributesHTML = attributes
        .map(attribute => _makeAttributeHTML(attribute.id, attribute.name, attribute.text))
        .join('\n');

    return `
    <div class="card info-card bg-dark shadow-lg">
        <div class="card-body">
            <h5 class="card-title">${title}</h5>
            <hr class="mt-2"/>
            <p class="card-text">
            ${attributesHTML}
            </p>
        </div>
    </div>
    `;
}

function makeCard(title, attributes) {
    const card = document.createElement('div');
    card.classList.add('col-lg-2');
    card.innerHTML = _makeCardHTML(title, attributes);
    document.querySelector('#grid').appendChild(card);
}