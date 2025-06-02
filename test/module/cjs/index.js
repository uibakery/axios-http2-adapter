const createHTTP2Adapter = require("axios-http2-adapter");
const assert = require("assert");

assert.strictEqual(typeof createHTTP2Adapter, "function");

const adapter = createHTTP2Adapter();
assert.strictEqual(typeof adapter, "function");

console.log("CommonJS import test passed");
