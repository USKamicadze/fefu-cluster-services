var isDevelopment = process.env.NODE_ENV == "development";

var tsxLoaders = ['ts-loader'];
if (isDevelopment) {
  tsxLoaders.unshift('react-hot');
}

module.exports = {
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
}