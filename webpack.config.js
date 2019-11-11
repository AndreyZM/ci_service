const path = require('path');

module.exports = {
	entry: {
		index: path.resolve(__dirname, './src/ts/index.tsx'),

	},
	output: {
		filename: '[name].js',
		chunkFilename: '[name]-bundle.js',
		path: path.resolve(__dirname, 'www/js'),
		publicPath: 'src/',
		libraryTarget: 'this',
		library: 'ci'
	},
	mode: 'production',
	devtool: 'source-map',
	context: __dirname, // to automatically find tsconfig.json
	module: {
		rules: [
			 {
				test: /\.js$/,
				use: ["source-map-loader"],
				enforce: "pre"
			},
			{
				test: /\.css$/i,
				use: ['style-loader', 'css-loader'],
			},
			{
				test: /\.tsx?$/,
				use: [
					{ loader: 'cache-loader' },
					{
						loader: 'thread-loader',
						options: {
							// there should be 1 cpu for the fork-ts-checker-webpack-plugin
							workers: require('os').cpus().length - 1,
						},
					},
					{
						loader: 'ts-loader',
						options: {
							happyPackMode: true, // IMPORTANT! use happyPackMode mode to speed-up compilation and reduce errors reported to webpack
						}
					}
				]
			}
		],
	},
	resolve: {
		aliasFields: ['browser'],
		modules: [
			'node_modules',
			'scripts',
			'platforms'
		],
		extensions: ['.tsx', '.ts', '.js'],
		unsafeCache: true
	},

	optimization: {
		noEmitOnErrors: true,
		namedModules: true,
		namedChunks: true,
		moduleIds: 'named',
		removeAvailableModules: true,
		removeEmptyChunks: true,
		flagIncludedChunks: true,
		mergeDuplicateChunks: true,
		minimize: false,
		runtimeChunk: false,
		splitChunks: {
			chunks: 'all'
		},
	},
	plugins: []
};