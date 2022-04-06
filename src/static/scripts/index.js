// Get the water level measurements for the last 24 hours

const config = {
    overallLimit: 0.95,
    juniorsLimit: 0.775,
    universityLimit: 0.65,
    landingStages: 0.44,
    maxWaterLevel: 1.0
};

window.addEventListener('DomContentLoaded', async () => {
    const waterLevelMeasurements = getWaterLevelMeasurements();

    const ctx = document.getElementById('waterLevelChart').getContext('2d');
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: waterLevelMeasurements.map(waterLevelMeasurement => waterLevelMeasurement.timestamp),
            datasets: [{
                label: 'Water level',
                data: waterLevelMeasurements.map(waterLevelMeasurement => waterLevelMeasurement.waterLevel),
                backgroundColor: 'rgba(0, 0, 0, 0)',
                borderColor: 'rgba(0, 0, 0, 1)',
                borderWidth: 1,

            }]
        }
    });
});

async function getWaterLevelMeasurements () {
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
            timestamp: new Date(Date.now() - i * 1000),
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