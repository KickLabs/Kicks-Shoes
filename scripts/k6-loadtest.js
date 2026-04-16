import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '3m', target: 200 },
    { duration: '2m', target: 250 },
    { duration: '2m', target: 0 },
  ],
};

const targetUrl = __ENV.TARGET_URL || 'http://localhost:3000/api/health';

export default function () {
  const response = http.get(targetUrl);
  check(response, {
    'status is 200-399': r => r.status >= 200 && r.status < 400,
  });
  sleep(0.2);
}
