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

function getScriptLocation(scriptName) {
	var result = null;
	
	if( typeof document === 'object' ) {
		var pattern = new RegExp("(^|(.*?\\/))"+scriptName+"$");
	 
		var scripts = document.getElementsByTagName('script');
		for( var loop=0; loop<scripts.length; ++loop ) {
			var src = scripts[loop].getAttribute('src');
			if (src) {
				var match = src.match(pattern);
				if( match ) {
					result = {
						location: match[1]
						,elem: scripts[loop]
					};
					break;
				};
			};
		};
	};

	return result;
};

function getCoreScriptLocation() {
	if( typeof nunaliit2CoreScript === 'string' ){
		return getScriptLocation(nunaliit2CoreScript);
	};
	
	return null;
};

function loadScript(scriptUrl, refLocation, insertAfter) {
	var scriptElem = null;
	
	if( typeof refLocation === 'boolean' ){
		insertAfter = refLocation;
		refLocation = undefined;
	} else if( typeof refLocation === 'undefined' ) {
		insertAfter = false;
	}

	var scriptElems = document.getElementsByTagName('script');
	if( scriptElems.length > 0 ){
		scriptElem = scriptElems.item(scriptElems.length - 1);
	};
	
	if( refLocation && refLocation.elem ) {
		scriptElem = refLocation.elem;
	};

	if( scriptElem ){
		var s = document.createElement('script');
		s.setAttribute('src',scriptUrl);
		s.setAttribute('type','text/javascript');
		if( insertAfter ){
			scriptElem.parentNode.insertBefore(s,scriptElem.nextSibling);
		} else {
			scriptElem.parentNode.insertBefore(s,scriptElem);
		};
	};
};

function _loadedScript(url){
	var customScript = customScriptsByUrl[url];
	if( customScript ){
		customScript.loaded = true;
	};
};

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
			s.src = location + url;
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

$n2.scripts = {
	getScriptLocation: getScriptLocation
	,getCoreScriptLocation: getCoreScriptLocation
	,loadScript: loadScript
	,loadCustomScripts: loadCustomScripts
	,areAllCustomScriptsLoaded: areAllCustomScriptsLoaded 
};

})(nunaliit2);
