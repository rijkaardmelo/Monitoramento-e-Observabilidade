const express = require('express');
const server = express();
const port = 7000;

const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
const Registry = client.Registry;
const register = new Registry();

collectDefaultMetrics({ register });

register.setDefaultLabels({
    app: 'nodejs-app'
});

const httpRequestDurationMicroseconds = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in microseconds',
    labelNames: ['method', 'route', 'code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

register.registerMetric(httpRequestDurationMicroseconds)

server.get('/metrics', async (req, res) => {

    const end = httpRequestDurationMicroseconds.startTimer();

    try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
        end({ route: '/metrics', code: res.statusCode, method: req.method })
    } catch (ex) {
        res.status(500).end(ex);
    }
});

server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
});
