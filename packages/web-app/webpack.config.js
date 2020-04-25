const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCssAssetsPlugin = require ('optimize-css-assets-webpack-plugin');

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const CONTENT_HASH_DESCRIPTOR = 'contentHashV1';

const plugins = [
  new ForkTsCheckerWebpackPlugin({
    checkSyntacticErrors: true, // ts-loader in happy pack ignores syntactic errors
    tsconfig: path.resolve('tsconfig.json'),
    compilerOptions: {
      declaration: false,
      declarationMap: false,
      composite: false,
      incremental: false,
    },
  }),
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': IS_PRODUCTION ? JSON.stringify('production') : JSON.stringify('development'),
    'BACKEND_URL': IS_PRODUCTION ? JSON.stringify('https://some-real-server') : JSON.stringify('http://localhost:5000')
  }),
  new HtmlWebpackPlugin({
    filename: 'index.html', //Name of file in ./dist/
    template: './src/index.html'
  })
];

if (IS_PRODUCTION) {
  plugins.push(
    new MiniCssExtractPlugin({
      filename: `[contenthash].${CONTENT_HASH_DESCRIPTOR}.css`,
      chunkFilename: `[contenthash].${CONTENT_HASH_DESCRIPTOR}.css`,
    }),
  );
}

const browserList = IS_PRODUCTION
  ? ['edge >= 17', 'firefox >= 60', 'android >= 67', 'chrome >= 67', 'ios >= 11.3', 'safari >= 11.3']
  : ['firefox >= 68', 'chrome >= 76', 'ios >= 12.0'];

// we always run a little bit of babel,
// the babel setting is just for if we are transpiling for support or not
// we require _some_ just for webpack/HMR to work
const babelLoader = {
  loader: require.resolve('babel-loader'),
  options: {
    sourceMaps: true,
    presets: [
      [
        require.resolve('@babel/preset-env'),
        {
          targets: browserList.join(','),
          useBuiltIns: 'usage', // only poly fill what we actually use
          modules: false, // preserve es2015 module imports for webpack to tree shake
          corejs: '3.3',
        },
      ],
    ],
    plugins: [
      require.resolve('@babel/plugin-syntax-dynamic-import'), // preserve dynamic imports so webpack can code split
      require.resolve('@babel/plugin-transform-react-jsx'), // we need this for react svg loader
      require.resolve('@babel/plugin-proposal-class-properties'), // private arrow functions
      require.resolve('babel-plugin-lodash'), // should try to avoid lodash usage, but this at least makes it less bad if it slips in
      ...(!IS_PRODUCTION ? [require.resolve('react-hot-loader/babel')] : []),
    ],
  },
}

const rules = [
  {
    test: /\.js$/,
    exclude: /node_modules/,
    use: [babelLoader],
  },
  {
    test: /\.js$/,
    use: [
      require.resolve('source-map-loader'), // load source maps from upstream packages as well
    ],
    enforce: 'pre', // required for source map loader
  },
  {
    test: /\.(ts|tsx)$/,
    exclude: /node_modules/,
    use: [
      babelLoader,
      {
        loader: require.resolve('ts-loader'),
        options: {
          configFile: path.resolve('tsconfig.json'),
          transpileOnly: true, // we allow fork-ts-checker to do typchecking instead
          happyPackMode: true, // needed to parallelize the loader
          onlyCompileBundledFiles: true,
          compilerOptions: {
            declaration: false,
            declarationMap: false,
            composite: false,
            incremental: false,
          },
        },
      },
    ],
  },
  {
    test: /\.css$/,
    exclude: /\.module\.css$/,
    use: [
      IS_PRODUCTION ? MiniCssExtractPlugin.loader : require.resolve('style-loader'),
      {
        loader: require.resolve('css-loader'),
        options: {
          importLoaders: 1, // run imports through post css
        },
      },
      {
        loader: require.resolve('postcss-loader'),
        options: {
          plugins: [require('autoprefixer')({ overrideBrowserslist: browserList })],
        },
      },
    ],
  },
  {
    test: /\.module\.css$/, // special case our internal css for modules and variables
    use: [
      IS_PRODUCTION ? MiniCssExtractPlugin.loader : require.resolve('style-loader'),
      {
        loader: require.resolve('css-loader'),
        options: {
          importLoaders: 1, // run imports through post css
          modules: {
            localIdentName: '[name]__[local]___[hash:base64:5]',
          },
          localsConvention: 'camelCaseOnly',
        },
      },
      {
        loader: require.resolve('postcss-loader'),
        options: {
          plugins: [
            require('autoprefixer')({ overrideBrowserslist: browserList }),
          ],
        },
      },
    ],
  },
  {
    test: /\.(png|jpg|gif|svg|woff2)$/,
    loader: require.resolve('file-loader'),
    options: {
      name: IS_PRODUCTION ? `assets/[contenthash].${CONTENT_HASH_DESCRIPTOR}.[ext]` : 'assets/[name].[ext]',
    },
  }
];

module.exports = {
  target: 'web',
  entry: IS_PRODUCTION ? ['./src/index.tsx'] : [require.resolve('react-hot-loader/patch'), './src/index.tsx'],
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.css'],
    alias: {
      ...(!IS_PRODUCTION
        ? {
            'react-dom': '@hot-loader/react-dom',
          }
        : {}),
    },
  },
  mode: IS_PRODUCTION ? 'production' : 'development',
  output: {
    path: path.resolve('dist'),
    filename:
      IS_PRODUCTION ? `[chunkhash].${CONTENT_HASH_DESCRIPTOR}.bundle.js` : `[name].bundle.js`,
    chunkFilename:
      IS_PRODUCTION ? `[chunkhash].${CONTENT_HASH_DESCRIPTOR}.chunk.js` : `[name].chunk.js`,
  },
  devtool: IS_PRODUCTION ? 'source-map' : 'eval-source-map',
  module: {
    rules,
  },
  devServer: {
    hot: true,
    contentBase: './dist',
    host: 'localhost',
    port: 8080,
    stats: 'errors-only',
  },
  plugins,
  optimization: {
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: 20,
      maxAsyncRequests: 100,
      minSize: 30_000,
      maxSize: 200_000,
    },
    minimizer: [
      new TerserPlugin({
        sourceMap: true,
      }),
      new OptimizeCssAssetsPlugin(),
    ],
  },
};
