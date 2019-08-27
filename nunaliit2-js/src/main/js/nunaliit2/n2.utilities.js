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
 ,DH = 'n2.utilities'
 ;

//--------------------------------------------------------------------------
var AssignLayerOnDocumentCreation = $n2.Class({
		
	layerId: null,
	
	onlyWithGeometries: null,

	dispatchService: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			layerId: null
			,onlyWithGeometries: false
			,dispatchService: null
		},opts_);
		
		var _this = this;
		
		this.layerId = opts.layerId;
		this.onlyWithGeometries = opts.onlyWithGeometries;
		this.dispatchService = opts.dispatchService;
			
		// Register to events
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};

			this.dispatchService.register(DH,'preDocCreation',f);
		};
		
		$n2.log('AssignLayerOnDocumentCreation', this);
	},
	
	_handle: function(m, addr, dispatcher){
		if( 'preDocCreation' === m.type ){
			var createdDoc = m.doc;
			
			var addLayer = true;
			if( this.onlyWithGeometries ){
				if( createdDoc.nunaliit_geom ){
					
				} else {
					addLayer = false;
				};
			};

			if( addLayer ){
				if( !createdDoc.nunaliit_layers ){
					createdDoc.nunaliit_layers = [];
				};
				
				if( this.layerId ){
					if( createdDoc.nunaliit_layers.indexOf(this.layerId) < 0 ){
						createdDoc.nunaliit_layers.push(this.layerId);
					};
				};
			};
		};
	}
});

//--------------------------------------------------------------------------
var SelectDocumentOnModuleIntroduction = $n2.Class({
		
	docIds: null,

	dispatchService: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			docId: null
			,docIds: null
			,dispatchService: null
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.docIds = [];
		
		this.moduleStarted = false;
		
		if( typeof opts.docId === 'string' ){
			this.docIds.push(opts.docId);
		};
		if( $n2.isArray(opts.docIds) ){
			for(var i=0,e=opts.docIds.length; i<e; ++i){
				var docId = opts.docIds[i];
				if( typeof docId === 'string' ){
					this.docIds.push(docId);
				};
			};
		};
			
		// Register to events
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};

			this.dispatchService.register(DH,'modulePerformIntroduction',f);
		};
		
		$n2.log('SelectDocumentOnModuleIntroduction', this);
	},
	
	_handle: function(m, addr, dispatcher){
		if( 'modulePerformIntroduction' === m.type ){
			if( !m.performed ){
				if( this.docIds.length > 1 ){
					m.performed = true;
					this.dispatchService.send(DH,{
						type: 'selected'
						,docIds: this.docIds
					});
	
				} else if( this.docIds.length > 0 ){
					m.performed = true;
					this.dispatchService.send(DH,{
						type: 'selected'
						,docId: this.docIds[0]
					});
				};
			};
		};
	}
});

//--------------------------------------------------------------------------
// This utility performs a document selection when the current selection on a filter
// is changed. In this case, a filter refers to a document model of type 
// SelectableDocumentFilter. This utility is configured with a map of choices pointing
// to a document identifier. If the choices match, then the utility sends a
// selection on the associated document.
// The selection map is structured in such a way that the key is the identifier
// of the document to be selected. The values in the map can be a string or an 
// array of strings. These are the choices selected in the associated filter
// model.
// For example:
// {
//     "utilityType": "selectDocumentOnFilterChange"
//     ,"sourceModelId": "filterDocsByLayer"
//     ,"performSelectedEvent": false
//     ,"selectionMap": {
//    	  "123": "public"
//    	  ,"456": "approved"
//    	  ,"789": [ "public", "approved" ]
//     }
// }
var SelectDocumentOnFilterChange = $n2.Class('SelectDocumentOnFilterChange',{
		
	dispatchService: null,
	
	sourceModelId: null,
	
	selectionToDocId: null,
	
	/**
	 * Name of event used by source model to report changes in choices
	 */
	selectedChoicesChangeEventName: null,
	
	/**
	 * If set, send a 'selected' event instead of a 'userSelect' event.
	 */
	performSelectedEvent: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: undefined
			,sourceModelId: undefined
			,selectionMap: undefined
			,performSelectedEvent: undefined
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		
		if( typeof opts.sourceModelId === 'string' ){
			this.sourceModelId = opts.sourceModelId;
		} else {
			throw new Error('In configuration for SelectDocumentOnFilterChange, sourceModelId must be specified as a string');
		};
		
		this.selectionToDocId = {};
		if( opts.selectionMap && typeof opts.selectionMap === 'object' ){
			for(var docId in opts.selectionMap){
				var selection = opts.selectionMap[docId];
				var selectionString = this._selectionToString(selection);
				if( selectionString ){
					this.selectionToDocId[selectionString] = docId;
				};
			};
		};
		
		this.performSelectedEvent = false;
		if( opts.performSelectedEvent ){
			this.performSelectedEvent = true;
		};
		
		// Register to events
		if( this.dispatchService && this.sourceModelId ){
			var fn = function(m, addr, dispatcher){
				_this._handleFilterChange(m, addr, dispatcher);
			};
			
			// Get model info
			var modelInfoRequest = {
				type: 'modelGetInfo'
				,modelId: this.sourceModelId
				,modelInfo: null
			};
			this.dispatchService.synchronousCall(DH, modelInfoRequest);
			var sourceModelInfo = modelInfoRequest.modelInfo;
			
			if( sourceModelInfo 
			 && sourceModelInfo.parameters 
			 && sourceModelInfo.parameters.selectedChoices ){
				var paramInfo = sourceModelInfo.parameters.selectedChoices;
				this.selectedChoicesChangeEventName = paramInfo.changeEvent;
			};
			
			if( this.selectedChoicesChangeEventName ){
				this.dispatchService.register(DH, this.selectedChoicesChangeEventName, fn);
			};
		};
		
		$n2.log(this._classname, this);
	},
	
	_handleFilterChange: function(m, addr, dispatcher){
		if( this.selectedChoicesChangeEventName === m.type ){
			if( m.value ){
				var selection = m.value;
				var selectionString = this._selectionToString(selection);
				var docId = this.selectionToDocId[selectionString];
				if( docId ){
					var eventType = 'userSelect';
					if( this.performSelectedEvent ){
						eventType = 'selected';
					};

					this.dispatchService.send(DH, {
						type: eventType
						,docId: docId
					});
				};
			};
		};
	},
	
	/**
	 * Turns an array of selectors into a single string. First, sorts
	 * the items in array. Then, escapes each string. Finally, concatenate
	 * each string using a separator.
	 * 
	 * 'abc' -> 'abc'
	 * [ 'def', 'abc' ] -> 'abc|def'
	 * [ 'a|b', 'c|d' ] -> 'a||b|c||d'
	 */
	_selectionToString: function(selection){
		var _this = this;

		var selectionString = undefined;
		
		if( typeof selection === 'string' ){
			selectionString = this._escapeSelector(selection);

		} else if( $n2.isArray(selection) ){
			var effectiveSelection = [];
			selection.forEach(function(sel){
				if( typeof sel === 'string' ){
					effectiveSelection.push( _this._escapeSelector(sel) );
				};
			});

			effectiveSelection.sort();
			
			selectionString = effectiveSelection.join('|');
		};
		
		return selectionString;
	},
	
	_escapeSelector: function(sel){
		return sel.replace(/\|/g, 'oranges');
	}
});

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
			this.dispatchService.register(DH,'utilityCreate',f);
		};
	},
	
	_handle: function(m, addr, dispatcher){
		if( 'utilityCreate' === m.type ){
			if( ! m.utilityType ){
				$n2.log('utilityType must be provided when creating a utility');
				return;
			};
			
			if( 'assignLayerOnDocumentCreation' === m.utilityType ){
				var options = {};
				
				if( typeof m.utilityOptions === 'object' ){
					for(var key in m.utilityOptions){
						var value = m.utilityOptions[key];
						options[key] = value;
					};
				};
				
				if( m.config ){
					if( m.config.directory ){
						options.dispatchService = m.config.directory.dispatchService;
					};
				};
				
		        new AssignLayerOnDocumentCreation(options);
		        
		        m.created = true;

			} else if( 'selectDocumentOnModuleIntroduction' === m.utilityType ){
				var options = {};
				
				if( typeof m.utilityOptions === 'object' ){
					for(var key in m.utilityOptions){
						var value = m.utilityOptions[key];
						options[key] = value;
					};
				};
				
				if( m.config ){
					if( m.config.directory ){
						options.dispatchService = m.config.directory.dispatchService;
					};
				};
				
		        new SelectDocumentOnModuleIntroduction(options);
		        
		        m.created = true;

			} else if( 'selectDocumentOnFilterChange' === m.utilityType ){
				var options = {};
				
				if( typeof m.utilityOptions === 'object' ){
					for(var key in m.utilityOptions){
						var value = m.utilityOptions[key];
						options[key] = value;
					};
				};
				
				if( m.config ){
					if( m.config.directory ){
						options.dispatchService = m.config.directory.dispatchService;
					};
				};
				
		        new SelectDocumentOnFilterChange(options);
		        
		        m.created = true;

			} else {
				if( $n2.mapUtilities 
				 && typeof $n2.mapUtilities.HandleUtilityCreateRequests === 'function' ){
					$n2.mapUtilities.HandleUtilityCreateRequests(m, addr, dispatcher);
				};

				if( $n2.utilitiesModel 
				 && typeof $n2.utilitiesModel.HandleUtilityCreateRequests === 'function' ){
					$n2.utilitiesModel.HandleUtilityCreateRequests(m, addr, dispatcher);
				};
				
				if( $n2.utilitiesChangeDetectors
					&& typeof $n2.utilitiesChangeDetectors.HandleUtilityCreateRequests === 'function' ){
					$n2.utilitiesChangeDetectors.HandleUtilityCreateRequests(m, addr, dispatcher);
				};
		    };
		};
	}
});

//--------------------------------------------------------------------------
$n2.utilities = {
	Service: Service
	,AssignLayerOnDocumentCreation: AssignLayerOnDocumentCreation
	,SelectDocumentOnModuleIntroduction: SelectDocumentOnModuleIntroduction
	,SelectDocumentOnFilterChange: SelectDocumentOnFilterChange
};

})(jQuery,nunaliit2);
