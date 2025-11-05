import http from 'k6/http';
import { check, sleep } from 'k6';
export let options = {
thresholds: {
http_req_failed: ['rate<=0.001'], // ≤0.1%
http_req_duration: ['p(95)<=200'], // p95 ≤ 200ms
},
stages: [
{ duration: '30s', target: 20 },
{ duration: '1m', target: 50 },
{ duration: '2m', target: 100 },
{ duration: '1m', target: 0 },
],
};
const BASE = __ENV.BASE_URL || 'http://localhost:8080';
export default function () {
let res = http.get(`${BASE}/`);
check(res, { 'status 200': r => r.status === 200 });
let h = http.get(`${BASE}/health`);
check(h, { 'health ok': r => r.status === 200 && r.body.includes('"ok"') });
sleep(1);
}
