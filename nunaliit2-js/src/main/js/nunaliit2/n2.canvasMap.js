/*
Copyright (c) 2018, Geomatics and Cartographic Research Centre, Carleton 
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
 ,DH = 'n2.canvasMap'
 ;

// --------------------------------------------------------------------------
/* 
This canvas displays a map based on OpenLayers5.  

*/
var MapCanvas = $n2.Class('MapCanvas',{

	canvasId: null,

	sourceModelId: null,
	
	elementGenerator: null,

	dispatchService: null,

	showService: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			canvasId: undefined
			,sourceModelId: undefined
			,elementGenerator: undefined
			,config: undefined
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);

		var _this = this;
		
		try {
			this.canvasId = opts.canvasId;
			this.sourceModelId = opts.sourceModelId;
			this.elementGenerator = opts.elementGenerator;
	
			var config = opts.config;
			if( config ){
				if( config.directory ){
					this.dispatchService = config.directory.dispatchService;
					this.showService = config.directory.showService;
				};
			};
		
			// Element generator
			if( this.elementGenerator ){
				this.elementGenerator.setElementsChangedListener(function(added, updated, removed){
					_this._elementsChanged(added, updated, removed);
				});
				this.elementGenerator.setIntentChangedListener(function(updated){
					_this._intentChanged(updated);
				});
			};
	
			// Register to events
			if( this.dispatchService ){
				var f = function(m){
					_this._handleDispatch(m);
				};
				
				this.dispatchService.register(DH,'modelGetInfo',f);
				this.dispatchService.register(DH,'modelStateUpdated',f);
			};
			
			$n2.log(this._classname,this);
			
			this._drawMap();
			
		} catch(e) {
			var error = new Error('Unable to create '+this._classname+': '+err);
			opts.onError(error);
		};
		
		opts.onSuccess();
	},

	_getElem: function(){
		var $elem = $('#'+this.canvasId);
		if( $elem.length < 1 ){
			return undefined;
		};
		return $elem;
	},

	_drawMap: function() {
		var map = new ol.Map({
			target: this.canvasId,
			layers: [
				new ol.layer.Tile({
					source: new ol.source.OSM()
				})
			],
			view: new ol.View({
				center: ol.proj.fromLonLat([37.41, 8.82]),
				zoom: 4
			})
		});
	},

	_handleDispatch: function(m, addr, dispatcher){
		
	}
});
 
//--------------------------------------------------------------------------
function HandleCanvasAvailableRequest(m){
	if( m.canvasType === 'map' ){
		m.isAvailable = true;
	};
};

//--------------------------------------------------------------------------
function HandleCanvasDisplayRequest(m){
	if( m.canvasType === 'map' ){
		
		var options = {};
		if( m.canvasOptions ){
			for(var key in m.canvasOptions){
				options[key] = m.canvasOptions[key];
			};
		};
		
 		if( !options.elementGenerator ){
 			// If not defined, use the one specified by type
 			options.elementGenerator = $n2.canvasElementGenerator.CreateElementGenerator({
 	 			type: options.elementGeneratorType
 	 			,options: options.elementGeneratorOptions
 	 			,config: m.config
 	 		});
 		};
 		
		options.canvasId = m.canvasId;
		options.config = m.config;
		options.onSuccess = m.onSuccess;
		options.onError = m.onError;
		
		new MapCanvas(options);
	};
};

//--------------------------------------------------------------------------
$n2.canvasMap = {
	MapCanvas: MapCanvas
	,HandleCanvasAvailableRequest: HandleCanvasAvailableRequest
	,HandleCanvasDisplayRequest: HandleCanvasDisplayRequest
};

})(jQuery,nunaliit2);
