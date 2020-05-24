const path = require("path");
const env = require("./env.js");
const paths = require("./paths.js");

// Files from NPM Packages that should not be imported
module.exports.ignorePackages = ({ latestBuild }) => [
  // Bloats bundle and it's not used.
  path.resolve(require.resolve("moment"), "../locale"),
  // Part of yaml.js and only used for !!js functions that we don't use
  require.resolve("esprima"),
];

// Files from NPM packages that we should replace with empty file
module.exports.emptyPackages = ({ latestBuild }) => [
  // Contains all color definitions for all material color sets.
  // We don't use it
  require.resolve("@polymer/paper-styles/color.js"),
  // Loads stuff from a CDN
  require.resolve("@polymer/font-roboto/roboto.js"),
  require.resolve("@vaadin/vaadin-material-styles/font-roboto.js"),
];

module.exports.definedVars = ({ isProdBuild, latestBuild, defineOverlay }) => ({
  __DEV__: !isProdBuild,
  __BUILD__: JSON.stringify(latestBuild ? "latest" : "es5"),
  __VERSION__: JSON.stringify(env.version()),
  __DEMO__: false,
  __BACKWARDS_COMPAT__: false,
  __STATIC_PATH__: "/static/",
  "process.env.NODE_ENV": JSON.stringify(
    isProdBuild ? "production" : "development"
  ),
  ...defineOverlay,
});

module.exports.terserOptions = (latestBuild) => ({
  safari10: true,
  ecma: latestBuild ? undefined : 5,
  output: { comments: false },
});

module.exports.babelOptions = ({ latestBuild }) => ({
  babelrc: false,
  presets: [
    !latestBuild && [require("@babel/preset-env").default, { modules: false }],
    require("@babel/preset-typescript").default,
  ].filter(Boolean),
  plugins: [
    // Part of ES2018. Converts {...a, b: 2} to Object.assign({}, a, {b: 2})
    [
      "@babel/plugin-proposal-object-rest-spread",
      { loose: true, useBuiltIns: true },
    ],
    // Only support the syntax, Webpack will handle it.
    "@babel/syntax-dynamic-import",
    "@babel/plugin-proposal-optional-chaining",
    "@babel/plugin-proposal-nullish-coalescing-operator",
    [
      require("@babel/plugin-proposal-decorators").default,
      { decoratorsBeforeExport: true },
    ],
    [
      require("@babel/plugin-proposal-class-properties").default,
      { loose: true },
    ],
  ],
});

// Are already ES5, cause warnings when babelified.
module.exports.babelExclude = () => [
  require.resolve("@mdi/js/mdi.js"),
  require.resolve("hls.js"),
];

const outputPath = (outputRoot, latestBuild) =>
  path.resolve(outputRoot, latestBuild ? "frontend_latest" : "frontend_es5");

const publicPath = (latestBuild) =>
  latestBuild ? "/frontend_latest/" : "/frontend_es5/";

/*
BundleConfig {
  // Object with entrypoints that need to be bundled
  entry: { [name: string]: pathToFile },
  // Folder where bundled files need to be written
  outputPath: string,
  // absolute url-path where bundled files can be found
  publicPath: string,
  // extra definitions that we need to replace in source
  defineOverlay: {[name: string]: value },
  // if this is a production build
  isProdBuild: boolean,
  // If we're targeting latest browsers
  latestBuild: boolean,
  // If we're doing a stats build (create nice chunk names)
  isStatsBuild: boolean,
  // Names of entrypoints that should not be hashed
  dontHash: Set<string>
}
*/

module.exports.config = {
  app({ isProdBuild, latestBuild, isStatsBuild }) {
    return {
      entry: {
        service_worker: "./src/entrypoints/service_worker.ts",
        app: "./src/entrypoints/app.ts",
        authorize: "./src/entrypoints/authorize.ts",
        onboarding: "./src/entrypoints/onboarding.ts",
        core: "./src/entrypoints/core.ts",
        compatibility: "./src/entrypoints/compatibility.ts",
        "custom-panel": "./src/entrypoints/custom-panel.ts",
      },
      outputPath: outputPath(paths.app_output_root, latestBuild),
      publicPath: publicPath(latestBuild),
      isProdBuild,
      latestBuild,
      isStatsBuild,
    };
  },

  demo({ isProdBuild, latestBuild, isStatsBuild }) {
    return {
      entry: {
        main: path.resolve(paths.demo_dir, "src/entrypoint.ts"),
        compatibility: path.resolve(
          paths.polymer_dir,
          "src/entrypoints/compatibility.ts"
        ),
      },
      outputPath: outputPath(paths.demo_output_root, latestBuild),
      publicPath: publicPath(latestBuild),
      defineOverlay: {
        __VERSION__: JSON.stringify(`DEMO-${env.version()}`),
        __DEMO__: true,
      },
      isProdBuild,
      latestBuild,
      isStatsBuild,
    };
  },

  cast({ isProdBuild, latestBuild }) {
    const entry = {
      launcher: path.resolve(paths.cast_dir, "src/launcher/entrypoint.ts"),
    };

    if (latestBuild) {
      entry.receiver = path.resolve(
        paths.cast_dir,
        "src/receiver/entrypoint.ts"
      );
    }

    return {
      entry,
      outputPath: outputPath(paths.cast_output_root, latestBuild),
      publicPath: publicPath(latestBuild),
      isProdBuild,
      latestBuild,
      defineOverlay: {
        __BACKWARDS_COMPAT__: true,
      },
    };
  },

  hassio({ isProdBuild, latestBuild }) {
    if (latestBuild) {
      throw new Error("Hass.io does not support latest build!");
    }
    return {
      entry: {
        entrypoint: path.resolve(paths.hassio_dir, "src/entrypoint.ts"),
      },
      outputPath: paths.hassio_output_root,
      publicPath: paths.hassio_publicPath,
      isProdBuild,
      latestBuild,
      dontHash: new Set(["entrypoint"]),
    };
  },

  gallery({ isProdBuild, latestBuild }) {
    return {
      entry: {
        entrypoint: path.resolve(paths.gallery_dir, "src/entrypoint.js"),
      },
      outputPath: outputPath(paths.gallery_output_root, latestBuild),
      publicPath: publicPath(latestBuild),
      isProdBuild,
      latestBuild,
    };
  },
};