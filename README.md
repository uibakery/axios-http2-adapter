# axios-http2-adapter
`axios-http2-adapter` is a custom adapter designed to fill a gap in the current Axios ecosystem. Despite widespread demand, as evidenced by [axios issue #1175](https://github.com/axios/axios/issues/1175), Axios has yet to implement native HTTP/2 support. This library offers a seamless solution, integrating HTTP/2 capabilities into Axios via `http2-wrapper`.

## Installation

```bash
npm install axios-http2-adapter
```

## Usage

### Basic usage:

```javascript
const axios = require('axios');
const { createHTTP2Adapter } = require('axios-http2-adapter');

axios.defaults.adapter = createHTTP2Adapter();
```

### With custom adapter configuration:

```javascript
const axios = require('axios');
const { createHTTP2Adapter } = require('axios-http2-adapter');
const http2 = require('http2-wrapper');

const adapterConfig = {
  agent: new http2.Agent({ /* options */ }),
  force: true // Force HTTP/2 without ALPN check - adapter will not check whether the endpoint supports http2 before the request
};

axios.defaults.adapter = createHTTP2Adapter(adapterConfig);
```

## License
This project is licensed under the [MIT License](https://github.com/uibakery/axios-http2-adapter/blob/master/LICENSE).

## Acknowledgements
axios
http2-wrapper
