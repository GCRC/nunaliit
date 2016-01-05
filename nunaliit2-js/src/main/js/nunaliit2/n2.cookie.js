/*
Copyright (c) 2011, Geomatics and Cartographic Research Centre, Carleton 
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
;(function($n2){
"use strict";

function getCookies(){
	var cookies = {};
	
	if( typeof document !== 'undefined' 
	 && document.cookie ) {
		var rawCookies = document.cookie.split(';');

		for(var i=0,e=rawCookies.length; i<e; ++i){
			var c = rawCookies[i].split('=');
			if( c.length && c.length > 1 ) {
				var key = decodeURIComponent( $n2.trim(c[0]) );
				var value = decodeURIComponent( $n2.trim(c[1]) );
				cookies[key]=value;
			};
		};
	};
	
	return cookies;
};
	
function getCookie(name){
	var cookies = getCookies();
	if( typeof(cookies[name]) === 'undefined' ) return null;
	return cookies[name];
};

function setCookie(opt_){
	var opt = $n2.extend({
		name: null
		,value: null
		,end: null
		,path: null
		,domain: null
		,secure: false
	},opt_);
    
	var cookie = [
		escape(opt.name)
		,'='
		,escape(opt.value)
	];

	// Expiry
	if( null !== opt.end ) {
		switch( typeof(opt.end) ) {  
			case "number": 
				cookie.push('; max-age=' + opt.end); 
				break;  
			case "string": 
				cookie.push('; expires=' + opt.end);
				break;  
			case "object": 
				if( opt.end.hasOwnProperty("toGMTString") ) { 
					cookie.push('; expires=' + opt.end.toGMTString());
				}; 
				break;  
		};
	};
	
	// Domain
	if( opt.domain ) {
		cookie.push('; domain=' + opt.domain);
	};
	
	// path
	if( opt.path ) {
		cookie.push('; path=' + opt.path);
	};
	
	// path
	if( opt.secure ) {
		cookie.push('; secure');
	};
	
    document.cookie = cookie.join('');
};

function deleteCookie(name) {
	document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};

$n2.cookie = {
	getCookies: getCookies
	,getCookie: getCookie
	,setCookie: setCookie
	,deleteCookie: deleteCookie
};
	
})(nunaliit2);