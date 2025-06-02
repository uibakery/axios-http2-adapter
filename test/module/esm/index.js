import assert from "assert";
import createHTTP2Adapter from "axios-http2-adapter";

assert.strictEqual(typeof createHTTP2Adapter, "function");

const adapter = createHTTP2Adapter();
assert.strictEqual(typeof adapter, "function");

console.log("ESM importing test passed");
