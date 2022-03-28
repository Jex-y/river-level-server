
# River Level Server

[![Node.js CI](https://github.com/Jex-y/river-level-server/actions/workflows/node.js.yml/badge.svg)](https://github.com/Jex-y/river-level-server/actions/workflows/node.js.yml)
[![CodeQL](https://github.com/Jex-y/river-level-server/actions/workflows/codeql-analysis.yml/badge.svg?branch=main)](https://github.com/Jex-y/river-level-server/actions/workflows/codeql-analysis.yml)
[![Deploy to Amazon ECS](https://github.com/Jex-y/river-level-server/actions/workflows/aws.yml/badge.svg)](https://github.com/Jex-y/river-level-server/actions/workflows/aws.yml)

The project is deployed at [river-level.edjex.net](http://river-level.edjex.net)
It is designed to:

- Receive water level measurements from and IoT device
- Provide an API to query these measurements
- Display an easily interpretable front end showing the collected data

## Getting started

To build a local environment use:

```
docker-compose build
docker-compose up
```

The server should then be available at `http://localhost`.

Feel free to reach out to me with any issues.
