'use strict';

import { getAdapter } from 'axios';
import * as http2 from 'http2-wrapper';
import { wrap } from 'follow-redirects';

/**
 * @typedef {Object} HTTP2AdapterConfig
 * @property {import('http2-wrapper').Agent} [agent] - Optional custom HTTP/2 agent.
 * @property {boolean} [force] - Whether to force HTTP/2 usage without ALPN negotiation.
 */

/**
 * Creates an Axios adapter that conditionally uses HTTP/2.
 *
 * @param {Partial<HTTP2AdapterConfig>} [adapterConfig={}] - Optional configuration for HTTP/2.
 * @returns {import('axios').AxiosAdapter} The Axios adapter function.
 */
function createHTTP2Adapter(adapterConfig = {}) {
    return (config) => http2Adapter(config, adapterConfig);
}

/**
 * Axios adapter that determines whether to use HTTP/2 or fallback to HTTP/1.1.
 *
 * @param {import('axios').InternalAxiosRequestConfig} config - Axios request config.
 * @param {Partial<HTTP2AdapterConfig>} adapterConfig - HTTP/2 adapter configuration.
 * @returns {Promise<import('axios').AxiosPromise<unknown>>} The Axios response promise.
 */
async function http2Adapter(config, adapterConfig) {
    const adapter = getAdapter('http');

    if (await shouldUseHTTP2(config, adapterConfig)) {
        const http2Config = createHTTP2Config(config, adapterConfig);
        return adapter(http2Config);
    } else {
        return adapter(config);
    }
}

/**
 * Determines whether HTTP/2 should be used for the given request.
 *
 * @param {import('axios').InternalAxiosRequestConfig} config - Axios request config.
 * @param {Partial<HTTP2AdapterConfig>} adapterConfig - HTTP/2 adapter configuration.
 * @returns {Promise<boolean>} Whether to use HTTP/2.
 */
async function shouldUseHTTP2(config, adapterConfig) {
    if (adapterConfig.force) {
        return true;
    }
    return await isHTTP2Supported(config);
}

/**
 * Checks whether HTTP/2 is supported by the target server.
 *
 * @param {import('axios').InternalAxiosRequestConfig} config - Axios request config.
 * @returns {Promise<boolean>} Whether HTTP/2 is supported.
 */
async function isHTTP2Supported(config) {
    const url = new URL(config.url, config.baseURL);

    // HTTP2 doesn't support not secured connection.
    if (!url.protocol.startsWith('https:')) {
        return false;
    }

    try {
        const res = await http2.auto.resolveProtocol({
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

/**
 * Creates a new Axios config object with an HTTP/2-compatible transport layer.
 *
 * @param {import('axios').InternalAxiosRequestConfig} config - Original Axios config.
 * @param {Partial<HTTP2AdapterConfig>} adapterConfig - HTTP/2 adapter configuration.
 * @returns {import('axios').InternalAxiosRequestConfig} Modified Axios config with HTTP/2 transport.
 */
function createHTTP2Config(config, adapterConfig) {
    const requestWrappedWithRedirects = wrap({
        https: {
            /**
             * Custom request function using `http2-wrapper`.
             *
             * @param {http2.ClientRequestArguments} options - Request options.
             * @param {(res: http2.IncomingMessage) => void} handleResponse - Response handler.
             * @returns {http2.ClientRequest} The HTTP/2 request object.
             */
            request: (options, handleResponse) => {
                if (adapterConfig.agent) {
                    // @ts-expect-error Typing are not aware of agent prop, but it actually works
                    // https://github.com/szmarczak/http2-wrapper?tab=readme-ov-file#new-http2agentoptions
                    options.agent = adapterConfig.agent;
                }

                const req = http2.request(options, handleResponse);

                const origOn = req.on.bind(req);
                // Omit the socket.setKeepAlive axios action, as HTTP/2 sockets should not be manipulated directly.
                req.on = (name, ...args) => {
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

export default createHTTP2Adapter;
