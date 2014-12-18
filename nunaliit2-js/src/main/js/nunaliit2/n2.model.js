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

;(function($,$n2) {
"use strict";

var 
 _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); }
 ,DH = 'n2.model'
 ;
 
//--------------------------------------------------------------------------
var Service = $n2.Class({
	
	dispatchService: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		
		// Register to events
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			this.dispatchService.register(DH,'modelCreate',f);
		};
	},
	
	_handle: function(m, addr, dispatcher){
		if( 'modelCreate' === m.type ){
			if( ! m.modelType ){
				$n2.log('modelType must be provided when creating a model');
				return;
			};
			if( ! m.modelId ){
				$n2.log('modelId must be provided when creating a model: '+m.modelType);
				return;
			};
			if( m.modelType === 'dbPerspective' ){
		        this._createDbPerspective(m);
		    };
		};
	},
	
	_createDbPerspective: function(m){
		if( $n2.couchDbPerspective 
		 && $n2.couchDbPerspective.DbPerspective ){
			try {
				var options = {
					modelId: m.modelId
				};
				
				if( m && m.config ){
					options.atlasDesign = m.config.atlasDesign;
					
					if( m.config.directory ){
						options.dispatchService = m.config.directory.dispatchService;
					};
				};
				
				var dbPerspective = new $n2.couchDbPerspective.DbPerspective(options);
				
				// Load layers
				if( m.modelOptions 
				 && m.modelOptions.layers ){
					var layers = m.modelOptions.layers;
					for(var i=0,e=layers.length; i<e; ++i){
						var layerConfigObj = layers[i];
						dbPerspective.addDbSelectorFromConfigObject(layerConfigObj);
					};
				};
				
				m.created = true;
			} catch(err) {
				$n2.log('Error while creating model: '+m.modelType+'/'+m.modelId);
			};
		} else {
			$n2.log('Can not create model: '+m.modelType+'. DbPerspective is not available');
		};
	}
});

//--------------------------------------------------------------------------
$n2.model = {
	Service: Service
};

})(jQuery,nunaliit2);
