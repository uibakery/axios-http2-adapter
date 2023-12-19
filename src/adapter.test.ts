import express from 'express';
import axios, { AxiosInstance } from 'axios';
import { createHTTP2Adapter } from './adapter';
import http from 'http';

describe('HTTP2 Adapter for Axios', () => {
  let axiosInstance: AxiosInstance;
  let http1Server: http.Server;

  beforeAll(() => {
    http1Server = createHttp1MockServer(3001);
  });

  beforeEach(() => {
    axiosInstance = axios.create({ adapter: createHTTP2Adapter() });
  });

  afterAll(() => {
    http1Server.close();
  });

  it('should make a successful HTTP/2 request', async () => {
    const response = await axiosInstance.get('https://google.com');
    expect(response.headers[':status']).toEqual('200');
  });

  it('should fallback to HTTP/1.1 if HTTP/2 is not supported', async () => {
    const axiosInstance = axios.create({
      adapter: createHTTP2Adapter(),
    });

    const response = await axiosInstance.get('http://localhost:3001');
    expect(response.data).toBe('HTTP/1.1 Response');
    expect(response.status).toBe(200);
  });
});

export function createHttp1MockServer(port: number): http.Server {
  const app = express();
  app.get('/', (req, res) => res.send('HTTP/1.1 Response'));

  return app.listen(port);
}
