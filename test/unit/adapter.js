import assert from 'assert';
import express from 'express';
import axios from 'axios';
import createHTTP2Adapter from '../../lib/adapter.js';

describe('HTTP2 Adapter for Axios', function () {
    let axiosInstance;
    let http1Server;

    before(function () {
        const app = express();
        app.get('/', (req, res) => res.send('HTTP/1.1 Response'));
    
        http1Server  = app.listen(3001);
    });

    beforeEach(function () {
        axiosInstance = axios.create({ adapter: createHTTP2Adapter() });
    });

    after(function (done) {
        http1Server.close(done);
    });

    it('should make a successful HTTP/2 request', async function () {
        const response = await axiosInstance.get('https://google.com');

        // HTTP/2 responses sometimes use ':status' in headers
        const status = response.headers[':status'] || response.status;
        assert.strictEqual(status, '200');
    });

    it('should fallback to HTTP/1.1 if HTTP/2 is not supported', async function () {
        const axiosInstance = axios.create({
            adapter: createHTTP2Adapter(),
        });

        const response = await axiosInstance.get('http://localhost:3001');
        assert.strictEqual(response.data, 'HTTP/1.1 Response');
        assert.strictEqual(response.status, 200);
    });
});
