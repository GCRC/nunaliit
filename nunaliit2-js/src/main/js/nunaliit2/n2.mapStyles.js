/*
Copyright (c) 2013, Geomatics and Cartographic Research Centre, Carleton 
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

$Id: n2.mapAndControls.js 8494 2012-09-21 20:06:50Z jpfiset $
*/

// @requires n2.utils.js

;(function($n2){

// Localization
//var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };

//=========================================================================
/*
 
      Each style comprises 4 states: normal, hovered, clicked, hoveredClicked. In each,
      style, the states are computed according to the diagram below
      
        normal
          V
          |-------------|--------------|----------------|
          |             |              |                |
          |       hovered delta  clicked delta  hoveredClicked delta
          |             |              |                |
          V             V              V                V
        Normal       Hovered        Clicked       HoveredClicked   (4 states constitute
        State         State          State            State          a style)
      
 
      Base style
          V
          |-------------|--------------|-------------|
          |             |              |             |
          |        point delta     line delta  polygon delta
          |             |              |             |
          |             V              V             V
          |        Point Style     Line Style  Polygon Style     (default styles)
          |
     layer delta
          V
          |-------------|--------------|-------------|
                        |              |             |
                   point delta     line delta  polygon delta
                        |              |             |
                   layer point     layer line   layer polygon
                      delta          delta         delta
                        |              |             |
                        V              V             V
                   Layer Point     Layer Line   Layer Polygon  (styles for layer)
                      Style           Style        Style

     Schema styles are computed the same way as layer styles.
     
     Styles are selected in the following order:
     - if a schema name matches a style, then the matching style is selected
     - if a layer name matches a style, then the matching style is selected
     - the default style is selected
          
*/
	
var defaultDefinition = { 
	base: {
		normal:{
			fillColor: '#ffffff'
			,strokeColor: '#ee9999'
			,strokeWidth: 2
			,fillOpacity: 0.4
			,strokeOpacity: 1
			,strokeLinecap: "round"
			,strokeDashstyle: "solid"
			,pointRadius: 6
			,pointerEvents: "visiblePainted"
		}
		,clicked:{
			strokeColor: "#ff2200"
		}
		,hovered:{
			fillColor: "#0000ff"
		}
		,hoveredClicked:{
			fillColor: "#0000ff"
			,strokeColor: "#ff2200"
		}
	}
	,point: null
	,line: {
		hovered:{
			strokeColor: "#0000ff"
		}
		,hoveredClicked:{
			strokeColor: "#0000ff"
		}
	}
	,polygon: null
	,layers: null
	,schemas: null
	,intents: {
		cluster: {
			base: {
				normal: {
					fillColor: '#ffff33'
					,pointRadius: 8
					,graphicName: 'square'
				}
			}
		}
		,find: {
			base: {
				normal: {
					strokeColor: "#ffff00"
				}
			}
		}
	}
};
	
var MapFeatureStyles = $n2.Class({

	activeStyles: null
	
	,initialize: function(userStyles){

		var descriptors = this._parseDefinition(userStyles);
		
		this.activeStyles = {};
		for(var i=0,e=descriptors.length;i<e;++i){
			var descriptor = descriptors[i];
			var args = [];
			args.push(descriptor,this.activeStyles);
			if( descriptor.layer ){
				args.push({
					category: 'layers'
					,name: descriptor.layer
				});
			};
			if( descriptor.schema ){
				args.push({
					category: 'schemas'
					,name: descriptor.schema
				});
			};
			if( descriptor.intent ){
				args.push({
					category: 'intents'
					,name: descriptor.intent
				});
			};
			this._installDefinition.apply(this,args);
		};
	}
	
	,_parseDefinition: function(userDefinition){
		// Make a list of descriptors to return
		var descriptors = [];
		
		// Initial descriptor
		var initialDescriptor = {
			layer: null
			,schema: null
			,intent: null
			,priority: -1
			,styleSet: this._computeStyleSet(userDefinition)
		};
		descriptors.push(initialDescriptor);
		
		// Default layers, schemas, intents
		this._parseDefinition2(initialDescriptor, [], defaultDefinition, descriptors);
		
		// User layers, schemas, intents
		initialDescriptor = $n2.extend({},initialDescriptor,{priority:0});
		this._parseDefinition2(initialDescriptor, [userDefinition], userDefinition, descriptors);
		
		return descriptors;
	}
	
	/**
	 * @param descriptor {Object} Carries accumulated description for the definitions
	 *                   processed so far.
	 * @param accumulatedDefinitions {Array} Array of definitions to be merged into the next
	 *                               levels of styles.
	 * @param userDefinition {Object} Style definition currently processed
	 * @param descriptorArray {Array} Array of all generated style descriptor
	 */
	,_parseDefinition2: function(descriptor, accumulatedDefinitions, userDefinition, descriptorArray){
		// Creates styles for layers
		if( userDefinition && userDefinition.layers ){
			for(var layerName in userDefinition.layers){
				// Create a new descriptor. Set layer name and increase priority
				var layerDescriptor = $n2.extend({},descriptor,{
					layer: layerName
					,priority: (descriptor.priority + 1)
				});
				
				// Add definition for layer, after default for layer
				var layerDef = userDefinition.layers[layerName];
				var defs = accumulatedDefinitions.slice(0);
				
				if( defaultDefinition.layers && defaultDefinition.layers[layerName] ){
					defs.push(defaultDefinition.layers[layerName]);
				};
				
				defs.push(layerDef);
				
				// Compute style set based on all definitions
				layerDescriptor.styleSet = this._computeStyleSet.apply(this, defs);
				
				// Add descriptor to array of descriptors
				descriptorArray.push(layerDescriptor);
				
				// Recurse
				this._parseDefinition2(layerDescriptor, defs, layerDef, descriptorArray);
			};
		};
		
		// Create styles for schemas
		if( userDefinition && userDefinition.schemas ){
			for(var schemaName in userDefinition.schemas){
				var schemaDescriptor = $n2.extend({},descriptor,{
					schema: schemaName
					,priority: (descriptor.priority + 1)
				});
				
				var schemaDef = userDefinition.schemas[schemaName];
				var defs = accumulatedDefinitions.slice(0);
				
				if( defaultDefinition.schemas && defaultDefinition.schemas[schemaName] ){
					defs.push(defaultDefinition.schemas[schemaName]);
				};

				defs.push(schemaDef);
				
				schemaDescriptor.styleSet = this._computeStyleSet.apply(this, defs);
				
				descriptorArray.push(schemaDescriptor);
				
				// Recurse
				this._parseDefinition2(schemaDescriptor, defs, schemaDef, descriptorArray);
			};
		};
		
		// Create styles for intents
		if( userDefinition && userDefinition.intents ){
			for(var intentName in userDefinition.intents){
				var intentDescriptor = $n2.extend({},descriptor,{
					intent: intentName
					,priority: (descriptor.priority + 1)
				});
				
				var intentDef = userDefinition.intents[intentName];
				var defs = accumulatedDefinitions.slice(0);
				
				if( defaultDefinition.intents && defaultDefinition.intents[intentName] ){
					defs.push(defaultDefinition.intents[intentName]);
				};

				defs.push(intentDef);
				
				intentDescriptor.styleSet = this._computeStyleSet.apply(this, defs);
				
				descriptorArray.push(intentDescriptor);
				
				// Recurse
				this._parseDefinition2(intentDescriptor, defs, intentDef, descriptorArray);
			};
		};
	}
	
	/**
	 * Accepts a styleDescriptor and install within a tree for easy look up.
	 */
	,_installDefinition: function(styleDescriptor, currentNode, routingInfo){
		if( !routingInfo ){
			if( currentNode.descriptor 
			 && currentNode.descriptor.priority <= styleDescriptor.priority ){
				currentNode.descriptor = styleDescriptor;
				
			} else if( !currentNode.descriptor ){
				currentNode.descriptor = styleDescriptor;
			};
			
		} else {
			var nextRoute = arguments[arguments.length-1];
			var category = nextRoute.category;
			var name = nextRoute.name;
			if( !currentNode[category] ){
				currentNode[category] = {};
			};
			if( !currentNode[category][name] ){
				currentNode[category][name] = {};
			};
			
			// Next call, drop last route
			var nextLevelArgs = [styleDescriptor, currentNode[category][name]];
			for(var i=2,e=arguments.length-1;i<e;++i){
				nextLevelArgs.push(arguments[i]);
			};
			this._installDefinition.apply(this, nextLevelArgs);
		};
	}
	
	,_retrieveStyleSet: function(intent, schema, layer){
		var currentNode = this.activeStyles;
		var currentDescriptor = this.activeStyles.descriptor;

		if( intent 
		 && currentNode.intents 
		 && currentNode.intents[intent] ){
			currentNode = currentNode.intents[intent];
			if( currentNode.descriptor 
			 && currentDescriptor.priority < currentNode.descriptor.priority ) {
				currentDescriptor = currentNode.descriptor;
			};
		};

		if( schema 
		 && currentNode.schemas 
		 && currentNode.schemas[schema] ){
			currentNode = currentNode.schemas[schema];
			if( currentNode.descriptor 
			 && currentDescriptor.priority < currentNode.descriptor.priority ) {
				currentDescriptor = currentNode.descriptor;
			};
		};

		if( layer 
		 && currentNode.layers 
		 && currentNode.layers[layer] ){
			currentNode = currentNode.layers[layer];
			if( currentNode.descriptor 
			 && currentDescriptor.priority < currentNode.descriptor.priority ) {
				currentDescriptor = currentNode.descriptor;
			};
		};
		
		return currentDescriptor.styleSet;
	}

	/*
	 * Computes the three variants of a style: point, line, polygon. This is
	 * accomplished by computing a base style. Then, styles for points, lines
	 * and polygons are derived by adding deltas to the effective base style.
	 * 
	 * base = defaultDefinition(base) + userDefinition(base) + a0(base) + ... + an(base)
	 * point = base + defaultDefinition(point) + userDefinition(point) + a0(point) + ... + an(point)
	 * line = base + defaultDefinition(line) + userDefinition(line) + a0(line) + ... + an(line)
	 * polygon = base + defaultDefinition(polygon) + userDefinition(polygon) + a0(polygon) + ... + an(polygon)
	 */
	,_computeStyleSet: function(){
		
		var computedSet = {};
		
		// Start from default base and user base
		var pointArgs = [defaultDefinition.base];
		var lineArgs = [defaultDefinition.base];
		var polygonArgs = [defaultDefinition.base];
		
		// Add default style for geometry
		pointArgs.push(defaultDefinition.point);
		lineArgs.push(defaultDefinition.line);
		polygonArgs.push(defaultDefinition.polygon);
		
		// Add all base styles found in arguments
		for(var i=0,e=arguments.length;i<e;++i){
			var setDelta = arguments[i];
			
			if( setDelta ) {
				pointArgs.push(setDelta.base);
				lineArgs.push(setDelta.base);
				polygonArgs.push(setDelta.base);
			};
		};
		
		// Add all geometry styles found in argument
		for(var i=0,e=arguments.length;i<e;++i){
			var setDelta = arguments[i];
			
			if( setDelta ) {
				pointArgs.push(setDelta.point);
				lineArgs.push(setDelta.line);
				polygonArgs.push(setDelta.polygon);
			};
		};
		
		// Merge all the styles and save the geometries
		computedSet.point = this._computeStateStyles.apply(this, pointArgs);
		computedSet.line = this._computeStateStyles.apply(this, lineArgs);
		computedSet.polygon = this._computeStateStyles.apply(this, polygonArgs);

		return computedSet;
	}

	/*
	 * This function can be called with many arguments. The first style
	 * is cloned and then the clone is merged with all subsequent styles in
	 * arguments.
	 * 
	 * As arguments, this method expect a number of object containing a definition
	 * for each of the four states: normal, clicked, hovered, hoveredClicked.
	 * 
	 * The merging is accomplished by extending the first definiton for the normal 
	 * state with all of the subsequent definitions for the normal state. This results 
	 * into the effective definition for the normal state.
	 * 
	 * The merging process continues with the other three states: clicked, hovered and
	 * hoveredClicked. For each of those states, the process starts with the effective
	 * definition for the normal state and extending it with all the definitions for the 
	 * currently merged state.
	 * 
	 * normal = {} + normal(1) + normal(2) + ... + normal(n)
	 * clicked = normal + clicked(1) + clicked(2) + ... + clicked(n)
	 * hovered = normal + hovered(1) + hovered(2) + ... + hovered(n)
	 * hoveredClicked = normal + hoveredClicked(1) + hoveredClicked(2) + ... + hoveredClicked(n)
	 */
	,_mergeStateStyles: function(baseStyle){
		
		var mergedStyle = {};
		
		if( !baseStyle ){
			baseStyle = {};
		};

		// Compute normal state by applying all deltas
		mergedStyle.normal = $n2.extend({},baseStyle.normal);
		for(var i=1,e=arguments.length; i<e; ++i){
			var delta = arguments[i];
			if( delta && delta.normal ) {
				$n2.extend(mergedStyle.normal, delta.normal);
			};
		};
		
		// Derive the other states from the normal one
		mergedStyle.hovered = $n2.extend({},mergedStyle.normal,baseStyle.hovered);
		mergedStyle.clicked = $n2.extend({},mergedStyle.normal,baseStyle.clicked);
		mergedStyle.hoveredClicked = $n2.extend({},mergedStyle.normal,baseStyle.hoveredClicked);
		
		// Apply deltas to other states
		for(var i=1,e=arguments.length; i<e; ++i){
			var delta = arguments[i];
			if( delta && delta.hovered ) {
				$n2.extend(mergedStyle.hovered, delta.hovered);
			};
			if( delta && delta.clicked ) {
				$n2.extend(mergedStyle.clicked, delta.clicked);
			};
			if( delta && delta.hoveredClicked ) {
				$n2.extend(mergedStyle.hoveredClicked, delta.hoveredClicked);
			};
		};
		
		return mergedStyle;
	}

	/*
	 * This function can be called with many arguments. The first style
	 * is cloned and then the clone is extended by all subsequent styles in
	 * arguments.
	 */
	,_computeStateStyles: function(baseStyle){
		
		// Merge the styles
		var mergedStyle = this._mergeStateStyles.apply(this,arguments);
		
		// Wrap the styles into an OpenLayers Style instance
		var computedStyle = {
			normal: new OpenLayers.Style(mergedStyle.normal)
			,hovered: new OpenLayers.Style(mergedStyle.hovered)
			,clicked: new OpenLayers.Style(mergedStyle.clicked)
			,hoveredClicked: new OpenLayers.Style(mergedStyle.hoveredClicked)
			,_merged: mergedStyle // keep around for debugging
		};
		
		return computedStyle;
	}
	
	/*
	 * Returns a style map function for a given layer
	 */
	,getStyleMapForLayerInfo: function(layerInfo){
		
		var _this = this;
		
		var styleMap = new OpenLayers.StyleMapCallback(function(feature,intent){
			
			// Figure out intent
	        var effectiveIntent = null;
	        
	    	if( null == effectiveIntent && feature.isHovered ) {
		        if( feature.isClicked ) {
	        		effectiveIntent = 'hoveredClicked';
	        	} else {
	        		effectiveIntent = 'hovered';
		        };
	    	};
	    	
	    	if( null == effectiveIntent && feature.isClicked ) {
	    		effectiveIntent = 'clicked';
	    	};
	    	
	    	if( null == effectiveIntent ) {
	    		effectiveIntent = 'normal';
	    	};
	    	
	    	// Figure out type of geometry
	    	var geomType = feature.geometry._n2Type;
	    	if( !geomType ){
	    		if( feature.geometry.CLASS_NAME.indexOf('Line') >= 0 ) {
	    			geomType = feature.geometry._n2Type = 'line';
	    		} else if( feature.geometry.CLASS_NAME.indexOf('Polygon') >= 0 ) {
	    			geomType = feature.geometry._n2Type = 'polygon';
	    		} else {
	    			geomType = feature.geometry._n2Type = 'point';
	    		};
	    	};

			// Retrieve data. Handle clusters
	    	var data = feature.data;
			if( feature 
			 && feature.cluster 
			 && 1 === feature.cluster.length ){
				data = feature.cluster[0].data;
			};

			// Compute intent
	    	var n2Intent = feature.n2HoverIntent;
	    	if( !n2Intent ){
	    		n2Intent = feature.n2SelectIntent;
	    	};
	    	if( !n2Intent ){
	    		n2Intent = feature.n2Intent;
	    	};
	    	
	    	var layerId = layerInfo.id;
	    	var schemaName = null;
			if( data 
			 && data.nunaliit_schema ) {
				schemaName = data.nunaliit_schema;
			};
			if( feature 
			 && feature.cluster
			 && feature.cluster.length > 1 ){
				n2Intent = 'cluster';
			};

			var styleSet = _this._retrieveStyleSet(n2Intent, schemaName, layerId);
			var style = styleSet[geomType][effectiveIntent];
	        
	        return style.createSymbolizer(feature);
		});
		
		return styleMap;
	}
}); 
	
$n2.mapStyles = {
	MapFeatureStyles: MapFeatureStyles
};

})(nunaliit2);
