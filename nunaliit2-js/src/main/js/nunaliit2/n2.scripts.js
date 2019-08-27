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

var customScriptsByUrl = {};

//=====================================================================
/**
 * Return true if the URL is associated with a global resource
 * (as opposed to a relative URL)
 */
function isContextIndependentURL(url){
	var prefixes = [
		"http://"
		,"https://"
	];
	
	for(var i in prefixes){
		var prefix = prefixes[i];
		
		// If URL starts with prefix, then is is context independent
		if( url.substr(0,prefix.length) === prefix ){
			return true;
		};
	};
	
	return false;
};

//=====================================================================
function getScriptLocation(scriptName) {
	var scriptLocation = null;
	
	if( typeof document === 'object' ) {
		var pattern = new RegExp("(^|(.*?\\/))"+scriptName+"$");
	 
		var scripts = document.getElementsByTagName('script');
		for( var loop=0; loop<scripts.length; ++loop ) {
			var src = scripts[loop].getAttribute('src');
			if (src) {
				var match = src.match(pattern);
				if( match ) {
					scriptLocation = {
						location: match[1]
						,elem: scripts[loop]
					};
					break;
				};
			};
		};
	};

	return scriptLocation;
};

//=====================================================================
function getCoreScriptLocation() {
	if( typeof $n2.coreScriptName === 'string' ){
		return getScriptLocation($n2.coreScriptName);
	};
	
	return null;
};

//=====================================================================
function getFirstScriptLocation() {
	var scriptLocation;

	if( typeof document === 'object' ) {
		var scripts = document.getElementsByTagName('script');
		if( scripts.length > 0 ){
			var scriptElem = scripts.item(0);
			scriptLocation = {
				location: scriptElem.getAttribute('src')
				,elem: scriptElem
			};
		};
	};
	
	return scriptLocation;
};

//=====================================================================
function loadScript(opts_) {
	var opts = $n2.extend({
		url: null
		,scriptLocation: null
		,onLoaded: null
		,onError: null
	},opts_);
	
	var scriptUrl = opts.url;
	var refLocation = opts.scriptLocation;

	var scriptElems = document.getElementsByTagName('script');
	var scriptElem = scriptElems.item( scriptElems.length - 1 );
	if( refLocation && refLocation.elem ) {
		scriptElem = refLocation.elem;
	};

	var s = document.createElement('script');
	s.src = scriptUrl;
	s.type = 'text/javascript';
	
	if( typeof s.addEventListener === 'function' ){
		if( typeof opts.onLoaded === 'function' ){
			s.addEventListener('load',opts.onLoaded);
		};
		if( typeof opts.onError === 'function' ){
			s.addEventListener('error',opts.onError);
		};
	} else {
		if( typeof opts.onLoaded === 'function' ){
			s.onload = opts.onLoaded;
		};
		if( typeof opts.onError === 'function' ){
			s.onerror = opts.onError;
		};
	};
	
	scriptElem.parentNode.insertBefore(s,scriptElem);
};

//=====================================================================
function _loadedScript(url){
	var customScript = customScriptsByUrl[url];
	if( customScript ){
		customScript.loaded = true;
	};
};

//=====================================================================
function loadCustomScripts(scriptUrls) {
	var scriptElems = document.getElementsByTagName('script');
	var insertBeforeElem = scriptElems.item( scriptElems.length - 1 );
	var location = '';

	var nunaliitCustomLocation = getScriptLocation('nunaliit_custom.js');
	if( nunaliitCustomLocation && nunaliitCustomLocation.elem ) {
		insertBeforeElem = nunaliitCustomLocation.elem;
		location = nunaliitCustomLocation.location;
	};
	
	// Convert string urls into request objects
	if( typeof scriptUrls === 'string' ){
		// Convert single string into an array
		scriptUrls = [scriptUrls];
	};
	if( $n2.isArray(scriptUrls) ){
		for(var i=0,e=scriptUrls.length; i<e; ++i){
			var scriptUrl = scriptUrls[i];
			if( typeof scriptUrl === 'string' ){
				var request = {
					url: scriptUrl
					,requiredForConfiguration: true
				};
				scriptUrls[i] = request;
			};
		};
	};
	
	if( $n2.isArray(scriptUrls) ){
		// Accumulate scripts to install
		var requestsToInstall = [];
		for(var i=0,e=scriptUrls.length; i<e; ++i){
			var request = $n2.extend({
				url: null
				,requiredForConfiguration: true
			},scriptUrls[i]);

			var url = request.url;
			if( url ){
				if( customScriptsByUrl[url] ){
					// Already requested. Nothing to do
				} else {
					customScriptsByUrl[url] = request;
					request.loaded = false;
					requestsToInstall.push(request);
				};
			};
		};

		for(var i=0,e=requestsToInstall.length; i<e; ++i){
			var request = requestsToInstall[i];
			var url = request.url;
			
			var s = document.createElement('script');
			if( isContextIndependentURL(url) ){
				s.src = url;
			} else {
				// relative URL must be fixed for location
				s.src = location + url;
			};
			s.type = 'text/javascript';
			var cb = getLoadedCallback(url);
			if( typeof s.addEventListener === 'function' ){
				s.addEventListener('load',cb);
				s.addEventListener('error',cb);
			} else {
				s.onload = cb;
				s.onerror = cb;
			};
			insertBeforeElem.parentNode.insertBefore(s,insertBeforeElem);
		};
	};
	
	function getLoadedCallback(url){
		return function(){
			_loadedScript(url);
			return true;
		};
	};
};

//=====================================================================
function areAllCustomScriptsLoaded(){
	var allLoaded = true;
	
	for(var url in customScriptsByUrl){
		var customScript = customScriptsByUrl[url];
		if( customScript.requiredForConfiguration 
		 && !customScript.loaded ){
			allLoaded = false;
		};
	};
	
	return allLoaded;
};

//=====================================================================
function loadGoogleMapApi(opts_){
	var opts = $n2.extend({
		googleMapApiKey: null
		,onLoaded: null
		,onError: null
	},opts_);
	
	// Check if Google Map is already loaded
	var googleMapScriptFound = false;
	if( typeof document === 'object' ) {
		var scripts = document.getElementsByTagName('script');
		for( var loop=0; loop<scripts.length; ++loop ) {
			var scriptElem = scripts.item(loop);
			var src = scriptElem.getAttribute('src');
			if( typeof src === 'string' ){
				if( src.indexOf('maps.google.com/maps/api/js') >= 0 ) {
					googleMapScriptFound = true;
				};
				if( src.indexOf('maps.googleapis.com/maps/api/js') >= 0 ) {
					googleMapScriptFound = true;
				};
			};
		};
	};
	if( googleMapScriptFound ){
		if( typeof opts.onError === 'function' ){
			opts.onError( 'Google Map API library already installed' );
			$n2.logError('Hint: remove Google Map script inclusion from HTML page');
		};
		return;
	};
	
	// Check if library is already loaded
	if( typeof window === 'object' 
	 && window.google 
	 && window.google.maps ){
		opts.onError( 'Google Map API library already loaded' );
		return;
	};
	
	// Attempt to load
	var firstScriptLocation = getFirstScriptLocation();
	var url = 'https://maps.googleapis.com/maps/api/js';
	if( typeof opts.googleMapApiKey === 'string' ){
		url += '?key='+opts.googleMapApiKey;
	};
	loadScript({
		url: url
		,scriptLocation: firstScriptLocation
		,onLoaded: opts.onLoaded
		,onError: opts.onError
	});
};

//=====================================================================
$n2.scripts = {
	getScriptLocation: getScriptLocation
	,getCoreScriptLocation: getCoreScriptLocation
	,getFirstScriptLocation: getFirstScriptLocation
	,loadScript: loadScript
	,loadCustomScripts: loadCustomScripts
	,areAllCustomScriptsLoaded: areAllCustomScriptsLoaded 
	,loadGoogleMapApi: loadGoogleMapApi 
};

})(nunaliit2);