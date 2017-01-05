var path = require('path');
var isDevelopment = process.env.NODE_ENV == "development";

var tsxLoaders = ['ts-loader'];
if (isDevelopment) {
  tsxLoaders.unshift('react-hot');
}

var frontendConfig = {
  target : 'web',
  entry: './app/index.tsx',
  output: {
    path: "./public", 
    filename: 'bundle.js'
  },
  devtool: isDevelopment ? "source-map" : undefined,
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js']
  },
  module: {
    loaders: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      { test: /\.tsx?$/, loaders: tsxLoaders }
    ],
    preLoaders: isDevelopment ? [
      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      { test: /\.js$/, loader: "source-map-loader" }
    ] : undefined
  }
};

var backendConfig = {
  target: 'node',
  node: {
    __dirname: false,
    __filename: false,
  },
  entry: './index.ts',
  output: {
    filename: 'index.js',
    devtoolModuleFilenameTemplate: function (info) {
      var relative = path.relative(__dirname, info.absoluteResourcePath);
      return relative;
    },
    devtoolFallbackModuleFilenameTemplate: function (info) {
      var relative = path.relative(__dirname, info.absoluteResourcePath);
      return relative + info.hash;
    }
  },
  devtool: isDevelopment ? "source-map" : undefined,
  
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js']
  },
  module: {
    loaders: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      { test: /\.tsx?$/, loaders: ['ts-loader'] }
    ],
    preLoaders: isDevelopment ? [
      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      { test: /\.js$/, loader: "source-map-loader" }
    ] : undefined
  },
  externals: {
    'express': 'commonjs express',
  },
};

module.exports = [frontendConfig, backendConfig];