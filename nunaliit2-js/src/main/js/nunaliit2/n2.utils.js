/*
Copyright (c) 2010, Geomatics and Cartographic Research Centre, Carleton 
University
All rights reserved.

Redistribution and use in source and binary forms, with or without 
modification, are permitted provided that the following conditions are met:

 - Redistributions of source code must retain the above copyright notice, 
   this list of conditions and the following disclaimer.
 - Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.
 - Neither the name of the Geomatics and Cartographic Research Centre, 
   Carleton University nor the names of its contributors may be used to 
   endorse or promote products derived from this software without specific 
   prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE 
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE 
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE 
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF 
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS 
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN 
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) 
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE 
POSSIBILITY OF SUCH DAMAGE.

$Id: n2.utils.js 8415 2012-08-07 15:39:35Z jpfiset $
*/

// @requires n2.core.js
// @namespace nunaliit2
;(function($n2){
"use strict";

/**
 	Logs to the console a string and a set of arguments. This works best with Firebug installed.
 	@name log
 	@function
 	@memberOf nunaliit2
 	@param {String} msg Log message
 	@param {Object} o1  Object to be inspected in log
 */
$n2.log = function() {
	if( typeof window === 'object'
	 && window.console 
	 && typeof window.console.log === 'function' ) {
		try { window.console.log.apply(window.console,arguments); }
			catch(e) {};
	};
};

/**
	Logs an error to the console
	@name logError
	@function
	@memberOf nunaliit2
	@param {String} msg Log message
	@param {Object} o1  Object to be inspected in log
*/
$n2.logError = function() {
	if( typeof window === 'object'
	 && window.console 
	 && typeof window.console.error === 'function' ) {
		try { window.console.error.apply(window.console,arguments); }
			catch(e) {};
	} else {
		$n2.log.apply(this,arguments);
	};
};

// Install logger on window
if( typeof window !== 'undefined' ) {
	if( typeof(window.log) === 'undefined' ) {
		window.log = $n2.log;
	};
};

var nativeArrayIndexOf = null;
if( typeof Array !== 'undefined' && Array.prototype ){
	nativeArrayIndexOf = Array.prototype.indexOf;
};

var nativeStringTrim = null;
if( typeof String !== 'undefined' && String.prototype ){
	nativeStringTrim = String.prototype.trim;
};


var cachedBrowserInfo = null;

//*********************************************
// reportError - This function reports an error
// only once, supressing it after the first report.
// The id is used to identify the error.

$n2.ERROR_NO_SUPRESS = {};

var reportedErrors = {};

/**
 	Alerts the user of an error. An error is presented to the user
 	only the first time it is encountered. Subsequent similar errors
 	are suppressed.
 	@name reportError
 	@function
 	@memberOf nunaliit2
 	@param {String} id A unique identifier for the error reported.
 	@param {String} msg Error message presented to the user. If omitted,
 	                    the id is presented to the user.
 */
$n2.reportError = function(id,str) {
	if( arguments.length < 1 ) return;
	
	if( arguments.length < 2 ) str = id; 

	$n2.logError.apply(null,arguments);	
	if( id === $n2.ERROR_NO_SUPRESS ) {
		// Report, always
		alert(str);
	} else if( reportedErrors[id] ) {
		// do not report again
	} else {
		reportedErrors[id] = 1;
		alert(str);
	};	
};

$n2.reportErrorForced = function(str) {
	$n2.reportError($n2.ERROR_NO_SUPRESS,str);	
};

//*********************************************
// isDefined

/**
 	Returns true if a the given argument is defined.
 	@name isDefined
 	@function
 	@memberOf nunaliit2
 	@param {String} _v Argument to be tested.
 */
$n2.isDefined = function(_v) {
	return('undefined' != typeof(_v) && null != _v);
};

if( typeof window !== 'undefined' ) {
	if( typeof(window.isDefined) === 'undefined' ) {
		window.isDefined = $n2.isDefined;
	};
};

//*********************************************
// isArray

/**
 	Returns true if a the given argument is an array.
 	@name isArray
 	@function
 	@memberOf nunaliit2
 	@param {Object} o Argument to be tested.
 */
$n2.isArray = function(o) {
	if( o === null ) return false;
	if( o === undefined ) return false;
	if( typeof(o) !== 'object' ) return false;
	if( typeof(o.length) !== 'number' ) return false;
	if( typeof(o.push) !== 'function' ) return false;
	if( typeof(o.pop) !== 'function' ) return false;
	if( typeof(o.concat) !== 'function' ) return false;
	if( typeof(o.join) !== 'function' ) return false;
	if( typeof(o.slice) !== 'function' ) return false;
	if( typeof(o.reverse) !== 'function' ) return false;
	if( typeof(o.splice) !== 'function' ) return false;
	if( typeof(o.sort) !== 'function' ) return false;
	
	return true;
};

//*********************************************
// inArray

/**
	Returns the index of the element if found in
	the array. Returns -1 if not found.
	@name inArray
	@function
	@memberOf nunaliit2
	@param {Object} elem Element searched for in array
	@param {Array} arr Element searched for in array
	@param {Number} index Index where the search is started
	@return {Number} Index of found element. Returns -1, if not found.
*/
$n2.inArray = function( elem, arr, index ) {
	var len;

	if ( arr ) {
		if ( nativeArrayIndexOf ) {
			return nativeArrayIndexOf.call( arr, elem, index );
		};

		len = arr.length;
		index = index ? index : 0;
		index = index < 0 ? Math.max( 0, len + index ) : index;

		for( ; index < len; ++index) {
			if( index in arr 
			 && arr[index] === elem ) {
				return index;
			};
		};
	};

	return -1;
};


//*********************************************
// getUniqueId

var n2UniqueId = 0;
/**
	Returns an identifier unique to this instance of
	nunaliit2.
	@name getUniqueId
	@function
	@memberOf nunaliit2
	@return {String} Unique string that can be used as an identifier
*/
$n2.getUniqueId = function(prefix) {
	prefix = prefix ? prefix : 'nunaliit2_uniqueId_';
	var id = prefix + n2UniqueId;
	++n2UniqueId;
	return id;
};

/**
 	Returns the media type (image, video or audio)
 	associated with the given file.
 	@name getMediaType
 	@function
 	@memberOf nunaliit2
 	@param {String} filename Name of file of given media file.
 	@param {String} mimetype MIME Type associated with file.
 	@returns {String} Type of media: 'audio', 'image' or 'video'
 */
$n2.getMediaType = function(filename, mimetype) {
	var mediaType = null;

	// Start with MIME type, if provided
	if(typeof(mimetype) != 'undefined'
	 && null != mimetype 
	 && '' != mimetype
	 ) {
		var mimeClass = mimetype.split('/');
		if ('image' === mimeClass[0] ||
			'video' === mimeClass[0] ||
			'audio' === mimeClass[0]) {
			mediaType = mimeClass[0];
		};
	
		// Known mime types	
		if( null === mediaType
		 && 'application/ogg' === mimetype ) {
			mediaType = 'audio';
		};
	};
	
	if( null === mediaType 
	 && typeof(filename) != 'undefined' 
	 && null != filename 
	 && '' != filename
	 ) {
		var fileFrags = filename.split('.');
		var ext = fileFrags[fileFrags.length - 1];
		
		// known extensions
		if( 'mp3' === ext.toLowerCase() ) {
			mediaType = 'audio';
		} else if( 'ogg' === ext.toLowerCase() ) {
			mediaType = 'audio';
		} else if( 'jpg' === ext.toLowerCase() ) {
			mediaType = 'image';
		} else if( 'png' === ext.toLowerCase() ) {
			mediaType = 'image';
		} else if( 'jpeg' === ext.toLowerCase() ) {
			mediaType = 'image';
		} else if( 'bmp' === ext.toLowerCase() ) {
			mediaType = 'image';
		} else if( 'mov' === ext.toLowerCase() ) {
			mediaType = 'video';
		};
	};
	return(mediaType);
};

/**
 	Converts a textual representation of LongLat into an object
 	with values for longitude and latitude. Return null if the
 	textual representation can not be recognized.
 	@name parseLongLatText
 	@function
 	@memberOf nunaliit2
 	@param {String} text A textual representation of LongLat (45°32'48.94"N, 73°33'19.93"W)
 	@returns {Object} Hash containing two properties: lat and long
 */
var longLatRe = /^\s*([0-9]{1,2})(°|d|\u00B0)\s*([0-9]{1,2})['m]\s*([0-9]{1,2}(\.[0-9]+)?)["s]\s*([NS])\s*,?\s*([0-9]{1,3})(°|d|\u00B0)\s*([0-9]{1,2})['m]\s*([0-9]{1,2}(\.[0-9]+)?)["s]\s*([WE])\s*$/;
$n2.parseLongLatText = function(text) {
	var result = {};
	
	$n2.log('longLat text',text,longLatRe);

	var matchObj = text.match(longLatRe);
	if( null == matchObj ) {
		return null;
	};

	$n2.log('longLat',matchObj);

	var longMult = 1;
	if( 'S' === matchObj[6] ) {
		longMult = -1;
	};
	result.lng = longMult * (
		1 * matchObj[1] 
		+ (1 * matchObj[3] / 60)
		+ (1 * matchObj[4] / 3600)
	);
		
	var latMult = 1;
	if( 'W' === matchObj[12] ) {
		latMult = -1;
	};
	result.lat = latMult * (
		1 * matchObj[7] 
		+ (1 * matchObj[9] / 60)
		+ (1 * matchObj[10] / 3600)
	);
		
	$n2.log('parseLongLatText',text,result);

	return result;
};

/**
 * Generate the HTML representation of a hyperlink, given a text label,
 * url, and optional css classes (single string or array of strings).
 * If no url is included or it is an empty string, then a string is returned
 * within a classed div.
 * @param text label for hyperlink
 * @param url text for url
 * @param cls class string or array of class strings
 */
$n2.generateHyperlinkHTML = function(text, url, cls) {
	function catStrings(ar) {
		var out = '';
		var spc = '';
		for (var i=0; i < ar.length; i++) {
			out.concat(spc, ar[i]);
			spc = ' ';
		};
		return out;
	};
	
	var clsString = '';
	if ($n2.isArray(cls)) {
		clsString = catStrings(cls);
	} else {
		clsString = cls;
	};
	
	var classSpec = '';
	if ('' !== clsString) {
		classSpec = ' class="' + clsString + '"';
	};
	
	var uTxt = url;
	if (! $n2.isDefined(uTxt) || uTxt === '') {
		uTxt = '';
	};
	
	var label = text;
	if (! $n2.isDefined(label) || label === '') {
		label = uTxt; // replicate url as text if no label
	};
	
	var out = '';
	if (uTxt !== '') { // generate <a>
		out = '<a' + classSpec + 
			' href="' + uTxt +
			'" target="_blank">' + label + '</a>';
	} else { // return label string as classed div
		out = '<div' + classSpec + '>' + label + '</div>'; 
	};
	
	return out;
};

/**
	Extends a javascript object using refinements.
	@name extend
	@function
	@memberOf nunaliit2
	@param {Object} target Target object to receive the extensions
	@returns {Object} The target object that was extended
*/
$n2.extend = function() {
	// copy reference to target object
	var target = arguments[0] || {}
		,deep = false;

	// Handle a deep copy situation
	var i = 1;
	if ( typeof target === 'boolean' ) {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}

	for(var e=arguments.length; i<e; ++i) {
		var options = arguments[i];

		// Only deal with non-null/undefined values
		if( null != options ) {
			// Extend the base object
			for(var name in options) {
				var src = target[ name ];
				var copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging arrays
				if ( deep && copy && $n2.isArray(copy) ) {
					var clone = (src && $n2.isArray(src)) ? src : [];

					target[ name ] = $n2.extend( deep, clone, copy );
					
				} else if( deep && copy && typeof(copy) === 'object' ) {
					// Recurse if we're merging objects
					var clone = ('object' == typeof(src)) ? src : {};

					target[ name ] = $n2.extend( deep, clone, copy );

				} else if( copy !== undefined ) {
					// Don't bring in undefined values
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

/**
	Makes a deep copy of the given object.
	@name deepCopy
	@function
	@memberOf nunaliit2
	@param {Object} o Object to be copied
	@returns {Object} The copy of the object given in argument
*/
$n2.deepCopy = function(o) {
	if( null === o ){
		return o;
		
	} else if( typeof o === 'undefined' ) {
		return o;
		
	} else if( $n2.isArray(o) ) {
		var c = [];
		for(var i=0,e=o.length; i<e; ++i){
			c[i] = $n2.deepCopy(o[i]);
		};
		return c;
		
	} else if( typeof(o) === 'object' ) {
		var c = {};
		for(var i in o){
			c[i] = $n2.deepCopy(o[i]);
		};
		return c;

	} else {
		return o;
	};
};

/**
	Helper function for localization. It redirects to l10n
	package if it is loaded. This function request a string
	localized for the current locale given a string in the
	default language (generally english). If the l10n package
	is not loaded, it returns the requested string.
	@name loc
	@function
	@memberOf nunaliit2
	@param {String} str String to be translated
	@param {String} packageName Name of package making the
	                            translation request
	@returns {String} The string localized for the current locale.
*/
$n2.loc = function(str, packageName, args) {
	if( $n2.l10n && $n2.l10n.getLocalizedString ) {
		return $n2.l10n.getLocalizedString(str, packageName, args);
	};
	return str;
};

/**
 * Trim function for strings. If available, use the one already provided.
 * If not, use home made one.
 * @name trim
 * @function
 * @memberOf nunaliit2
 * @param {String} text String to be trimmed of leading and trailing white
 *                      spaces.
 * @returns {String} String which is a trimmed version of the input argument.
 */
var reLeftWhite = /^[\s\t\x0d\x0a]+/;
var reRightWhite = /[\s\t\x0d\x0a]+$/;
$n2.trim = function(text){
	if( null === text ) {
		return '';
	};
	
	if( nativeStringTrim ) {
		return nativeStringTrim.call(text);
	};

	// Use own version
	return text.toString()
		.replace(reLeftWhite, '')
		.replace(reRightWhite, '')
		;
};

$n2.utils = {
	
	_callbacks: {}
		
	/**
	 * Converts a string to a string that can be used with a HTML id
	 * or class name. Not all characters can be used in HTML identifiers
	 * and class names and this routine escape the unwanted characters from
	 * the given string. 
	 * @name stringToHtmlId
	 * @function
	 * @memberOf nunaliit2.utils
	 * @param {String} s String to be converted in a form where it can be used
	 *                   as an HTML id or HTML class name.
	 * @returns {String} String safe for HTML id or class name.
	 */
	,stringToHtmlId: function(s){
		var res = [];
		for(var i=0,e=s.length; i<e; ++i) {
			var c = s[i];
			if( c >= 'a' && c <= 'z' ) { res.push(c); }
			else if( c >= 'A' && c <= 'Z' ) { res.push(c); }
			else if( c >= '0' && c <= '9' ) { res.push(c); }
			else {
				var code = c.charCodeAt(0);
				var o0 = (code & 0x07) + 0x30;
				var o1 = ((code >> 3) & 0x07) + 0x30;
				var o2 = ((code >> 6) & 0x07) + 0x30;
				res.push('_');
				res.push( String.fromCharCode(o2) );
				res.push( String.fromCharCode(o1) );
				res.push( String.fromCharCode(o0) );
			};
		};
		return res.join('');
	}
	
	/**
	 * Unescapes a string previously converted using stringToHtmlId(). 
	 * @name unescapeHtmlId
	 * @function
	 * @memberOf nunaliit2.utils
	 * @param {String} s String to be unescaped.
	 * @returns {String} String initially passed to the stringToHtmlId() function.
	 */
	,unescapeHtmlId: function(s){
		var res = [];
		for(var i=0,e=s.length; i<e; ++i) {
			var c = s[i];
			if( c === '_' ) { 
				++i;
				var o2 = s.charCodeAt(i);
				++i;
				var o1 = s.charCodeAt(i);
				++i;
				var o0 = s.charCodeAt(i);
				
				var b = ((o2-0x30)<<6)+((o1-0x30)<<3)+(o0-0x30);
				res.push(String.fromCharCode(b));
				
			} else {
				res.push(c);
			};
		};
		return res.join('');
	}

	/**
	 * Returns information about the browser. This is based on code found
	 * here: http://www.quirksmode.org/js/detect.html 
	 * @name getBrowserInfo
	 * @function
	 * @memberOf nunaliit2.utils
	 * @returns {Object} Object containing information about the browser
	 * where the application runs
	 */
	,getBrowserInfo: function(){
		
		if( cachedBrowserInfo ){
			return cachedBrowserInfo;
		};

		var dataBrowser = [
   			{
   				string: navigator.userAgent,
   				subString: "Chrome",
   				identity: "Chrome"
   			},
   			{ 	
   				string: navigator.userAgent,
   				subString: "OmniWeb",
   				versionSearch: "OmniWeb/",
   				identity: "OmniWeb"
   			},
   			{
   				string: navigator.vendor,
   				subString: "Apple",
   				identity: "Safari",
   				versionSearch: "Version"
   			},
   			{
   				prop: window.opera,
   				identity: "Opera",
   				versionSearch: "Version"
   			},
   			{
   				string: navigator.vendor,
   				subString: "iCab",
   				identity: "iCab"
   			},
   			{
   				string: navigator.vendor,
   				subString: "KDE",
   				identity: "Konqueror"
   			},
   			{
   				string: navigator.userAgent,
   				subString: "Firefox",
   				identity: "Firefox"
   			},
   			{
   				string: navigator.vendor,
   				subString: "Camino",
   				identity: "Camino"
   			},
   			{		// for newer Netscapes (6+)
   				string: navigator.userAgent,
   				subString: "Netscape",
   				identity: "Netscape"
   			},
   			{
   				string: navigator.userAgent,
   				subString: "MSIE",
   				identity: "Explorer",
   				versionSearch: "MSIE"
   			},
   			{
   				string: navigator.userAgent,
   				subString: "Gecko",
   				identity: "Mozilla",
   				versionSearch: "rv"
   			},
   			{ 		// for older Netscapes (4-)
   				string: navigator.userAgent,
   				subString: "Mozilla",
   				identity: "Netscape",
   				versionSearch: "Mozilla"
   			}
   		];
		var dataOS = [
  			{
  				string: navigator.platform,
  				subString: "Win",
  				identity: "Windows"
  			},
  			{
  				string: navigator.platform,
  				subString: "Mac",
  				identity: "Mac"
  			},
  			{
  				string: navigator.userAgent,
  				subString: "iPhone",
  				identity: "iPhone/iPod"
  			},
  			{
  				string: navigator.platform,
  				subString: "Linux",
  				identity: "Linux"
  			}
  		];
		
		var browserInfo = {};
		var versionSearchString;
		init();
		cachedBrowserInfo = browserInfo;
		return browserInfo;

		function init() {
			browserInfo.browser = searchString(dataBrowser) || "An unknown browser";
			browserInfo.version = searchVersion(navigator.userAgent)
				|| searchVersion(navigator.appVersion)
				|| "an unknown version";
			browserInfo.OS = searchString(dataOS) || "an unknown OS";
		};
		
		function searchString(data) {
			for (var i=0;i<data.length;i++)	{
				var dataString = data[i].string;
				var dataProp = data[i].prop;
				versionSearchString = data[i].versionSearch || data[i].identity;
				if (dataString) {
					if (dataString.indexOf(data[i].subString) != -1)
						return data[i].identity;
				}
				else if (dataProp)
					return data[i].identity;
			}
		};

		function searchVersion(dataString) {
			var index = dataString.indexOf(versionSearchString);
			if (index == -1) return;
			return parseFloat(dataString.substring(index+versionSearchString.length+1));
		};
		
	}

	/**
	 * Returns true if the input is a number, regardless if it is a number
	 * in a string, or a direct number.
	 * See http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric
	 * @name isNumber
	 * @function
	 * @memberOf nunaliit2.utils
	 * @param {String} String or number to be tested
	 * @returns {Boolean} True if given parameter represents a number. False, otherwise.
	 */
	,isNumber: function(n){
		return !isNaN(parseFloat(n)) && isFinite(n);
	}
	
	/**
	 * Returns a object that describes the javascript declaration included
	 * in the host page. The HTML of the host page is traversed to find all
	 * javascript declarations and if one matches the name given in argument,
	 * an object is returned to describe the declaration. If a matching
	 * declaration is not found, null is returned.
	 * @name findJavascriptDeclaration
	 * @function
	 * @memberOf nunaliit2.utils
	 * @param javascriptFileName {String} name of the file for the seeked javascript
	 * declaration. This should be the name and extension, without any path fragment.
	 * @returns {Object} Object that describes the jaavascript declaration. Null if
	 * the seeked declaration is not found.
	 */
	,findJavascriptDeclaration: function(javascriptFileName){
		var scriptLocation = null;
		var scriptElem = null;
		var pattern = new RegExp('(^|(.*?\\/))'+javascriptFileName+'$');
	 
		var scripts = document.getElementsByTagName('script');
		for( var loop=0; loop<scripts.length; ++loop ) {
			var src = scripts[loop].getAttribute('src');
			if (src) {
				var match = src.match(pattern);
				if( match ) {
					scriptLocation = match[1];
					scriptElem = scripts[loop];
					break;
				}
			}
		};
		
		var result = null;
		if( null != scriptElem ){
			result = {
				element: scriptElem
				,location: scriptLocation
				,name: javascriptFileName
			};
		};
		
		return result;
	}
	
	/**
	 * Inserts new javascript declarations at the end of the host document. Multiple 
	 * declarations are added this way, each one based
	 * on a name found in the given array of strings. Finally, a callback is given
	 * which is called when the new declarations have been added and parsed.
	 * @name insertJavascriptDeclarations
	 * @function
	 * @memberOf nunaliit2.utils
	 * @param declarationDescription {Object} Declaration description previously
	 * obtained using nunaliit2.utils.findJavascriptDeclaration(). All new declarations
	 * are inserted previous to this one. Also, new declarations are made relative to
	 * the path of this declaration.
	 * @param names {Array of String} Names of the javascript files that should be inserted
	 * as new declarations. These names may contain path fragments, relative to the
	 * declaration description given in argument. 
	 * @param callback {Function} Function called after all declarations have been inserted.
	 * @returns {void}
	 */
	,insertJavascriptDeclarations: function(declarationDescription, names, callback){

		var scriptLocation = declarationDescription.location;
		
       	var allScriptTags = new Array();
       	for( var i=0; i<names.length; ++i ) {
       		allScriptTags.push('<script type="text/javascript" src="');
       		allScriptTags.push(scriptLocation);
       		allScriptTags.push(names[i]);
       		allScriptTags.push('"></script>');
       	};
       	
       	// Add callback
       	var cbId = $n2.getUniqueId();
       	$n2.utils._callbacks[cbId] = function(){
       		delete $n2.utils._callbacks[cbId];
       		if( typeof(callback) === 'function' ){
       			callback();
       		};
       	};
   		allScriptTags.push('<script type="text/javascript">if( typeof(nunaliit2.utils._callbacks["');
   		allScriptTags.push(cbId);
   		allScriptTags.push('"]) === "function" ){ nunaliit2.utils._callbacks["');
   		allScriptTags.push(cbId);
   		allScriptTags.push('"](); };');
   		allScriptTags.push('</script>');
       	
   		// Write at end of document
       	document.write(allScriptTags.join(''));
	}
	
	/**
	 * Accepts a formatting string and arguments. Returns the formatted
	 * string. For example, $n2.formatString('{a} and {b}',{a:1,b:2}) returns
	 * '1 and 2'
	 * @name formatString
	 * @function
	 * @memberOf nunaliit2.utils
	 * @param format {String} Formatting string that contains sequences to be
	 * replaced by arguments. The sequences are names included within curly
	 * braces, for example {a}
	 * @param args {Object} Dictionary of arguments
	 * @returns {String}
	 */
	,formatString: function(format, args){
		return format.replace(/{([^}]+)}/g, function(match, name) {
			name = $n2.trim(name);
			if( '' === name ) return match;
			
			return typeof args[name] !== 'undefined'
				? args[name]
				: match
			;
		});
	}
	
	/**
	 * Returns the number of milliseconds elapsed since 1 January 1970 00:00:00 UTC. This
	 * is equivalent to Date.now(). However, Date.now() is not supported in IE8.
	 * @name getCurrentTime
	 * @function
	 * @memberOf nunaliit2.utils
	 * @returns {Number}
	 */
	,getCurrentTime: Date.now || function () {
		return +new Date();
	}
	
	/**
	 * Returns a string which represents the date formatted as specified.
	 * @name formatDate
	 * @function
	 * @memberOf nunaliit2.utils
	 * @returns {String}
	 */
	,formatDate: function(date, format){
		var str = format.replace('%Y',''+date.getFullYear());
		
		var monthNumStr = ''+(date.getMonth()+1);
		if( monthNumStr.length < 2 ) monthNumStr = '0'+monthNumStr;
		str = str.replace('%m',monthNumStr);
		
		var dateNumStr = ''+date.getDate();
		if( dateNumStr.length < 2 ) dateNumStr = '0'+dateNumStr;
		str = str.replace('%d',dateNumStr);
		
		var hoursNumStr = ''+date.getHours();
		if( hoursNumStr.length < 2 ) hoursNumStr = '0'+hoursNumStr;
		str = str.replace('%H',hoursNumStr);
		
		var minutesNumStr = ''+date.getMinutes();
		if( minutesNumStr.length < 2 ) minutesNumStr = '0'+minutesNumStr;
		str = str.replace('%M',minutesNumStr);
		
		var secondsNumStr = ''+date.getSeconds();
		if( secondsNumStr.length < 2 ) secondsNumStr = '0'+secondsNumStr;
		str = str.replace('%S',secondsNumStr);
		
		return str;
	},
	
	/**
	 * Returns a Javascript object returned in an XMLHttpRequest
	 * with an error. 
	 * @name parseHttpJsonError
	 * @function
	 * @memberOf nunaliit2.utils
	 * @param {Object} Instance of XMLHttpRequest used to retrieve information
	 * @param {String} Error string that should be returned if an object can not
	 *                 be parsed.
	 * @returns {Object} JSON object returned by the instance of XMLHttpRequest
	 */
	parseHttpJsonError: function(xmlHttpRequest,defaultText){
		// Need JSON
		if( !JSON || typeof(JSON.parse) !== 'function' ) {
			return createDefault();
		};
		
		// Need a response text
		var text = xmlHttpRequest.responseText;
		if( !text ) return createDefault();
		
		// Parse
		var error = JSON.parse(text);
		if( !error ) return createDefault();
		
		return error;
		
		function createDefault(){
			return {
				error: defaultText
				,reason: defaultText
			};
		};
	},
	
	/**
	 * Creates a version of the function where the rate of calls is limited to
	 * one call per defined time out.
	 * @name debounce
	 * @function
	 * @memberOf nunaliit2.utils
	 * @param {Function} The function that should be limited in the rate at which
	 *                   it is fired.
	 * @param {Number} Number of milliseconds between the calls to the function
	 * @returns {Boolean} If true, the function is called immediately, and again in the
	 *                    future after a period defined by the timeout.
	 */
	debounce: function(func, wait, immediate) {
		var timeout = null;
		return function() {
			var context = this, args = arguments;
			var later = function() {
				timeout = null;
				if (!immediate) func.apply(context, args);
			};
			if (immediate && !timeout) func.apply(context, args);
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
		};
	},
	
	/**
	 * Returns the identifier associated with the given element. If no identifier
	 * is currently assigned to the element, assign a unique one and then return it.
	 * @name getElementIdentifier
	 * @function
	 * @memberOf nunaliit2.utils
	 * @param {Object} DOM element where the identifier is desired.
	 * @returns {String} Element identifier
	 */
	getElementIdentifier: function(elem){
		var $elem = $(elem);
		var id = $elem.attr('id');
		if( !id ){
			id = $n2.getUniqueId();
			$elem.attr('id',id);
		};
		return id;
	}
};

// HTML Escape
var htmlEscapeCharMap = {
	'&': '&amp;'
	,'<': '&lt;'
	,'>': '&gt;'
	,'"': '&quot;'
	,"'": '&#x27;'
	,'`': '&#x60;'
};

var reHtmlCharSelect = /[&<>"'`]/g;
var reHtmlCharTest = /[&<>"'`]/;

var htmlEscapeCharFn = function(match) {
 	return htmlEscapeCharMap[match] || "";
};

/**
 * Accepts a string and returns an escaped version of the string, which
 * can be used in HTML. This function converts all the characters that are
 * reserved in HTML for the escaped version of the same character.
 * @name escapeHtml
 * @function
 * @memberOf nunaliit2.utils
 * @param str {String} String to be escaped for HTML
 * @returns {String} String escaped for use in HTML
 */
$n2.utils.escapeHtml = function(str) {
	if( typeof(str) !== 'string' ) {
		return "";
	};
	
	// Need to escape?
	if( !reHtmlCharTest.test(str) ) {
		return str;
	};
	
	// Perform escape
	return str.replace(reHtmlCharSelect, htmlEscapeCharFn);
};

})(nunaliit2);