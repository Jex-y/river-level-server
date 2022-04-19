
# River Wear Water Level Dashboard

[![Node.js CI](https://github.com/Jex-y/river-level-server/actions/workflows/node.js.yml/badge.svg)](https://github.com/Jex-y/river-level-server/actions/workflows/node.js.yml)
[![CodeQL](https://github.com/Jex-y/river-level-server/actions/workflows/codeql-analysis.yml/badge.svg?branch=main)](https://github.com/Jex-y/river-level-server/actions/workflows/codeql-analysis.yml)
[![Deploy to Amazon ECS](https://github.com/Jex-y/river-level-server/actions/workflows/aws.yml/badge.svg)](https://github.com/Jex-y/river-level-server/actions/workflows/aws.yml)

This repository is a part of a larger project to monitor the river level of the River Wear. The othe components of the project are:

- [Sensor Driver](https://github.com/Jex-y/HC-SR04_driver)
- [IoT client](https://github.com/Jex-y/river-level-client)

The client is designed to be run on a Raspberry Pi Zero W and connects to a HC-SR04 sensor via the GPIO.

The project is deployed at [river-level.edjex.net](https://river-level.edjex.net)

It is designed to:

- Receive water level measurements from and IoT device
- Provide an API to query these measurements
- Display an easily interpretable front end showing the collected data
The project is deployed at
The project is flexible and could be used for any environmental sensor.

## Getting started

To build a local environment use:

```bash
docker-compose build
docker-compose up
```

The server should then be available at `http://localhost`.

Feel free to reach out to me with any issues.
