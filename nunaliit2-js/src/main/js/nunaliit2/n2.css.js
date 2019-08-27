/*
Copyright (c) 2016, Geomatics and Cartographic Research Centre, Carleton 
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

*/

;(function($,$n2){
"use strict";

//=====================================================================
function _getAllCssElements() {
	var elements = [];
	
	var $head = $('head');
	var $elems = $head.children('link,style').each(function(){
		var $elem = $(this);
		
		var tagName = $elem.prop('tagName');
		if( 'STYLE' === tagName ){
			elements.push($elem);

		} else if( 'LINK' === tagName ){
			var rel = $elem.attr('rel');
			if( !rel ) rel = "";
			var type = $elem.attr('type');
			if( !type ) type = "";
			
			if( 'stylesheet' === rel.toLowerCase() 
			 && 'text/css' === type.toLowerCase() ){
				elements.push($elem);
			};
		};
	});

	return elements;
};

//=====================================================================
function setCss(opts_) {
	var opts = $n2.extend({
		css: null
		,name: null
	},opts_);
	
	if( typeof opts.css !== 'string' ){
		throw new Error('setCss() must specify css as a string');
	};
	
	var $cssElement = undefined;
	var $insertPoint = undefined;

	var elements = _getAllCssElements();
	elements.forEach(function($css){
		$insertPoint = $css;
		
		var n2Name = $css.attr('n2-name');
		if( opts.name && opts.name === n2Name ){
			$cssElement = $css;
		};
	});
	
	// Replace?
	if( $cssElement ){
		$cssElement.text(opts.css);

	} else {
		// Must insert
		$cssElement = $('<style>')
			.attr('type','text/css')
			.text(opts.css)
			;
		
		if( typeof opts.name === 'string' ){
			$cssElement.attr('n2-name', opts.name);
		};
		
		// Do we have a position?
		if( $insertPoint ){
			$insertPoint.after($cssElement);
		} else {
			$('head').append($cssElement);
		};
	};
};

//=====================================================================
$n2.css = {
	setCss: setCss
};

})(jQuery,nunaliit2);