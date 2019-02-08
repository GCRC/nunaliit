const path =require( 'path');
module.exports = {
	entry: './dist/index.js',
	devtool: 'source-map',
    mode: 'development',
    module: {
	rules: [
	    {
		test: /\.css$/,
		use: [
		    {loader: 'style-loader'},
		    {loader: 'css-loader'}
		]
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
	fs: 'empty'
	}
};
