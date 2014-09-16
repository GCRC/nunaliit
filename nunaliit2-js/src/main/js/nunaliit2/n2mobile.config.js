/*
Copyright (c) 2014, Geomatics and Cartographic Research Centre, Carleton 
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

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-mobile',args); };

function Configure(opts_) {
	var opts = $n2.extend({
		couchDbUrl: null
		,onSuccess: function(config){}
		,onError: function(err){}
	},opts_);
	
	var config = {
		directory: {}
	};
	
	config.directory.dispatchService = new $n2.dispatch.Dispatcher();
	
	// Obtain couch server
	$n2.couch.getServer({
		pathToServer: opts.couchDbUrl
		,onSuccess: couchServerCreated
		,onError: function(err){
            opts.onError('unable to connect to couchDb server: ' + err);
		}
	});
	
	function couchServerCreated(server){
		config.directory.couchServer = server;
		
		// Get configuration database
		config.directory.configDb = new $n2.mobileConfigDb.ConfigDb({
			couchServer: config.directory.couchServer
		});
		
		// Ensure that it is created
		config.directory.configDb.createDb({
			onSuccess: configDbCreated
			,onError: function(err){
	            opts.onError('unable to create config database: ' + err);
			}
		})
	};
	
	function configDbCreated(){
	
		done();
	};
	
	function done(){
		opts.onSuccess(config);
	};
};

//======================= EXPORT ========================
$n2.mobileConfig = {
	Configure: Configure
};

})(nunaliit2);