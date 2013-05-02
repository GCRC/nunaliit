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

$Id: n2.url.js 8165 2012-05-31 13:14:37Z jpfiset $
*/
;(function($n2){

var Url = $n2.Class({
	
	options: null
	
	,initialize: function(options_){
		this.options = $n2.extend({
			url: null // String
		},options_);
	}

	,getUrl: function(){
		return this.options.url;
	}

	,getUrlWithoutHash: function() {
		var href = this.getUrl();

		var index = href.indexOf('#');
		if( index >= 0 ) {
			href = href.substr(0,index);
		};
		
		return href;
	}

	,getUrlWithoutParams: function() {
		var href = this.getUrlWithoutHash();
		
		var index = href.indexOf('?');
		if( index >= 0 ) {
			href = href.substr(0,index);
		};
		
		return href;
	}

	,getParams: function() {
		var result = {};
		var href = this.getUrlWithoutHash();
		var paramsString = href.slice(href.indexOf('?') + 1);
		var params = paramsString.split('&');
		for(var loop=0; loop<params.length; ++loop) {
			var s = params[loop].split('=');
			var key = decodeURI(s[0]);
			var value = decodeURI(s[1]);
			if( null == result[key] ) {
				result[key] = [];
			}
			result[key].push( value );
		}
		return result;
	}
		
	,getParam: function(name) {
		var params = this.getParams();
		if( null == params[name] ) {
			return [];
		}
		return params[name];
	}

	,getParamValue: function(name, defaultValue) {
		var params = this.getParams();
		if( null == params[name] ) {
			return defaultValue;
		}
		return params[name][0];
	}
});	
	
$n2.url = {
	Url: Url
	
	,getCurrentLocation: function(){
		return new Url({
			url: window.location.href
		});
	}

	,getUrlWithoutHash: function() {
		return $n2.url.getCurrentLocation().getUrlWithoutHash();
	}
	
	,getUrlWithoutParams: function() {
		return $n2.url.getCurrentLocation().getUrlWithoutParams();
	}

	,getParams: function() {
		return $n2.url.getCurrentLocation().getParams();
	}
		
	,getParam: function(name) {
		return $n2.url.getCurrentLocation().getParam(name);
	}

	,getParamValue: function(name, defaultValue) {
		return $n2.url.getCurrentLocation().getParamValue(name, defaultValue);
	}
};

})(nunaliit2);