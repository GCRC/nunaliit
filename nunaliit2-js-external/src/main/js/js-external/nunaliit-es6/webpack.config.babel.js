const path =require( 'path');
module.exports = {
	entry: './dist/index.js',
	devtool: 'source-map',
	mode: 'production',
	module: {
		rules:[
			{
				test: require.resolve('./dist/n2es6/n2core/nunaliit2.js'),
    		use: 'exports-loader?nunaliit2'
			}
		]
	},
	output: {
		path: path.join(__dirname, 'dist','target'),
		publicPath: '../dist/',
		filename: 'n2es6.js',
		library: 'n2es6',
		libraryTarget: 'umd',
		libraryExport: 'default'
	},
	node: {
	   fs: "empty"
	}
};
