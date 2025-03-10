/**
* @module n2es6/n2mapModule/N2MapStyles
*/
import {Fill, RegularShape, Stroke, Style, Text} from 'ol/style.js';
import CircleStyle from 'ol/style/Circle';
import Icon from 'ol/style/Icon';

const StyleNamesMapForAll = 
	{
		'point':{
			"fillColor": "Style.image.fill.color"
			,"fillOpacity": "Style.image.fill.color.[3]"
			,"pointRadius": "Style.image.radius"
			,"pointerEvents": ""
			,"graphicName": "Style.image.points"
			,"strokeColor": "Style.image.stroke.color"
			,"strokeLinecap": "Style.image.stroke.lineCap"
			,"strokeOpacity": "Style.image.stroke.color.[3]"
			,"strokeWidth": "Style.image.stroke.width"
			,"fontColor" : "Style.text.fill.color"
			,"fontFamily": "Style.text.font.[2]"
			,"fontSize": "Style.text.font.[1]"
			,"fontWeight": "Style.text.font.[0]"
			,"label" : "Style.text.text"
			,"labelOutlineColor" : "Style.text.stroke.color"
			,"labelOutlineWidth" : "Style.text.stroke.width"
			,"iconSrc" : "Style.image.src"
			,"scale" : "Style.image.scale"
			,"iconColor" : "Style.image.iconColor"
		}
		,'line':{
			"fillColor": "Style.fill.color"
			,"fillOpacity": "Style.fill.color.[3]"
			,"strokeColor" : "Style.stroke.color"
			,"strokeOpacity": "Style.stroke.color.[3]"
			,"strokeWidth": "Style.stroke.width"
			,"strokeLinecap": "Style.stroke.lineCap"
			,"strokeDashstyle": "Style.stroke.lineDash"
			,"r": ""
			,"pointerEvents": ""
			,"color": ""
			,"fontColor" : "Style.text.fill.color"
			,"fontFamily": "Style.text.font.[2]"
			,"fontSize": "Style.text.font.[1]"
			,"fontWeight": "Style.text.font.[0]"
			,"label" : "Style.text.text"
			,"labelOutlineColor" : "Style.text.stroke.color"
			,"labelOutlineWidth" : "Style.text.stroke.width"
		}
		,'polygon':{
			"fillColor": "Style.fill.color"
			,"fillOpacity": "Style.fill.color.[3]"
			,"strokeColor" : "Style.stroke.color"
			,"strokeOpacity": "Style.stroke.color.[3]"
			,"strokeWidth": "Style.stroke.width"
			,"strokeLinecap": "Style.stroke.lineCap"
			,"strokeDashstyle": "Style.stroke.lineDash"
			,"r": ""
			,"pointerEvents": ""
			,"color": ""
			,"fontColor" : "Style.text.fill.color"
			,"fontFamily": "Style.text.font.[2]"
			,"fontSize": "Style.text.font.[1]"
			,"fontWeight": "Style.text.font.[0]"
			,"label" : "Style.text.text"
			,"labelOutlineColor" : "Style.text.stroke.color"
			,"labelOutlineWidth" : "Style.text.stroke.width"
		}
	}
class N2MapStyles {

	/**
	* N2MapStyles constructor
	*/
	constructor(){
		this._map = null;
	}
	setMap(map){
		this._map = map;
	}
	getMap(){
		return this._map 
	}
	/**
	* The function that convert a n2 symbolizer to
	* ol5 map style obj.
	* @return {import("ol/style/Style.js").default} produce a ol5 Style object
	*/
	loadStyleFromN2Symbolizer(symbols , feature){
		var geometryType = feature.n2_geometry;
		let candidate =  this.getOl5StyleObjFromSymbol(symbols, geometryType, feature);	
		return candidate;
	}
	/**
	* [getOl5StyleObjFromSymbol return the ol5 stylemap object from nunaliit2 internal style tags
	* @param  {n2styleSymbol} symbols An nunaliit2 style symbolizer.symbols
	* @return {import("ol/style/Style.js").default}
	*/
	getOl5StyleObjFromSymbol(symbols, geometryType,feature) {
		var rstStyleSet = [];
		if ("v2_style" in symbols){
			for (var symbol in symbols){
				if (symbol === "v2_style"){
					continue;
				}
				var value = Object.assign({}, {map: this._map, feature: feature}, symbols[symbol]);
				let imageStyle = this.getOl5StyleObjFromV2Style(symbol, value);
				if (imageStyle){
					let rstStyle = new Style({image: imageStyle});
					if (rstStyle){
						rstStyleSet.push(rstStyle);
					}
				}
			}
			return rstStyleSet;
		}
		
		
		if ( !StyleNamesMapForAll[geometryType.toLowerCase()] ){
			throw new Error("N2MapStyles: this geometry type is not supported yet");
		}
		let StyleNamesMap = StyleNamesMapForAll[geometryType.toLowerCase()];
		var internalOl5StyleNames = {};
		for( var tags in symbols) {
			var internalOl5StyleName = StyleNamesMap[tags] ;
			if (internalOl5StyleName && internalOl5StyleName !== '') {
				internalOl5StyleNames[internalOl5StyleName] = symbols[tags];
			}
		}
		
		if (geometryType.indexOf("point") >= 0){
			return this.getOl5StyleObjFromStyleName_point(internalOl5StyleNames);
		}else {
			return this.getOl5StyleObjFromStyleName(internalOl5StyleNames);
		}
	}
	getOl5StyleObjFromV2Style(symbol, value){
		
		if(symbol){
			let thisStyle = $n2.utils.getInstance(symbol, value);
			return thisStyle;
		}
		return null;
		
	}
	getOl5StyleObjFromStyleName_point(n2InternalStyle){
		var handle = {}
		var _this = this;
		var option_image = {	
							points: Infinity,
							fill: new Fill({color: '#ffffff'}),
							stroke: new Stroke({color: '#ee9999', width: 2}),
							radius: 5
						}
		for( let tags in n2InternalStyle ) {
			var arr = tags.split(".");
			handle.style  = recurProps ( arr, handle , n2InternalStyle[tags], 0);
			arr = null;
		}
		var option_innerImage = handle.style['image_'];
		let innerImage;
		if (n2InternalStyle["Style.image.src"]) {
			const scale = n2InternalStyle['Style.image.scale'];
			const iconColor = n2InternalStyle['Style.image.iconColor'] || undefined;
			innerImage = new Icon({
				crossOrigin: "anonymous",
				scale: scale,
				color: iconColor,
				src: n2InternalStyle["Style.image.src"],
			});
		} else {
			innerImage = new RegularShape(option_innerImage);
		}

		handle.style.setImage(innerImage);
		return handle.style;
		
		function recurProps (arr, supernode, value, level){
			if(  level >= arr.length ){
				return;
			}
			var nextlevel = level+1;
			let currNodeString = arr[level];
			let nextNodeString = arr[nextlevel];
			if (currNodeString === 'Style') {
				let currnode = supernode.style
				if (!currnode) {
					currnode = new Style({})
				}
				currnode[nextNodeString+'_'] =
				recurProps (arr,
						currnode,
						value, nextlevel)
				return	currnode;

			} else if (currNodeString === 'image') {
				let currnode = option_image;
				
				if (nextNodeString === 'src') {
					currnode.src = value;
					return currnode;
				}
				
				currnode[nextNodeString] =
				recurProps (arr,
						currnode,
						value, nextlevel)
				
				return	currnode;

			} else if (currNodeString === 'scale') {
				if (
					Array.isArray(value) &&
					value.length === 2 &&
					value.every(num => typeof num === 'number' && num >= 0 && num <= 1)
				) {
					return value;
				}
				throw new Error("Invalid scale value. It must be an array of two numbers between 0 and 1.");
			} else if (currNodeString === 'iconColor') {
				return value;
			} else if (currNodeString === 'text') {
				let currnode = supernode.getText();
				if (!currnode) {
					currnode = new Text();
				}
				
				if (arr.length > nextlevel) {
					currnode[nextNodeString+'_'] =
						recurProps (arr,
								currnode,
								value,
								nextlevel);
					return	currnode;
				} else if (arr.length === nextlevel) {
					return value;
				}


			} else if (currNodeString === 'fill') {
				let currnode = supernode.fill;
				if (!currnode) {
					currnode = new Fill({color: '#ffffff'});
				}
				currnode['checksum_'] = undefined;
				currnode[nextNodeString+'_'] =
				recurProps (arr,
						currnode,
						value,
						nextlevel);


				return	currnode;


			} else if (currNodeString === 'stroke') {
				let currnode = supernode.stroke;
				if (!currnode) {
					currnode = new Stroke({color: '#ee9999', width: 2});
				}
				currnode['checksum_'] = undefined;
				currnode[nextNodeString+ '_'] =
				recurProps (arr,
						currnode,
						value, nextlevel);
				return	currnode;


			} else if (currNodeString.indexOf('color') === 0 ) {
				let color = supernode.getColor();
				let colorArr = _this.colorValues(color);
				let newColorArr ;
				if ( !colorArr ) {
					colorArr = _this.colorValues('#ee9999');
				}

				if (arr.length === nextlevel) {
					newColorArr = _this.colorValues(value);
					if (newColorArr && Array.isArray(newColorArr)) {
						colorArr = newColorArr;
					}
					return colorArr;
				} else if (arr.length > nextlevel) {
					return recurProps (arr, colorArr, value, nextlevel);
				} else {
					throw new Error ("N2MapStyles: input color-string error");
				}

			} else if (currNodeString.indexOf('font') === 0 ){
				//font property is a string with 2 or 3 words
				//font = weight + ' ' + size + ' ' + font
				//for instance:
				//font: 'bold 11px Arial, Verdana, Helvetica, sans-serif'
				// It is a mess, and constructing
				let font = supernode.getFont();
				let fontArr = [];
				if (!font) {
					fontArr = ['normal', '10px', 'sans-serif'];
				} else {
					fontArr = _this.toFontArray(font);
				}

				if (arr.length === nextlevel) {
					return fontArr.join(' ');
				} else if (arr.length > nextlevel){
					return recurProps (arr, fontArr, value, nextlevel);
				} else {
					throw new Error ("N2MapStyles: input font-string error");
				}
			} else if (currNodeString.indexOf('\[') === 0){

					let idx = parseInt( currNodeString.replace(/\[(\d)\]/g, '$1') );
					if (typeof idx === 'number') {
						supernode [idx] = value;	
						if (supernode.length === 3){
							supernode = supernode.join(' ');
						}
						return supernode;
					} else {
						throw new Error ('N2MapStyles: value index format error');
					}

			} else if (currNodeString.indexOf('width') === 0 ){
				return (parseInt(value));
			} else if (currNodeString.indexOf('radius') === 0){
				return (value);
			} else if (currNodeString.indexOf('opacity') === 0){
				return (parseFloat(value));
			} else if (currNodeString.indexOf('lineCap') === 0 ){
				return ('' + value);
			} else if (currNodeString.indexOf('lineDash') === 0 ) {
				switch(value) {
					case 'dot':
						return [0,4];
					case 'dash':
						return [7];
					case 'dashdot':
						return	[10, 5, 0, 5];
					case 'longdash':
						return [15];
					case 'longdashdot':
						return [20, 10, 0 , 10];
					default:
						return [1];
				}
			} else if (currNodeString.indexOf('points') === 0){
				switch(value) {
				case 'square':
					supernode['rotation'] = (Math.PI / 4);
					return 4;
				case 'triangle':
					return 3;
				case 'star':
					supernode.radius2_ = parseInt (supernode.radius_ * 0.4);
					return 5;
				case 'cross':
					supernode.radius2_ = 0;
					supernode['rotation'] = (Math.PI / 4);
					return 4;
				case 'x':
					supernode.radius2_ = 0;
					return 4;
				default:
					return Infinity;
				}
			} else {
				throw new Error('N2MapStyles: Bad Style Tags');
			}
		}
	}
	/**
	* [getOl5StyleObjFromOl5StyleNames description]
	* @param  {n2InternalStyle} n2InternalStyle 
	* @return {import("ol/style/Style.js").default} 
	*/
	getOl5StyleObjFromStyleName(n2InternalStyle) {
		var handle = {};
		var _this = this;
		for (var tags in n2InternalStyle) {
			var arr = tags.split(".");
			handle.style  = recurProps ( arr, handle , n2InternalStyle[tags], 0);
			arr = null;
		}
		var rst = handle.style;
		return rst;

		function recurProps (arr, supernode, value, level){
			if(  level >= arr.length ){
				return;
			}
			var nextlevel = level+1;
			let currNodeString = arr[level];
			let nextNodeString = arr[nextlevel];
			if (currNodeString === 'Style') {
				let currnode = supernode.style
				if (!currnode) {
					currnode = new Style({})
				}
				currnode[nextNodeString+'_'] =
				recurProps (arr,
						currnode,
						value, nextlevel)
				return	currnode;

			} else if (currNodeString === 'image') {
				let currnode = supernode.getImage();
				if (!currnode) {
					currnode = new RegularShape({
						points: Infinity,
						fill: new Fill({color: '#ffffff'}),
						stroke: new Stroke({color: '#ee9999', width: 2}),
						radius: 5
					});
				}
				currnode['checksums_'] = undefined;
				currnode[nextNodeString+'_'] =
				recurProps (arr,
						currnode,
						value, nextlevel)
				currnode.render_();
				return	currnode;

			} else if (currNodeString === 'text') {
				let currnode = supernode.getText();
				if (!currnode) {
					currnode = new Text();
				}
				
				if (arr.length > nextlevel) {
					currnode[nextNodeString+'_'] =
						recurProps (arr,
								currnode,
								value,
								nextlevel);
					return	currnode;
				} else if (arr.length === nextlevel) {
					return value;
				}


			} else if (currNodeString === 'fill') {
				let currnode = supernode.getFill();
				if (!currnode) {
					currnode = new Fill({color: '#ffffff'});
				}
				currnode['checksum_'] = undefined;
				currnode[nextNodeString+'_'] =
				recurProps (arr,
						currnode,
						value,
						nextlevel);


				return	currnode;


			} else if (currNodeString === 'stroke') {
				let currnode = supernode.getStroke();
				if (!currnode) {
					currnode = new Stroke({color: '#ee9999', width: 2});
				}
				currnode['checksum_'] = undefined;
				currnode[nextNodeString+ '_'] =
				recurProps (arr,
						currnode,
						value, nextlevel);
				return	currnode;


			} else if (currNodeString.indexOf('color') === 0 ) {
				let color = supernode.getColor();
				let colorArr = _this.colorValues(color);
				let newColorArr ;
				if ( !colorArr ) {
					colorArr = _this.colorValues('#ee9999');
				}

				if (arr.length === nextlevel) {
					newColorArr = _this.colorValues(value);
					if (newColorArr && Array.isArray(newColorArr)) {
						colorArr = newColorArr;
					}
					return colorArr;
				} else if (arr.length > nextlevel) {
					return recurProps (arr, colorArr, value, nextlevel);
				} else {
					throw new Error ("N2MapStyles: input color-string error");
				}

			} else if (currNodeString.indexOf('font') === 0 ){
				//font property is a string with 2 or 3 words
				//font = weight + ' ' + size + ' ' + font
				//for instance:
				//font: 'bold 11px Arial, Verdana, Helvetica, sans-serif'
				// It is a mess, and constructing
				let font = supernode.getFont();
				let fontArr = [];
				if (!font) {
					fontArr = ['normal', '10px', 'sans-serif'];
				} else {
					fontArr = _this.toFontArray(font);
				}
				if (arr.length === nextlevel) {
					return fontArr.join(' ');
				} else if (arr.length > nextlevel){
					return recurProps (arr, fontArr, value, nextlevel);
				} else {
					throw new Error ("N2MapStyles: input font-string error");
				}
			} else if (currNodeString.indexOf('\[') === 0){

					let idx = parseInt( currNodeString.replace(/\[(\d)\]/g, '$1') );
					if (typeof idx === 'number') {
						supernode [idx] = value;	
						if (supernode.length === 3){
							supernode = supernode.join(' ');
						}
						return supernode;
					} else {
						throw new Error ('N2MapStyles: value index format error');
					}

			} else if (currNodeString.indexOf('width') === 0 ){
				return (parseInt(value));
			} else if (currNodeString.indexOf('radius') === 0){
				return (value);
			} else if (currNodeString.indexOf('opacity') === 0){
				return (parseFloat(value));
			} else if (currNodeString.indexOf('lineCap') === 0 ){
				return ('' + value);
			} else if (currNodeString.indexOf('lineDash') === 0 ) {
				switch(value) {
					case 'dot':
						return [0,4];
					case 'dash':
						return [7];
					case 'dashdot':
						return	[10, 5, 0, 5];
					case 'longdash':
						return [15];
					case 'longdashdot':
						return [20, 10, 0 , 10];
					default:
						return [1];
				}
			} else if (currNodeString.indexOf('points') === 0){
				switch(value) {
				case 'square':
					supernode.setRotation(Math.PI / 4);
					return 4;
				case 'triangle':
					return 3;
				case 'star':
					supernode.radius2_ = parseInt (supernode.radius_ * 0.4);
					return 5;
				case 'cross':
					supernode.radius2_ = 0;
					supernode.setRotation(Math.PI / 4);
					return 4;
				case 'x':
					supernode.radius2_ = 0;
					return 4;
				default:
					return Infinity;
				}
			} else {
				throw new Error('N2MapStyles: Bad Style Tags');
			}
		}
	}
	// return array of [fontWeight, fontSize, fontFamily] from any given font string (css-like).
	toFontArray(font) {
		
		var initFontArr = ['normal', '10px', 'sans-serif'];
		DFS(font, initFontArr, 0);
		return initFontArr;
		function DFS(font, fontArr, cnt){
			if (font === "" || cnt > 2) return;
			var rhb = font.indexOf(' ');
			rhb = (rhb !== -1) ? rhb : font.length;
				let curr =	font.substring(0,rhb);
				let idx = isWhichPartOfFont (curr)
				fontArr[idx] = curr;
				DFS (font.substring(rhb+1), fontArr, cnt++);
			
		}
		
		function isWhichPartOfFont (part) {
			let fontWeightArr  = ['normal', 'bold'];
			if (part.indexOf('px') > 0 ) {
				return 1;
			} else if (fontWeightArr.indexOf(part.toLowerCase()) > -1) {
				return 0;
			}
			else {
				return 2;
			}
			
		}
		
	}
	/**
	* return array of [r,g,b,a] from any valid color. if failed returns undefined
	* Examples:
	* colorValues('rgba(11,22,33,.44)'); // [11, 22, 33, 0.44]
	* colorValues('rgb(11,22,33)'); // [11, 22, 33, 1]
	* colorValues('#abc'); // [170, 187, 204, 1]
	* colorValues('#abc6'); // [170, 187, 204, 0.4]
	* colorValues('#aabbcc'); // [170, 187, 204, 1]
	* colorValues('#aabbcc66'); // [170, 187, 204, 0.4]
	* colorValues('asdf'); // undefined
	* colorValues(''); // undefined
	* colorValues(NaN); // Script Error
	* colorValues(123); // Script Error
	*/
	colorValues(color){
		if (!color)
		return;
		if (Array.isArray(color)){
			if (color.length === 4) {
				return color;
			} else if (color.length === 3){
				return color.push(1);
			}
		}
		if (color[0] === '#')
		{
			if (color.length < 7)
			{
				// convert #RGB and #RGBA to #RRGGBB and #RRGGBBAA
				color = '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3] + (color.length > 4 ? color[4] + color[4] : '');
			}
			return [parseInt(color.substr(1, 2), 16),
				parseInt(color.substr(3, 2), 16),
				parseInt(color.substr(5, 2), 16),
				color.length > 7 ? parseInt(color.substr(7, 2), 16)/255 : 1];
			}
			if (color.indexOf('rgb') === 0)
			{
				if (color.indexOf('rgba') === -1)
				color += ',1'; // convert 'rgb(R,G,B)' to 'rgb(R,G,B)A' which looks awful but will pass the regxep below
				return color.match(/[\.\d]+/g).map(function (a)
				{
					return +a
				});
			}
		}
	}
	export default N2MapStyles
