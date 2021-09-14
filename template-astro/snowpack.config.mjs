import proxy from "http2-proxy";
import path from "path";
import { logger } from "snowpack";

import fs from "fs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import rollupPluginNodePolyfills from "rollup-plugin-node-polyfills";

const isDev = process.env["DFX_NETWORK"] !== "ic";
const __dirname = path.resolve();

let canisterIds;
try {
  canisterIds = JSON.parse(
    fs.readFileSync(
      isDev ? ".dfx/local/canister_ids.json" : "./canister_ids.json"
    )
  );
} catch (e) {}

let dfxJson;
try {
  dfxJson = JSON.parse(fs.readFileSync("./dfx.json"));
} catch (e) {}

// List of all aliases for canisters
const aliases = Object.entries(dfxJson.canisters).reduce(
  (acc, [name, _value]) => {
    // Get the network name, or `local` by default.
    const networkName = process.env["DFX_NETWORK"] || "local";
    const outputRoot = path.join(
      __dirname,
      ".dfx",
      networkName,
      "canisters",
      name
    );

    return {
      ...acc,
      ["dfx-generated/" + name]: path.join(outputRoot, name + ".js"),
    };
  },
  {}
);

// Generate canister ids, required by the generated canister code in .dfx/local/canisters/*
// This strange way of JSON.stringifying the value is required by vite
const canisterDefinitions = Object.entries(canisterIds).reduce(
  (acc, [key, val]) => ({
    ...acc,
    [`process.env.${key.toUpperCase()}_CANISTER_ID`]: isDev
      ? JSON.stringify(val.local)
      : JSON.stringify(val.ic),
  }),
  {}
);

// Gets the port dfx is running on from dfx.json
const DFX_PORT = dfxJson.networks.local.bind.split(":")[1];

console.log("canisterDefinitions", canisterDefinitions);
console.log("aliases", aliases);
const config = {
  // mode: "development",
  packageOptions: {
    polyfillNode: true,
    rollup: {
      plugins: [nodeResolve(), rollupPluginNodePolyfills({ crypto: true })],
    },
    external: ["crypto"],
  },
  alias: {
    ...aliases,
    // crypto: "crypto-js",
  },
  routes: [
    {
      src: "/api/.*",
      dest: (req, res) => {
        // remove /api prefix (optional)
        req.url = req.url.replace(/^\/api/, "/api");

        return proxy.web(req, res, {
          hostname: "localhost",
          port: DFX_PORT,
        });
      },
    },
  ],
};

console.log("config", JSON.stringify(config, undefined, 2));

export default config;
