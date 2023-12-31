/* eslint-disable */
const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const BundleTracker = require('webpack-bundle-tracker');
const autoprefixer = require('autoprefixer');


// The app/ dir
const app_root = path.resolve(__dirname, '..');
// The django app's dir
const project_root = path.resolve(app_root, '..');

// Enable deprecation warnings
process.traceDeprecation = true;


function makeConfig(options) {
    const mode = options.mode || 'none';
    const output = {
        path: path.resolve(app_root, 'build'),
        filename: options.filenameTemplate + '.js',
        chunkFilename: options.filenameTemplate + '.chunk.js',
        publicPath: options.publicPath,
        library: 'projement',
        hashFunction: 'sha512',
        hashDigestLength: 32,
    };

    return {
        entry: {
            app: options.prependSources.concat(['@babel/polyfill', 'main.js']),
            styles: options.prependSources.concat([path.resolve(project_root, 'static', 'styles-src', 'main.js')]),
        },

        mode,

        output,

        module: {
            rules: [{
                test: /\.js$/, // Transform all .js files required somewhere with Babel
                exclude: /node_modules/,
                use: 'babel-loader',
            }, {
                test: /\.(css|scss)$/,
                include: [
                    // CSS modules should only be generated from css/scss files within the src directory
                    path.resolve(app_root, 'src'),

                    // Global stylesheets in the static directory do not generate modules
                    path.resolve(project_root, 'static'),
                    path.resolve(project_root, 'node_modules')
                ],
                use: [
                    // When MiniCssExtractPlugin becomes stable and supports all options, convert if needed
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            sourceMap: true,
                            importLoaders: 1,
                            modules: {
                                localIdentName: '[path][name]__[local]--[hash:base64:5]',
                                getLocalIdent: (loaderContext, localIdentName, localName, options) => {
                                    // Everything that comes from our global style folder and node_modules will be in global scope
                                    if (/styles-src|node_modules/.test(loaderContext.resourcePath)) {
                                        return localName;
                                    }
                                    // Everything listed under vendorCss will be in global scope
                                    if (vendorCss.includes(loaderContext.resourcePath)) {
                                        return localName;
                                    }

                                    return null;
                                },
                            },
                        },
                    }, {
                        loader: "postcss-loader",
                        options: {
                            postcssOptions: {
                                plugins: function () {
                                    return [autoprefixer];
                                },
                            },
                        },
                    }, {
                        loader: "resolve-url-loader",
                    }, {
                        loader: "sass-loader",
                        options: {
                            sourceMap: true,
                            sassOptions: {
                                includePaths: [
                                    path.resolve(project_root, 'static', 'styles-src'),
                                    path.resolve(project_root, 'node_modules', 'bootstrap-sass', 'assets', 'stylesheets'),
                                ],
                                outputStyle: 'expanded',
                            },
                        },
                    },
                ],
            }, {
                test: /\.(jpe?g|png|gif|svg|woff2?|eot|ttf)$/,
                type: 'asset/inline',
            }, {
                test: /\.md$/i,
                use: 'raw-loader',
            },
            {
                test: /\.(html)$/,
                   use:[{loader: 'html-loader',}],
            }],
        },

        plugins: [
            new MiniCssExtractPlugin({
                filename: options.filenameTemplate + '.css',
                chunkFilename: options.filenameTemplate + '.chunk.css',
            }),
            new BundleTracker({
                path: __dirname,
                filename: 'webpack-stats.json',
                indent: 2,
                logTime: true,
            }),
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV), // Inject environmental variables to client side
            }),
        ].concat(options.plugins),

        optimization: {
            minimize: options.minimize,

            splitChunks: {
                chunks: 'all',

                cacheGroups: {
                    default: false,
                    defaultVendors: {
                        idHint: 'vendors',
                        test: /node_modules/,  // Include all assets in node_modules directory
                        reuseExistingChunk: true,
                        enforce: true,
                        chunks: 'initial',
                        minChunks: 1,
                    },
                },
            },
            runtimeChunk: 'single',
        },

        resolve: {
            modules: ['app/src', 'node_modules'],
            extensions: ['.js'],
        },

        devtool: options.devtool,
        target: 'web', // Make web variables accessible to webpack, e.g. window
        // stats: false, // Don't show stats in the console

        performance: options.performance,
    };
}


module.exports = makeConfig;
