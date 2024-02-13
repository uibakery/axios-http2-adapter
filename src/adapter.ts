import {
  AxiosAdapter,
  AxiosPromise,
  getAdapter,
  InternalAxiosRequestConfig,
} from 'axios';
import * as http2 from 'http2-wrapper';
import { wrap } from 'follow-redirects';

export interface HTTP2AdapterConfig {
  // configure custom agent https://github.com/szmarczak/http2-wrapper?tab=readme-ov-file#new-http2agentoptions
  agent?: http2.Agent;
  // force http2 without alpn check
  force?: boolean;
}

export function createHTTP2Adapter(
  adapterConfig: Partial<HTTP2AdapterConfig> = {}
): AxiosAdapter {
  return (config: InternalAxiosRequestConfig) =>
    http2Adapter(config, adapterConfig);
}

async function http2Adapter(
  config: InternalAxiosRequestConfig,
  adapterConfig: Partial<HTTP2AdapterConfig>
): AxiosPromise<unknown> {
  const adapter: AxiosAdapter = getAdapter('http');

  if (await shouldUseHTTP2(config, adapterConfig)) {
    const http2Config: InternalAxiosRequestConfig = createHTTP2Config(
      config,
      adapterConfig
    );
    return adapter(http2Config);
  } else {
    return adapter(config);
  }
}

async function shouldUseHTTP2(
  config: InternalAxiosRequestConfig,
  adapterConfig: Partial<HTTP2AdapterConfig>
): Promise<boolean> {
  if (adapterConfig.force) {
    return true;
  }
  return await isHTTP2Supported(config);
}

async function isHTTP2Supported(
  config: InternalAxiosRequestConfig
): Promise<boolean> {
  const lowercasedUrl = config.url.toLowerCase();
  const lowercasedBaseURL = config.baseURL?.toLowerCase();

  let url:URL;
  if (lowercasedUrl.startsWith('http:') || lowercasedUrl.startsWith('https:')) {
    // config.url has a higher priority than config.baseURL
    url = new URL(config.url);
  } else if (config.baseURL && (lowercasedBaseURL.startsWith('http:') || lowercasedBaseURL.startsWith('https:'))) {
    url = new URL(config.baseURL + config.url);
  } else {
    // failed to find a valid url
    throw new Error('Invalid URL: ' + config.url + ' or baseURL: ' + config.baseURL);
  }

  // HTTP2 doesn't support not secured connection.
  if (!url.protocol.startsWith('https:')) {
    return false;
  }

  try {
    const res: http2.ResolveProtocolResult = await http2.auto.resolveProtocol({
      host: url.host,
      servername: url.hostname,
      port: url.port || 443,
      ALPNProtocols: ['h2', 'http/1.1'],
      rejectUnauthorized: false,
    });

    return res.alpnProtocol === 'h2';
  } catch (e) {
    return false;
  }
}

function createHTTP2Config(
  config: InternalAxiosRequestConfig,
  adapterConfig: Partial<HTTP2AdapterConfig>
): InternalAxiosRequestConfig {
  const requestWrappedWithRedirects = wrap({
    https: {
      request: (options: http2.ClientRequest, handleResponse) => {
        if (adapterConfig.agent) {
          // @ts-expect-error Typing are not aware of agent prop, but it actually works
          // https://github.com/szmarczak/http2-wrapper?tab=readme-ov-file#new-http2agentoptions
          options.agent = adapterConfig.agent;
        }

        const req: http2.ClientRequest = http2.request(options, handleResponse);

        const origOn = req.on.bind(req);
        // Omit the socket.setKeepAlive axios action, as HTTP/2 sockets should not be manipulated directly.
        req.on = (name: string, ...args: unknown[]) => {
          if (name != 'socket') {
            return origOn(name, ...args);
          }
          return req;
        };
        return req;
      },
    },
  });

  return { ...config, transport: requestWrappedWithRedirects.https };
}
