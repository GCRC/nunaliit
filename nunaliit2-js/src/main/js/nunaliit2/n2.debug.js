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
;(function($n2){
"use strict";

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); }
,DH = 'n2.debug'
;

//==================================================================
var DebugConfiguration = $n2.Class({

	initialize: function(opts_){
		var opts = $n2.extend({

		},opts_);
	},

	loadConfiguration: function(){
		var localStorage = $n2.storage.getLocalStorage();

		var debugConfStr = localStorage.getItem('n2debug_configuration');

		var debugConf = undefined;
		if( debugConfStr ){
			try {
				debugConf = JSON.parse(debugConfStr);
			} catch(e) {
				$n2.log('Unable to parse Debug configuration:'+e);
			};
		};

		if( !debugConf ){
			debugConf = {};
		};

		return debugConf;
	},

	saveConfiguration: function(debugConf){
		var localStorage = $n2.storage.getLocalStorage();

		var debugConfStr = JSON.stringify(debugConf);
		localStorage.setItem('n2debug_configuration',debugConfStr);
	},

	deleteConfiguration: function(){
		var localStorage = $n2.storage.getLocalStorage();
		localStorage.removeItem('n2debug_configuration');
	},

	isBadProxyEnabled: function(){
		var debugConf = this.loadConfiguration();
		if( debugConf.badProxy ) return true;
		return false;
	},

	setBadProxyEnabled: function(flag){
		var debugConf = this.loadConfiguration();
		if( flag ){
			debugConf.badProxy = true;
		} else if( debugConf.badProxy ){
			delete debugConf.badProxy;
		};
		this.saveConfiguration(debugConf);
	},

	isEventLoggingEnabled: function(){
		var debugConf = this.loadConfiguration();
		if( debugConf.logging ) return true;
		return false;
	},

	setEventLoggingEnabled: function(flag){
		var debugConf = this.loadConfiguration();
		if( flag ){
			debugConf.logging = true;
		} else if( debugConf.logging ){
			delete debugConf.logging;
		};
		this.saveConfiguration(debugConf);
	},

	isCouchDbCachingEnabled: function(){
		var debugConf = this.loadConfiguration();
		if( debugConf.couchDbCaching ) return true;
		return false;
	},

	setCouchDbCachingEnabled: function(flag){
		var debugConf = this.loadConfiguration();
		if( flag ){
			debugConf.couchDbCaching = true;
		} else if( debugConf.couchDbCaching ){
			delete debugConf.couchDbCaching;
		};
		this.saveConfiguration(debugConf);
	},

	isCouchDbCachingDisabled: function(){
		var debugConf = this.loadConfiguration();
		if( debugConf.disableCouchDbCaching ) return true;
		return false;
	},

	setCouchDbCachingDisabled: function(flag){
		var debugConf = this.loadConfiguration();
		if( flag ){
			debugConf.disableCouchDbCaching = true;
		} else if( debugConf.disableCouchDbCaching ){
			delete debugConf.disableCouchDbCaching;
		};
		this.saveConfiguration(debugConf);
	},

	forceSlowConnectionHandling: function(){
		var debugConf = this.loadConfiguration();
		if( debugConf.forceSlowConnectionHandling ) return true;
		return false;
	},

	setForceSlowConnectionHandling: function(flag){
		var debugConf = this.loadConfiguration();
		if( flag ){
			debugConf.forceSlowConnectionHandling = true;
		} else if( debugConf.forceSlowConnectionHandling ){
			delete debugConf.forceSlowConnectionHandling;
		};
		this.saveConfiguration(debugConf);
	}
});


//*******************************************************
$n2.debug = {
	DebugConfiguration: DebugConfiguration
	,setBadProxy: function(flag){
		var debugConf = new DebugConfiguration();
		debugConf.setBadProxyEnabled(flag);
	}
};

})(nunaliit2);
