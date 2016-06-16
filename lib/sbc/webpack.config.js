module.exports = {
	entry: "./main.js",
	output: {
		path: __dirname + '/release/',
		filename: "sbc.js"
	},
	module: {
		loaders: [
			{
				test: /\.json$/,
				loader: "json-loader"
			}
		]
	},
};
