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

;(function($,$n2){
"use strict";

	// Localization
	var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };
	var DH = 'n2.ol5MapAndControls';
	
	// **************************************************
	// Generic bridge between document model and map
	var MapBridge = $n2.Class({

	    sourceModelId: null,
	    
	    dispatchService: null,
	    
	    mapControl: null,
	    
	    initialize: function (opts_) {
	        var opts = $n2.extend({
	            dispatchService: null
	            
	            // From configuration object
	            ,sourceModelId: null
	        }, opts_);

	        var _this = this;
	        
	        this.sourceModelId = opts.sourceModelId;
	        this.dispatchService = opts.dispatchService;

	        // Register to events
	        if( this.dispatchService ) {
	            var f = function (m, addr, dispatcher){
	                _this._handle (m, addr, dispatcher);
	            };
	            this.dispatchService.register(DH, 'modelStateUpdated', f);
	            this.dispatchService.register(DH, 'reportModuleDisplay', f);
	            this.dispatchService.register(DH, 'mapInitialized', f);
	            this.dispatchService.register(DH, 'start', f);
	            
	            if( this.sourceModelId ){
	                // Initialize state
	                var m = {
	                    type:'modelGetState'
	                    ,modelId: this.sourceModelId
	                };
	                this.dispatchService.synchronousCall(DH, m);
	                if (m.state) {
	                    this._sourceModelUpdated(m.state);
	                };
	            };
	        };
	    },
	    
	    _handle: function (m, addr, dispatcher) {
	    	if( 'modelStateUpdated' === m.type ) {
	            // Does it come from one of our sources?
	            if (this.sourceModelId === m.modelId) {
	                this._sourceModelUpdated(m.state);

	                // Redraw map
	            	this._updateMap();
	            };

	    	} else if( 'reportModuleDisplay' === m.type ) {
	    		if( m.moduleDisplay 
	    		 && m.moduleDisplay.mapControl 
	    		 && !this.mapControl ){
	    			this.mapControl = m.moduleDisplay.mapControl;
	            	this._updateMap();
	    		};

	    	} else if( 'mapInitialized' === m.type ) {
	    		if( m.mapControl 
	    		 && !this.mapControl ){
	    			this.mapControl = m.mapControl;
	            	this._updateMap();
	    		};

	    	} else if( 'start' === m.type ) {
	            this._updateMap();
	        };
	    },
	    
	    _sourceModelUpdated: function(sourceState) {
	    	throw 'Subclasses must implement _sourceModelUpdated()'
	    },
	    
	    /**
	     * Returns array of document ids that are currently visible
	     */
	    _getVisibleDocumentIds: function(){
	    	throw new Error('Subclasses must implement _getVisibleDocumentIds()');
	    },
	    
	    _updateMap: function() {
	        var mapControl = this._getMapControl();
	        if( mapControl 
	         && mapControl.infoLayers ){
	        	var visibleDocIds = this._getVisibleDocumentIds();
	        	
	        	// Iterate over all layers
	    		for(var loop=0; loop<mapControl.infoLayers.length; ++loop) {
	    			var layerInfo = mapControl.infoLayers[loop];
	                
	                // Interested only in vector layers
	                if( layerInfo 
	                 && layerInfo.featureStrategy ) {
	                	layerInfo.featureStrategy.setWhiteListDocumentIds(visibleDocIds);
	                };
	            };
	        };
	    },
	    
	    _getMapControl: function(){
	    	var _this = this;
	    	
	    	return this.mapControl;
	    }
	});

	var ModelMapBridge = $n2.Class(MapBridge, {

	    docStateById: null,

	    initialize: function (opts_) {
	        var opts = $n2.extend({
	            dispatchService: null
	            
	            // From configuration object
	            ,sourceModelId: null
	        }, opts_);

	        this.docStateById = {};
	        
	        MapBridge.prototype.initialize.apply(this, arguments);

	        $n2.log('modelToMapAndControlBridge', this);
	    },
	    
	    _sourceModelUpdated: function(sourceState) {
	    	var _this = this;
	    	
	        // Update the nodes according to changes in source model
	    	if( sourceState ){
	    		if( sourceState.added && sourceState.added.length ){
	    			for(var i=0,e=sourceState.added.length; i<e; ++i){
	    				var doc = sourceState.added[i];
	    				var docId = doc._id;
	    				this.docStateById[docId] = true;
	    			};
	    		};

	    		if( sourceState.updated && sourceState.updated.length ){
	    			for(var i=0,e=sourceState.updated.length; i<e; ++i){
	    				var doc = sourceState.updated[i];
	    				var docId = doc._id;
	    				this.docStateById[docId] = true;
	    			};
	    		};

	    		if( sourceState.removed && sourceState.removed.length ){
	    			for(var i=0,e=sourceState.removed.length; i<e; ++i){
	    				var doc = sourceState.removed[i];
	    				var docId = doc._id;
	    				if( this.docStateById[docId] ){
	    					delete this.docStateById[docId];
	    				};
	    			};
	    		};
	    	};
	    },
	    
	    _getVisibleDocumentIds: function(){
	    	var docIds = [];
	    	for(var docId in this.docStateById){
	   			docIds.push(docId);
	    	};
	    	return docIds;
	    }
	});

	function HandleWidgetAvailableRequests(m){
	    if( m.widgetType === 'timeTransformToMapAndControlBridge' ){
	        m.isAvailable = true;
	    } else if( m.widgetType === 'modelToMapAndControlBridge' ){
	        m.isAvailable = true;
	    };
	};

	function HandleWidgetDisplayRequests(m){
	    if( m.widgetType === 'timeTransformToMapAndControlBridge' ){
	        var options = {};
	        
	        if( m.widgetOptions ) {
	        	for(var key in m.widgetOptions){
	        		options[key] = m.widgetOptions[key];
	        	};
	        };
	        
	        if( m.config ){
	            if( m.config.directory ){
	            	options.dispatchService = m.config.directory.dispatchService;
	            };
	        };
	        
	        new TimeTransformMapBridge(options);

	    } else if( m.widgetType === 'modelToMapAndControlBridge' ){
	        var options = {};
	        
	        if( m.widgetOptions ) {
	        	for(var key in m.widgetOptions){
	        		options[key] = m.widgetOptions[key];
	        	};
	        };
	        
	        if( m.config ){
	            if( m.config.directory ){
	            	options.dispatchService = m.config.directory.dispatchService;
	            };
	        };
	        
	        new ModelMapBridge(options);
	    };
	};

	var TimeTransformMapBridge = $n2.Class(MapBridge, {

	    docStateById: null,

	    initialize: function (opts_) {
	        var opts = $n2.extend({
	            dispatchService: null
	            
	            // From configuration object
	            ,sourceModelId: null
	        }, opts_);

	        this.docStateById = {};
	        
	        MapBridge.prototype.initialize.apply(this, arguments);

	        $n2.log('timeTransformToMapAndControlBridge', this);
	    },
	    
	    _sourceModelUpdated: function(sourceState) {
	    	var _this = this;
	    	
	        // Update the nodes according to changes in source model
	    	if( sourceState ){
	    		if( sourceState.added && sourceState.added.length ){
	    			for(var i=0,e=sourceState.added.length; i<e; ++i){
	    				var doc = sourceState.added[i];
	    				updateDoc(doc);
	    			};
	    		};

	    		if( sourceState.updated && sourceState.updated.length ){
	    			for(var i=0,e=sourceState.updated.length; i<e; ++i){
	    				var doc = sourceState.updated[i];
	    				updateDoc(doc);
	    			};
	    		};

	    		if( sourceState.removed && sourceState.removed.length ){
	    			for(var i=0,e=sourceState.removed.length; i<e; ++i){
	    				var doc = sourceState.removed[i];
	    				var docId = doc._id;
	    				if( this.docStateById[docId] ){
	    					delete this.docStateById[docId];
	    				};
	    			};
	    		};
	    	};
	    	
	    	function updateDoc(doc){
	    		var docId = doc._id;
	    		
	    		if( doc._n2TimeTransform ){
	    			if( !_this.docStateById[docId] ){
	    				_this.docStateById[docId] = {};
	    			};
	    			
	    			if( doc._n2TimeTransform.intervalSize <= 0 ){
	    				// The document does not contain any time intervals. By default,
	    				// show
	    				_this.docStateById[docId].visible = true;
	    			} else {
	        			_this.docStateById[docId].visible = doc._n2TimeTransform.intersects;
	    			};
	    			
	    		} else if( _this.docStateById[docId] ){
	    			delete _this.docStateById[docId];
	    		}
	    	};
	    },
	    
	    _getVisibleDocumentIds: function(){
	    	var docIds = [];
	    	for(var docId in this.docStateById){
	    		if( this.docStateById[docId].visible ){
	    			docIds.push(docId);
	    		};
	    	};
	    	return docIds;
	    }
	});
	
	
	
	
var customMap = new ol.N2Map({
	target : 'map',
	layers : [ new ol.layer.Tile({
		source : new ol.source.OSM()
	}) ],
	view : new ol.View({
		center : ol.proj.fromLonLat([ 37.41, 8.82 ]),
		zoom : 4
	})
});

customMap.getInfo();

//Export list






})(jQuery,nunaliit2);