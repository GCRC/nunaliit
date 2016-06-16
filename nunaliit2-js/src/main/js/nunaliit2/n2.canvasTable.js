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

;(function($,$n2) {
"use strict";

var 
 _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); }
 ,DH = 'n2.canvasTable'
 ,uniqueId = 0
 ;
 
var $d = undefined;


// --------------------------------------------------------------------------
/* 
 This canvas displays tabular data in an HTML table. The elements from the generators
 represent rows in a table. Each row has a number of cells, which are the values found
 under each heading.

 Elements are expected to have the following format:
{
	id: <string>  (Unique identifier for this element)
	cells: {
		"heading1": "value1"
		,"heading2": "value2"
	}
}

Here are attributes added by the canvas:
{
}

*/
var TableCanvas = $n2.Class({

	canvasId: null,
 	
	sourceModelId: null,

	elementGenerator: null,

	dispatchService: null,
	
	elementsById: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			canvasId: null
			,sourceModelId: null
			,elementGenerator: null
			,dispatchService: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);
 		
		var _this = this;
		
		this.canvasId = opts.canvasId;
		this.sourceModelId = opts.sourceModelId;
		this.elementGenerator = opts.elementGenerator;
		this.dispatchService = opts.dispatchService;
		
		this.elementsById = {};
 		
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
 		
 		this.createGraph();
 		
 		opts.onSuccess();

 		if( this.sourceModelId ){
 			if( this.dispatchService ){
 				var msg = {
 					type: 'modelGetState'
 					,modelId: this.sourceModelId
 					,state: null
 				};
 				this.dispatchService.synchronousCall(DH,msg);
 				if( msg.state ){
 					this._sourceModelUpdated(msg.state);
 				};
 			};
 		};

 		$n2.log('TableCanvas',this);
 	},
	
	_getElem: function(){
		var $elem = $('#'+this.canvasId);
		if( $elem.length < 1 ){
			return undefined;
		};
		return $elem;
	},
 	
 	createGraph: function() {
		var _this = this;
		
		var $elem = this._getElem();
		if( $elem ){
			$elem
				.empty()
				.addClass('n2TableCanvas')
				.click(function(e){
					_this._backgroundClicked();
				});

			$('<table>')
				.appendTo($elem);
		};
 	},

 	_elementsChanged: function(addedElements, updatedElements, removedElements){

		// Remove elements that are no longer there
		for(var i=0,e=removedElements.length; i<e; ++i){
			var removed = removedElements[i];
			delete this.elementsById[removed.id];
		};
		
		// Add elements
		for(var i=0,e=addedElements.length; i<e; ++i){
			var added = addedElements[i];
			this.elementsById[ added.id ] = added;
		};
		
		// Update elements
		for(var i=0,e=updatedElements.length; i<e; ++i){
			var updated = updatedElements[i];
			this.elementsById[ updated.id ] = updated;
		};

		this._redraw();
	},
	
	_redraw: function(){
		var _this = this;

	},

	_intentChanged: function(changedElements){
	},
 	
 	_sourceModelUpdated: function(opts_){
 		this.elementGenerator.sourceModelUpdated(opts_);
 	},

 	_handleDispatch: function(m){
 		if( 'modelGetInfo' === m.type ){
 			if( m.modelId === this.modelId ){
 				m.modelInfo = this._getModelInfo();
 			};
 			
 		} else if( 'modelStateUpdated' === m.type ) {
 			if( this.sourceModelId === m.modelId ){
 				if( m.state ){
 					this._sourceModelUpdated(m.state);
 				};
 			};
 		};
 	}
});
 
//--------------------------------------------------------------------------
function HandleCanvasAvailableRequest(m){

	if( m.canvasType === 'table' ){
		m.isAvailable = true;
	};
};

//--------------------------------------------------------------------------
function HandleCanvasDisplayRequest(m){
	if( m.canvasType === 'table' ){
		
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
		options.interactionId = m.interactionId;
		options.moduleDisplay = m.moduleDisplay;
		options.onSuccess = m.onSuccess;
		options.onError = m.onError;

		if( m.config ){
			if( m.config.directory ){
				options.dispatchService = m.config.directory.dispatchService;
			};
		};
		
		new TableCanvas(options);
	};
};

//--------------------------------------------------------------------------
$n2.canvasTable = {
	TableCanvas: TableCanvas
	,HandleCanvasAvailableRequest: HandleCanvasAvailableRequest
	,HandleCanvasDisplayRequest: HandleCanvasDisplayRequest
};

})(jQuery,nunaliit2);
