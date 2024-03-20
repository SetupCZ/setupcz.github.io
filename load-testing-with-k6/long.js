import {sleep, check} from 'k6';
import http from 'k6/http';

export const options = {
    scenarios: {
        constant_load: {
            executor: 'constant-arrival-rate',
            startRate: 0,
            timeUnit: '1s',
            preAllocatedVUs: 10,
            maxVUs: 50,
            rate: 40,
            duration: '5m',
        },
    },
};

export default function () {
    const res = http.get('http://test.k6.io');
    // check(res, {
    //     'is status 200': (r) => r.status === 200,
    //     'verify html content': (r) => r.body.includes('Collection of simple web-pages suitable for load testing'),
    // });
    //
}
