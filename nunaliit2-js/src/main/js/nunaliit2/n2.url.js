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

*/
;(function($n2){
"use strict";

//-----------------------------------------------------
var Url = $n2.Class({
	
	url: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			url: null // String
		},opts_);
		
		this.url = opts.url;
	},
	
	clone: function(){
		return new Url({
			url: this.url
		});
	},

	getUrl: function(){
		return this.url;
	},

	getUrlWithoutCoordination: function() {
		var href = this.getUrl();

		var index = href.indexOf('@');
		if( index >= 0 ) {
			href = href.substr(0,index);
		};
		
		return href;
	},
	
	getCoordination: function() {
		var hash = undefined;
		
		var href = this.getUrl();
		var index = href.indexOf('@');
		if( index >= 0 ) {
			hash = href.substr(index+1);
		};
		
		return hash;
	},
	
	getUrlWithoutHash: function() {
		var href = this.getUrlWithoutCoordination();

		var index = href.indexOf('#');
		if( index >= 0 ) {
			href = href.substr(0,index);
		};
		
		return href;
	},

	getHash: function() {
		var hash = undefined;
		
		var href = this.getUrlWithoutCoordination();
		var index = href.indexOf('#');
		if( index >= 0 ) {
			hash = href.substr(index+1);
		};
		
		return hash;
	},

	setCoordination: function(coor) {
		var href = this.getUrl();
		var index = href.indexOf('@');
		
		if ( index >= 0 ){
			if ( coor ) {
				this.url = href.substr(0, index+1) + coor;
			} else {
				this.url = href.substr(0,index);
			}
		} else {
			// Currently, there is no hash...
			if( coor ){
				// ...add one
				this.url = href + '@' + coor;
			};
		};
	},
	
	setHash: function(hash) {
		var href = this.getUrl();
		var hrefWithoutCoor = this.getUrlWithoutCoordination();
		var hash_index = hrefWithoutCoor.indexOf('#');
		var coor_index = this.getUrl().indexOf('@');

		if( hash_index >= 0 ) {
			// There already exist a hash...
			if( hash ){
				// ...replace it
				this.url = hrefWithoutCoor.substr(0,index+1)+hash;
			} else {
				// ...remove it
				this.url = hrefWithoutCoor.substr(0,index);
			};
		} else {
			// Currently, there is no hash...
			if( hash ){
				// ...add one
				this.url = hrefWithoutCoor + '#' + hash;
			};
		};
		if ( coor_index >= 0){
			this.url += '@' + this.getCoordination();
		} else {
			
		}
		
		return this;
	},

	getUrlWithoutParams: function() {
		var href = this.getUrlWithoutHash();
		
		var index = href.indexOf('?');
		if( index >= 0 ) {
			href = href.substr(0,index);
		};
		
		return href;
	},

	getParams: function() {
		var result = {};

		var href = this.getUrlWithoutHash();
		var index = href.indexOf('?');
		if( index >= 0 ){
			var paramsString = href.slice(index + 1);
			var params = paramsString.split('&');
			for(var loop=0; loop<params.length; ++loop) {
				var s = params[loop].split('=');
				var key = decodeURIComponent(s[0]);
				var value = decodeURIComponent(s[1]);
				if( null == result[key] ) {
					result[key] = [];
				}
				result[key].push( value );
			}
		};

		return result;
	},
		
	getParam: function(name) {
		var params = this.getParams();
		if( null == params[name] ) {
			return [];
		}
		return params[name];
	},

	getParamValue: function(name, defaultValue) {
		var params = this.getParams();
		if( null == params[name] ) {
			return defaultValue;
		}
		return params[name][0];
	},
	
	setParamValue: function(name, value){
		var coor = this.getCoordination();
		var hash = this.getHash();
		var path = this.getUrlWithoutParams();
		var params = this.getParams();
		
		params[name] = [value];
		
		this._setUrlFromComponents(path, params, hash, coor);
		
		return this;
	},
	
	_setUrlFromComponents: function(path, params, hash, coor){
		var newUrl = [path];
		
		if( params ){
			var first = true;
			for(var name in params){
				var values = params[name];
				for(var i=0,e=values.length; i<e; ++i){
					var value = values[i];
					
					if( first ){
						first = false;
						newUrl.push('?');
					} else {
						newUrl.push('&');
					};
					
					newUrl.push( encodeURIComponent(name) );
					newUrl.push( '=' );
					newUrl.push( encodeURIComponent(value) );
				};
			};
		};
		
		if( hash ){
			newUrl.push( '#' );
			newUrl.push( hash );
		};
		
		if( coor ){
			newUrl.push( '@' );
			newUrl.push( coor );
		};
		
		this.url = newUrl.join('');
		
		return this;
	}
});	
	
//-----------------------------------------------------
// Exports
$n2.url = {
	Url: Url
	
	,getCurrentLocation: function(){
		if( typeof window === 'object' 
		 && window.location 
		 && window.location.href ) {
			return new Url({
				url: window.location.href
			});
		};
		
		return null;
	}

	,getUrlWithoutHash: function() {
		var loc = $n2.url.getCurrentLocation();
		return loc ? loc.getUrlWithoutHash() : null;
	}
	
	,getUrlWithoutParams: function() {
		var loc = $n2.url.getCurrentLocation();
		return loc ? loc.getUrlWithoutParams() : null;
	}

	,getParams: function() {
		var loc = $n2.url.getCurrentLocation();
		return loc ? loc.getParams() : {};
	}
		
	,getParam: function(name) {
		var loc = $n2.url.getCurrentLocation();
		return loc ? loc.getParam(name) : null;
	}

	,getParamValue: function(name, defaultValue) {
		var loc = $n2.url.getCurrentLocation();
		return loc ? loc.getParamValue(name, defaultValue) : defaultValue;
	}
};

})(nunaliit2);