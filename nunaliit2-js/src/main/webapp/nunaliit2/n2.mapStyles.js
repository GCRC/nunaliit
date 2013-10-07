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

;(function($,$n2){

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
var MapFeatureStyles = $n2.Class({
	
	defaultStyle: {
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

	,initialDeltas: {
		base: null
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
	}
	
	,intentDeltas: {
		cluster: {
			base: {
				normal: {
					fillColor: '#ffff33'
					,pointRadius: 8
					,graphicName: 'square'
				}
			}
		}
	}
	
	,basicStyles: null
	
	,stylesFromLayer: null
	
	,stylesFromSchema: null
	
	,stylesFromIntents: null
	
	,initialize: function(userStyles){

		if( userStyles ) {
			this.initialDeltas.base = this._mergeStyle(this.initialDeltas.base, userStyles.base);
			this.initialDeltas.point = this._mergeStyle(this.initialDeltas.point, userStyles.point);
			this.initialDeltas.line = this._mergeStyle(this.initialDeltas.line, userStyles.line);
			this.initialDeltas.polygon = this._mergeStyle(this.initialDeltas.polygon, userStyles.polygon);
		};

		// Create style for default behaviour
		this.basicStyles = this._computeStyleSet({});

		// Creates styles for layers
		this.stylesFromLayer = {};
		if( userStyles && userStyles.layers ){
			for(var layerName in userStyles.layers){
				var layerDef = userStyles.layers[layerName];
				var layerSet = this._computeStyleSet(layerDef);
				this.stylesFromLayer[layerName] = layerSet;
			};
		};
		
		// Create styles for schemas
		this.stylesFromSchema = {};
		if( userStyles && userStyles.schemas ){
			for(var schemaName in userStyles.schemas){
				var schemaDef = userStyles.schemas[schemaName];
				var schemaSet = this._computeStyleSet(schemaDef);
				this.stylesFromSchema[schemaName] = schemaSet;
			};
		};
		
		// Create styles for intents
		this.stylesFromIntents = {};
		for(var intent in this.intentDeltas){
			var intentDef = this.intentDeltas[intent];
			var intentSet = this._computeStyleSet(intentDef);
			this.stylesFromIntents[intent] = intentSet;
		};
		if( userStyles && userStyles.intents ){
			for(var intent in userStyles.intents){
				var intentDef = userStyles.intents[intent];
				var intentSet = null;
				if( this.intentDeltas[intent] ) {
					intentSet = this._computeStyleSet(this.intentDeltas[intent], intentDef);
				} else {
					intentSet = this._computeStyleSet(intentDef);
				};
				this.stylesFromIntents[intent] = intentSet;
			};
		};
	}

	/*
	 * Computes the three variants of a style: point, line, polygon
	 */
	,_computeStyleSet: function(){
		
		var computedSet = {};
		
		var pointArgs = [this.defaultStyle, this.initialDeltas.base];
		var lineArgs = [this.defaultStyle, this.initialDeltas.base];
		var polygonArgs = [this.defaultStyle, this.initialDeltas.base];
		
		// Add all base symbolizer
		for(var i=0,e=arguments.length;i<e;++i){
			var setDelta = arguments[i];
			
			pointArgs.push(setDelta.base);
			lineArgs.push(setDelta.base);
			polygonArgs.push(setDelta.base);
		};
		
		pointArgs.push(this.initialDeltas.point);
		lineArgs.push(this.initialDeltas.line);
		polygonArgs.push(this.initialDeltas.polygon);
		
		// Add all geometry symbolizers
		for(var i=0,e=arguments.length;i<e;++i){
			var setDelta = arguments[i];
			
			pointArgs.push(setDelta.point);
			lineArgs.push(setDelta.line);
			polygonArgs.push(setDelta.polygon);
		};
		
		computedSet.point = this._computeStyle.apply(this, pointArgs);
		computedSet.line = this._computeStyle.apply(this, lineArgs);
		computedSet.polygon = this._computeStyle.apply(this, polygonArgs);

		return computedSet;
	}

	/*
	 * This function can be called with many arguments. The first style
	 * is cloned and then the clone is merged with all subsequent styles in
	 * arguments.
	 */
	,_mergeStyle: function(baseStyle){
		
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
	,_computeStyle: function(baseStyle){
		
		var mergedStyle = this._mergeStyle.apply(this,arguments);
		
		var computedStyle = {
			normal: new OpenLayers.Style(mergedStyle.normal)
			,hovered: new OpenLayers.Style(mergedStyle.hovered)
			,clicked: new OpenLayers.Style(mergedStyle.clicked)
			,hoveredClicked: new OpenLayers.Style(mergedStyle.hoveredClicked)
			,_merged: mergedStyle
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

	    	var n2Intent = feature.n2Intent;
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

			var style = null;
			if( null == style && n2Intent && _this.stylesFromIntents[n2Intent] ) {
				style = _this.stylesFromIntents[n2Intent][geomType][effectiveIntent];
			};
			if( null == style && schemaName && _this.stylesFromSchema[schemaName] ) {
				style = _this.stylesFromSchema[schemaName][geomType][effectiveIntent];
			};
			if( null == style && layerId && _this.stylesFromLayer[layerId] ) {
				style = _this.stylesFromLayer[layerId][geomType][effectiveIntent];
			};
			if( null == style ) {
				style = _this.basicStyles[geomType][effectiveIntent];
			};
	        
	        return style.createSymbolizer(feature);
		});
		
		return styleMap;
	}
}); 
	
$n2.mapStyles = {
	MapFeatureStyles: MapFeatureStyles
};

})(jQuery,nunaliit2);
