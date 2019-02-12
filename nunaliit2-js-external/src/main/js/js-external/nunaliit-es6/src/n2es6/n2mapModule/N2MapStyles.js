/**
 * @module n2es6/n2mapModule/N2MapStyles
 */
import {Fill, RegularShape, Stroke, Style, Text} from 'ol/style.js';


const ol5StyleNames = {
	"fill": "Style.image.fill.color"
	,"fill-opacity": "Style.image.fill.color[3]"
	,"stroke": "Style.image.stroke.color"
	,"stroke-opacity": "Style.image.stroke.color[3]"
	,"stroke-width": "Style.image.stroke.width"
	,"stroke-linecap": ""
	,"stroke-dasharray": ""
	,"r": ""
	,"pointer-events": ""
	,"color": ""
	,"font-family": "Style.text.font[2]"
	,"font-size": "Style.text.font[1]"
	,"font-weight": "Style.text.font[0]"
}

/**
 * [getOl5StyleObj return the ol5 stylemap object from nunaliit2 internal style tags
 * @param  {[type]} options [An nunaliit2 style symbolizer]
 * @return {[type]}         [import 'ol/style/Style.js'.default]
 */
export function getOl5StyleObj(options){

	var internalOl5StyleNames = {};
	for( var tags in options) {
		var internalOl5StyleName = ol5StyleNames[tags] ;
		if (internalOl5StyleName) {
			internalOl5StyleNames[internalOl5StyleName] = options[tags];
		}
	}
	return getOl5StyleObjFromOl5StyleNames(internalOl5StyleNames);
}
/**
 * [getOl5StyleObjFromOl5StyleNames description]
 * @param  {[type]} n2InternalStyle [description]
 * @return {[type]}                 [description]
 */
export function getOl5StyleObjFromOl5StyleNames(n2InternalStyle) {

	var handle = {};
	var _this = this;
	for (var tags in n2InternalStyle) {
		var arr = tags.split(".");
		handle.style  = recurProps ( arr, handle , n2InternalStyle[tags]);
	}
	return handle.style;

	function recurProps (tagarr, supernode, value){
		if(  !tagarr ){
			return;
		}
		let currNodeString = tagarr[0];
		if (currNodeString === 'Style') {
			let currnode = supernode.style
			if (!currnode) {
				currnode = new Style()
			}
			currnode[tagarr[1]+'_'] =
				recurProps (tagarr.slice(1),
							currnode,
							value)
			return  currnode;

		} else if (currNodeString === 'image') {
			let currnode = supernode.getImage();
			if (!currnode) {
				currnode = new RegularShape({})
			}
			currnode[tagarr[1]+'_'] =
				recurProps (tagarr.slice(1),
							currnode,
							value)
			return  currnode;

		} else if (currNodeString === 'text') {
			let currnode = supernode.getText();
			if (!currnode) {
				currnode = new Text()
			}
			currnode.set(tagarr.slice(1,2),
				recurProps (tagarr.slice(1),
							currnode,
							value))
			return  currnode;


		} else if (currNodeString === 'fill') {
			let currnode = supernode.getFill();
			if (!currnode) {
				currnode = new Fill()
			}
			currnode[tagarr[1]+'_'] =
				recurProps (tagarr.slice(1),
							currnode,
							value)
			return  currnode;


		} else if (currNodeString === 'stroke') {
			let currnode = supernode.getStroke();
			if (!currnode) {
				currnode = new Stroke()
			}
			currnode.set(tagarr.slice(1,2),
				recurProps (tagarr.slice(1),
							currnode,
							value))
			return  currnode;


		} else if (currNodeString.indexOf('color') === 0 ) {
			let color = supernode.getColor();
			let colorArr = [];
			if ( !color ) {
				colorArr = colorValues('white');
			} else {
				colorArr = colorValues(value);
			}
			if (currNodeString.indexOf('\[') > 0) {
				let idx = parseInt(
					currNodeString.replace(/color\[(\d)\]/g, '$1')
				);
				colorArr [idx] = value;
			}
			supernode.setColor( colorArr);

		} else if (currNodeString.IndexOf('font') === 0 ){
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
				fontArr = font.split(' ');
			}
			if (fontArr.length <= 0) {
				throw new Error('N2MapStyles: Bad Font Property');
			}
			if (fontArr.length < 3 && fontArr.length > 1) {
				fontArr.unshift('normal');
			}
			if (fontArr.length < 2 && fontArr.length > 0) {
				fontArr.unshift('normal', '10px');
			}
			if (currNodeString.indexOf('\[') > 0) {
				let idx = parseInt( currNodeString.replace(/color\[(\d)\]/g, '$1') );
				fontArr [idx] = value;
			}
			supernode.setFont( fontArr.join());
		} else if (currNodeString.IndexOf('width') === 0 ){
			supernode.setWidth(1 * value);
		} else {
			throw new Error('N2MapStyles: Bad Style Tags');
		}
	}

}

// return array of [r,g,b,a] from any valid color. if failed returns undefined
/*
Examples:
    colorValues('transparent'); // [0,0,0,0]
    colorValues('white'); // [255, 255, 255, 1]
    colorValues('teal'); // [0, 128, 128, 1]
    colorValues('rgba(11,22,33,.44)'); // [11, 22, 33, 0.44]
    colorValues('rgb(11,22,33)'); // [11, 22, 33, 1]
    colorValues('#abc'); // [170, 187, 204, 1]
    colorValues('#abc6'); // [170, 187, 204, 0.4]
    colorValues('#aabbcc'); // [170, 187, 204, 1]
    colorValues('#aabbcc66'); // [170, 187, 204, 0.4]
    colorValues('asdf'); // undefined
    colorValues(''); // undefined
    colorValues(NaN); // Script Error
    colorValues(123); // Script Error
*/
/**
 * [colorValues description]
 * @param  {[type]} color [description]
 * @return {[type]}       [description]
 */
export function colorValues(color){
	if (!color)
		return;
	if (Array.isArray(color)){
		if (color.length === 4) {
			return color;
		} else if (color.length === 3){
			return color.push(1);
		}
	}
	if (color.toLowerCase() === 'transparent')
		return [0, 0, 0, 0];
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
	if (color.indexOf('rgb') === -1)
	{
		// convert named colors
		var temp_elem = document.body.appendChild(document.createElement('fictum')); // intentionally use unknown tag to lower chances of css rule override with !important
		var flag = 'rgb(1, 2, 3)'; // this flag tested on chrome 59, ff 53, ie9, ie10, ie11, edge 14
		temp_elem.style.color = flag;
		if (temp_elem.style.color !== flag)
			return; // color set failed - some monstrous css rule is probably taking over the color of our object
		temp_elem.style.color = color;
		if (temp_elem.style.color === flag || temp_elem.style.color === '')
			return; // color parse failed
		color = getComputedStyle(temp_elem).color;
		document.body.removeChild(temp_elem);
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
// function hexToRgbA(hex){
//     var c;
//     if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
//         c= hex.substring(1).split('');
//         if(c.length== 3){
//             c= [c[0], c[0], c[1], c[1], c[2], c[2]];
//         }
//         c= '0x'+c.join('');
//         return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+',1)';
//     }
//     throw new Error('Bad Hex');
// }
