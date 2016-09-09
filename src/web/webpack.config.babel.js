import path from 'path'
import webpack from 'webpack'
import merge from 'webpack-merge'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import ExtractTextPlugin from 'extract-text-webpack-plugin' 
import CopyWebpaclPlugin from 'copy-webpack-plugin'
import fs from 'fs'

const TARGET = process.env.npm_lifecycle_event

var config = {
    environment: 'dev',
    appConfig: JSON.parse(fs.readFileSync('./config.json')),
    botConfig: JSON.parse(fs.readFileSync('../bot/config.json'))
}

if (TARGET === 'build') {
    config.environment = 'production'
    config.appConfig.pollInterval = 60000
} else {
    // Disable auto refresh on dev environment
    config.appConfig.pollInterval = 0
}

const src = path.resolve(__dirname, 'src')
const dist = path.resolve(__dirname, 'dist')

// build config
var plugins = [
    new HtmlWebpackPlugin({
        template: src + '/index.html',
        filename: 'index.html',
        hash: TARGET === 'build',
        title: 'ping-bot'
    }),
    new ExtractTextPlugin('app.css'),
    new webpack.DefinePlugin({
        'process.env': { 
            NODE_ENV: JSON.stringify(config.environment), // workaround to avoid the console warning log by React. see https://github.com/facebook/react/issues/6479
            POLL_INTERVAL: config.appConfig.pollInterval, /* '0' means no automatically refresh. Desirable minimum POLL_INTERVAL is 10000. */
            AWS_REGION: JSON.stringify(config.appConfig.aws.region),
            AWS_COGNITO_ARN: JSON.stringify(config.appConfig.aws.cognitoArn),
            DYNAMO_TARGETS_TABLE: JSON.stringify(config.botConfig.botName+config.botConfig.dynamoDb.suffixTargetsTable),
            DYNAMO_RESULTS_TABLE: JSON.stringify(config.botConfig.botName+config.botConfig.dynamoDb.suffixResultsTable),
            DYNAMO_HISTORIES_TABLE: JSON.stringify(config.botConfig.botName+config.botConfig.dynamoDb.suffixHistoriesTable)
        }
    }),
    new CopyWebpaclPlugin([
        {
            from: src + '/favicon.ico',
            to: 'favicon.ico'
        },
        {
            from: src + '/favicon-disabled.ico',
            to: 'favicon-disabled.ico'
        }
    ])
]
if (TARGET === 'build') {
    plugins.push(new webpack.optimize.UglifyJsPlugin())
}

var base = {
    entry: src + '/index.jsx',

    output: {
        path: dist,
        filename: 'app.js',
        chunkFilename: '[name].[id].js',
    },

    module: {
        loaders: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                loader: 'babel'
            },
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract('style-loader','css-loader')
            },
            {
                test: /\.scss$/,
                loader: ExtractTextPlugin.extract('style-loader','css-loader!sass-loader')
            },
            {
                test: /\.svg$/,
                loader: 'url-loader?mimetype=image/svg+xml'
            }
        ],
        noParse: [/aws-sdk.js/]
    },

    resolve: {
        extensions: ['', '.js', '.jsx']
    },

    plugins: plugins
}

export default merge(base, {})
