import { terser } from "rollup-plugin-terser";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import typescript from "rollup-plugin-typescript2";

import packageJson from "./package.json";

const production = !process.env.ROLLUP_WATCH;
const sourcemap = !production ? "inline" : false;

export default {
  input: "./src/index.ts",
  external: [
    "react",
    "@emotion/react",
    "@emotion/styled",
    "clsx",
    "react-transition-group",
  ],
  output: [
    {
      file: packageJson.main,
      format: "cjs",
      sourcemap: true,
    },
    {
      file: packageJson.module,
      format: "esm",
      sourcemap: sourcemap,
    },
  ],
  plugins: [resolve(), commonjs(), typescript(), terser()],
};
