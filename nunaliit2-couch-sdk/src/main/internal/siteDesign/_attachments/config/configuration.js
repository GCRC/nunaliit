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

$Id$
*/

var nunaliitConfigCompleted = false;

function nunaliitConfigure(opts_) {
	if( nunaliitConfigCompleted ) return;
	
	if( window.OpenLayers
	 && typeof(nunaliit2) === 'function'
	 && nunaliit2.mapAndControls
	 && nunaliit2.couch
	 ) {
	 	$n2 = window.nunaliit2;
		
	 	var opts = $n2.extend({
	 		configuredFunction: function(){}
	 		,rootPath: './'
	 	},opts_);

	 	var confOptions = {
			couchServerUrl: opts.rootPath + 'server/'
			,atlasDbUrl: opts.rootPath + 'db/'
			,atlasDesignName: 'atlas'
			,progressServerUrl: opts.rootPath + 'servlet/progress/'
			,mediaUrl: opts.rootPath + 'media/'
			,uploadServerUrl: opts.rootPath + 'servlet/upload/'
			,exportServerUrl: opts.rootPath + 'servlet/export/'
			,userServerUrl: opts.rootPath + 'servlet/user/'
	 		,onSuccess: opts.configuredFunction
	 	};
	 	
	 	if( n2atlas
	 	 && n2atlas.submissionDbEnabled ){
	 		confOptions.submissionDbUrl = opts.rootPath + 'submitDb';
	 	};

	 	$n2.couchConfiguration.Configure(confOptions);
	 
	 	nunaliitConfigCompleted = true;
	} else {
		setTimeout(function(){
			nunaliitConfigure(opts_);
		}, 100);
	};
};

function runConfiguration(opts_) {
	function callback(){
		nunaliit2.log('DEPRECATED: "runConfiguration" is deprecated. Use "nunaliitConfigure", instead.');
		if( 'function' === typeof(opts_.configuredFunction) ){
			opts_.configuredFunction.apply(this,arguments);
		};
	};
	
	nunaliitConfigure({
 		configuredFunction: callback
		,rootPath: opts_.rootPath
	});
};
