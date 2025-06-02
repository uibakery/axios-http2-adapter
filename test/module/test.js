import assert from "assert";
import createHTTP2Adapter from "../../index.js";
import { fileURLToPath } from "url";
import path from "path";
import util from "util";
import cp from "child_process";
import fs from "fs-extra";

const BACKUP_PATH = "./backup/";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const exec = util.promisify(cp.exec);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const remove = async (file) => {
    console.log(`✓ Remove entry '${file}'...`);
    try {
        await sleep(1000);
        await fs.remove(file);
    } catch (err) {
        console.warn(err.message);
    }
};

describe("module", function () {
    before(async () => {
        console.log("✓ Creating build backup...");
        await fs.copy("./dist/", BACKUP_PATH);
        console.log("✓ Exec build script...");
        await exec("npm run build");
        console.log("✓ Running tests...");
    });

    after(async () => {
        console.log("✓ Restore build from the backup...");
        await fs.copy(BACKUP_PATH, "./dist/");
        await remove(BACKUP_PATH);
    });

    describe("export", function () {
        it("should export a function", function () {
            assert.strictEqual(typeof createHTTP2Adapter, "function");
        });

        it("should return a function when called", function () {
            const adapter = createHTTP2Adapter();
            assert.strictEqual(typeof adapter, "function");
        });

        describe("CommonJS", () => {
            const pkgPath = path.join(__dirname, "./cjs");

            after(async () => {
                await remove(path.join(pkgPath, "./node_modules"));
            });

            it("should be able to be loaded with require", async function () {
                this.timeout(30000);

                await exec(`npm test --prefix ${pkgPath}`);
            });
        });

        describe("ESM", () => {
            const pkgPath = path.join(__dirname, "./esm");

            after(async () => {
                await remove(path.join(pkgPath, "./node_modules"));
            });

            it("should be able to be loaded with import", async function () {
                this.timeout(30000);

                await exec(`npm test --prefix ${pkgPath}`);
            });
        });
    });
});
