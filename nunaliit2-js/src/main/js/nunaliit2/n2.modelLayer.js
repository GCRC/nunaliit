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
 ,DH = 'n2.modelLayer'
 ;
 
//--------------------------------------------------------------------------
// This is a document filter model. In other words, it accepts documents from
// a source model and makes those documents available to listeners. Since it 
// is a filter, the documents are sent or not to downstream listeners based on
// a boolean function.
//
// This layer filter selects documents based on the set of layerIds found in
// nunaliit_layers attribute
var LayerFilter = $n2.Class({
	
	dispatchService: null,
	
	modelId: null,
	
	sourceModelId: null,
	
	selectedLayers: null,
	
	selectedLayersParameter: null,

	availableLayers: null,

	availableLayersParameter: null,
	
	docInfosByDocId: null,
	
	modelIsLoading: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null
			,modelId: null
			,sourceModelId: null
		},opts_);
		
		var _this = this;

		this.docInfosByDocId = {};
		this.selectedLayers = {};
		this.availableLayers = {};
		this.modelIsLoading = false;
		
		this.dispatchService = opts.dispatchService;
		this.modelId = opts.modelId;
		this.sourceModelId = opts.sourceModelId;
		
		this.selectedLayersParameter = new $n2.model.ModelParameter({
			model: this
			,modelId: this.modelId
			,type: 'layerIds'
			,name: 'selectedLayers'
			,label: _loc('Layers')
			,setFn: this._setLayers
			,getFn: this.getLayers
			,dispatchService: this.dispatchService
		});
		
		this.availableLayersParameter = new $n2.model.ModelParameter({
			model: this
			,modelId: this.modelId
			,type: 'layerIds'
			,name: 'availableLayers'
			,label: _loc('Available Layers')
			,setFn: this._setAvailableLayers
			,getFn: this.getAvailableLayers
			,dispatchService: this.dispatchService
		});
		
		// Register to events
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			this.dispatchService.register(DH, 'modelGetInfo', f);
			this.dispatchService.register(DH, 'modelGetState', f);
			this.dispatchService.register(DH, 'modelStateUpdated', f);
			
			// Initialize state
			var m = {
				type:'modelGetState'
				,modelId: this.sourceModelId
			};
			this.dispatchService.synchronousCall(DH, m);
			if( m.state ){
				this._sourceModelUpdated(m.state);
			};
		};
		
		$n2.log('LayerFilter',this);
	},
	
	getLayers: function(){
		var layerIds = [];
		for(var layerId in this.selectedLayers){
			layerIds[layerIds.length] = layerId;
		};
		return layerIds;
	},
	
	_setLayers: function(layerIds){
		var newSelectedLayers = {};
		if( layerIds ){
			layerIds.forEach(function(layerId){
				newSelectedLayers[layerId] = true;
			});
		};
		
		// Check if selection is changed
		var changed = false;
		for(var layerId in newSelectedLayers){
			if( !this.selectedLayers[layerId] ){
				changed = true;
			};
		};
		if( !changed ){
			for(var layerId in this.selectedLayers){
				if( !newSelectedLayers[layerId] ){
					changed = true;
				};
			};
		};
		
		if( !changed ){
			// Nothing to do
		
		} else {
			// Set of selected layer ids has changed
			this.selectedLayers = newSelectedLayers;
			
			this.selectedLayersParameter.sendUpdate();
			
			this._selectedLayersUpdated();
		};
	},
	
	getAvailableLayers: function(){
		var layerIds = [];
		for(var layerId in this.availableLayers){
			layerIds[layerIds.length] = layerId;
		};
		return layerIds;
	},
	
	_setAvailableLayers: function(layerIds){
		var newAvailableLayerMap = {};
		if( layerIds ){
			layerIds.forEach(function(layerId){
				newAvailableLayerMap[layerId] = true;
			});
		};
		
		this._setAvailableLayersMap(newAvailableLayerMap);
	},
	
	_setAvailableLayersMap: function(newAvailableLayerMap){
		// Check if selection is changed
		var changed = false;
		for(var layerId in newAvailableLayerMap){
			if( !this.availableLayers[layerId] ){
				changed = true;
			};
		};
		if( !changed ){
			for(var layerId in this.availableLayers){
				if( !newAvailableLayerMap[layerId] ){
					changed = true;
				};
			};
		};
		
		if( !changed ){
			// Nothing to do
		
		} else {
			// Set of selected layer ids has changed
			this.availableLayers = newAvailableLayerMap;
			
			this.availableLayersParameter.sendUpdate();
		};
	},

	_handle: function(m, addr, dispatcher){
		if( 'modelGetInfo' === m.type ){
			if( this.modelId === m.modelId ){
				m.modelInfo = this._getModelInfo();
			};
			
		} else if( 'modelGetState' === m.type ){
			if( this.modelId === m.modelId ){
				var added = [];
				for(var docId in this.docInfosByDocId){
					var docInfo = this.docInfosByDocId[docId];
					var doc = docInfo.doc;
					if( docInfo.visible ){
						added.push(doc);
					};
				};

				m.state = {
					added: added
					,updated: []
					,removed: []
					,loading: this.modelIsLoading
				};
			};
			
		} else if( 'modelStateUpdated' === m.type ){
			// Does it come from our source?
			if( this.sourceModelId === m.modelId ){
				this._sourceModelUpdated(m.state);
			};
		};
	},

	_getModelInfo: function(){
		var modelInfo = {
			modelId: this.modelId
			,modelType: 'layerFilter'
			,parameters: {}
		};
		
		modelInfo.parameters.selectedLayers = this.selectedLayersParameter.getInfo();
		modelInfo.parameters.availableLayers = this.availableLayersParameter.getInfo();
		
		return modelInfo;
	},
	
	_sourceModelUpdated: function(sourceState){
		var added = []
			,updated = []
			,removed = []
			;
		
		if( typeof sourceState.loading === 'boolean' 
		 && this.modelIsLoading !== sourceState.loading ){
			this.modelIsLoading = sourceState.loading;
		};
		
		// Loop through all added documents
		if( sourceState.added ){
			for(var i=0,e=sourceState.added.length; i<e; ++i){
				var doc = sourceState.added[i];
				var docId = doc._id;
				var layerMap = this._getLayerMapFromDoc(doc);
				var docInfo = {
					id: docId
					,doc: doc
					,layerMap: layerMap
					,visible: false
				};
				
				// Compute new visibility
				var visibility = this._computeVisibility(docInfo);
				
				docInfo.visible = visibility;

				// Save info
				this.docInfosByDocId[docId] = docInfo;
				
				if( docInfo.visible ){
					added.push(doc);
				};
			};
		};
		
		// Loop through all updated documents
		if( sourceState.updated ){
			for(var i=0,e=sourceState.updated.length; i<e; ++i){
				var doc = sourceState.updated[i];
				var docId = doc._id;
				var docInfo = this.docInfosByDocId[docId];
				var layerMap = this._getLayerMapFromDoc(doc);
				if( !docInfo ) {
					docInfo = {
						id: docId
						,doc: doc
						,visible: false
					};
					this.docInfosByDocId[docId] = docInfo;
				};

				// Update
				docInfo.doc = doc;
				docInfo.layerMap = layerMap;
				
				// Compute new visibility
				var visibility = this._computeVisibility(docInfo);
				var changeInVisibility = ( visibility !== docInfo.visible );
				docInfo.visible = visibility;

				// Report change in visibility
				if( changeInVisibility ){
					
					if( docInfo.visible ){
						// It used to be hidden. Now, it is visible. Add
						added.push(doc);
					} else {
						// It used to be visible. Now, it is hidden. Remove
						removed.push(doc);
					};
					
				} else if( docInfo.visible ) {
					// In this case, there was an update and it used to
					// be visible and it is still visible. Report update
					updated.push(doc);
				};
			};
		};
		
		// Loop through all removed documents
		if( sourceState.removed ){
			for(var i=0,e=sourceState.removed.length; i<e; ++i){
				var doc = sourceState.removed[i];
				var docId = doc._id;
				var docInfo = this.docInfosByDocId[docId];
				if( docInfo ){
					delete this.docInfosByDocId[docId];
					
					// If previously visible, add to removal list
					if( docInfo.visible ){
						removed.push(doc);
					};
				};
			};
		};

		// Report changes in visibility
		this._reportStateUpdate(added, updated, removed);
		
		// Recompute available layers
		var newAvailableLayerMap = {};
		for(var docId in this.docInfosByDocId){
			var docInfo = this.docInfosByDocId[docId];
			for(var layerId in docInfo.layerMap){
				newAvailableLayerMap[layerId] = true;
			};
		};
		this._setAvailableLayersMap(newAvailableLayerMap);
	},
	
	_selectedLayersUpdated: function(){
		var added = []
			,updated = []
			,removed = []
			;
		
		// Loop through all documents
		for(var docId in this.docInfosByDocId){
			var docInfo = this.docInfosByDocId[docId];
			var doc = docInfo.doc;

			// Compute new visibility
			var visibility = this._computeVisibility(docInfo);
			var changeInVisibility = ( visibility !== docInfo.visible );
			docInfo.visible = visibility;

			// Report change in visibility
			if( changeInVisibility ){
				
				if( docInfo.visible ){
					// It used to be hidden. Now, it is visible. Add
					added.push(doc);
				} else {
					// It used to be visible. Now, it is hidden. Remove
					removed.push(doc);
				};
			};
		};
		
		this._reportStateUpdate(added, updated, removed);
	},
	
	_reportStateUpdate: function(added, updated, removed){
		var stateUpdate = {
			added: added
			,updated: updated
			,removed: removed
			,loading: this.modelIsLoading
		};

		if( this.dispatchService ){
			this.dispatchService.send(DH,{
				type: 'modelStateUpdated'
				,modelId: this.modelId
				,state: stateUpdate
			});
		};
	},
	
	_computeVisibility: function(docInfo){
		if( docInfo 
		 && docInfo.layerMap ) {
			for(var layerId in docInfo.layerMap){
				if( this.selectedLayers[layerId] ){
					return true;
				};
			};
		};
		
		return false;
	},
	
	_getLayerMapFromDoc: function(doc){
		var layerMap = {};
		
		if( doc.nunaliit_layers ){
			doc.nunaliit_layers.forEach(function(layerId){
				layerMap[layerId] = true;
			});
		};
		
		return layerMap;
	}
});

//--------------------------------------------------------------------------
function handleModelCreate(m, addr, dispatcher){
	if( m.modelType === 'layerFilter' ){
		var options = {};
		
		if( m && m.modelOptions ){
			for(var key in m.modelOptions){
				var value = m.modelOptions[key];
				options[key] = value;
			};
		};
		
		options.modelId = m.modelId;
		options.modelType = m.modelType;
		
		if( m && m.config ){
			if( m.config.directory ){
				options.dispatchService = m.config.directory.dispatchService;
			};
		};
		
		m.model = new LayerFilter(options);
		
		m.created = true;
    };
};

//--------------------------------------------------------------------------
$n2.modelLayer = {
	LayerFilter: LayerFilter
	,handleModelCreate: handleModelCreate
};

})(jQuery,nunaliit2);
