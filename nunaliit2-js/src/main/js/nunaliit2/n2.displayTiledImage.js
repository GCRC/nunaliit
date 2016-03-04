/*
Copyright (c) 2015, Geomatics and Cartographic Research Centre, Carleton 
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

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };

var emptyTileURL = "http://www.maptiler.org/img/none.png";

//=========================================================================

var DisplayTiledImage = $n2.Class({

	url: null,

	extension: null,

	elemId: null,

	mapBounds: null,

	mapMinZoom: null,

	mapMaxZoom: null,

	numZoomLevels: null,

	maxResolution: null,

	docId: null,

	showService: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			url: null
			,parent: null
			,tileMapResourceName: null
			,extension: 'png'
			,docId: null
			,showService: null
		},opts_);
		
		var _this = this;
		
		this.url = opts.url;
		this.extension = opts.extension;
		this.docId = opts.docId;
		this.showService = opts.showService;
		
		// Compute parent
		var $parent;
		if( typeof opts.parent === 'string' ){
			$parent = $('#'+opts.parent);
			if( $parent.length < 1 ){
				$parent = undefined;
			};
		} else if( opts.parent ){
			$parent = $(opts.parent);
		};
		if( !$parent ){
			$parent = $('.nunaliit_content').first();
			if( $parent.length < 1 ){
				$parent = undefined;
			};
		};
		if( !$parent ){
			$parent = $('body');
		};
		this.elemId = $n2.getUniqueId();
		$('<div>')
			.attr('id',this.elemId)
			.addClass('n2TiledImage')
			.appendTo($parent);
	
		// Fetch parameters
		if( opts.tileMapResourceName ){
			var tmrUrl = this.url + '/' + opts.tileMapResourceName;
			$.ajax({
				url: tmrUrl
				,type: 'get'
				,async: true
				,dataType: 'xml'
				,success: function(xmlDoc) {
					_this._readTimeMapResourceDoc(xmlDoc);
				}
				,error: function(XMLHttpRequest, textStatus, errorThrown) {
					alert( _loc('Unable to retrieve time map resource at {url}',{
						url: tmrUrl
					}) );
				}
			});
		};
	},

	_draw: function(){
		var _this = this;

		var $elem = $('#'+this.elemId).empty();

		var $container = $('<div>')
			.addClass('n2TiledImage_container')
			.appendTo($elem);
		
		var mapId = $n2.getUniqueId();
		$('<div>')
			.attr('id',mapId)
			.addClass('n2TiledImage_map')
			.appendTo($container);

		var $footer = $('<div>')
			.addClass('n2TiledImage_footer')
			.appendTo($container);
		
		$('<div>')
			.addClass('n2TiledImage_close')
			.appendTo($footer)
			.click(function(){
				_this._close();
				return false;
			});
		
		if( this.docId 
		 && this.showService ){
			var $desc = $('<div>')
				.addClass('n2TiledImage_desc')
				.appendTo($footer);
			this.showService.printBriefDescription($desc, this.docId);
		};
		
		this._drawMap(mapId);
	},

	_drawMap: function(mapDivId){
		var _this = this;

        var options = {
            div: mapDivId,
            controls: [],
            maxExtent: this.mapBounds,
            maxResolution: this.maxResolution,
            numZoomLevels: this.numZoomLevels
        };
        var map = new OpenLayers.Map(options);

        var layer = new OpenLayers.Layer.TMS('TMS Layer', '', {
            serviceVersion: '.',
            layername: '.',
            alpha: true,
            type: this.extension,
            getURL: getURL
        });

        map.addLayer(layer);
        map.zoomToExtent(this.mapBounds);
  
        map.addControls([
			new OpenLayers.Control.Zoom(),
			new OpenLayers.Control.Navigation()
		]);

        function getURL(bounds) {
            bounds = this.adjustBounds(bounds);
            var res = this.getServerResolution();
            var x = Math.round((bounds.left - this.tileOrigin.lon) / (res * this.tileSize.w));
            var y = Math.round((bounds.bottom - this.tileOrigin.lat) / (res * this.tileSize.h));
            var z = this.getServerZoom();
            var path = "/" + z + "/" + x + "/" + y + "." + this.type; 
            var url = _this.url;
            if (OpenLayers.Util.isArray(url)) {
                url = this.selectUrl(path, url);
            };
            if( _this.mapBounds.intersectsBounds(bounds) 
             && (z >= _this.mapMinZoom) && (z <= _this.mapMaxZoom) ) {
                return url + path;
            } else {
                return emptyTileURL;
            };
        };
	},

	_close: function(){
		$('#'+this.elemId).remove();
	},
	
	_readTimeMapResourceDoc: function(xmlDoc){
		var _this = this;
		
		$n2.log('Time Map Resource',xmlDoc);

		var tileMap = xmlDoc.documentElement;
		var nodeList = tileMap.childNodes;
		for(var i=0; i<nodeList.length; ++i){
			var childNode = nodeList.item(i);
			
			if( childNode.nodeType === 1 ){ // element
				if( 'BoundingBox' === childNode.localName ){
					parseBoundingBox(childNode);
				} else if( 'TileFormat' === childNode.localName ){
					parseTileFormat(childNode);
				} else if( 'TileSets' === childNode.localName ){
					parseTileSets(childNode);
				};
			};
		};
		
		this._draw();

		function parseBoundingBox(elem){
			var attMap = elem.attributes;
			
			var minx = 0
				,maxx = 0
				,miny = 0
				,maxy = 0;

			var minxAttr = attMap.getNamedItem('minx');
			if(minxAttr){
				minx = 1 * minxAttr.value;
			};

			var maxxAttr = attMap.getNamedItem('maxx');
			if(maxxAttr){
				maxx = 1 * maxxAttr.value;
			};

			var minyAttr = attMap.getNamedItem('miny');
			if(minyAttr){
				miny = 1 * minyAttr.value;
			};

			var maxyAttr = attMap.getNamedItem('maxy');
			if(maxyAttr){
				maxy = 1 * maxyAttr.value;
			};
			
			_this.mapBounds = new OpenLayers.Bounds(minx, miny, maxx, maxy);
		};

		function parseTileFormat(elem){
			var attMap = elem.attributes;
			
			var extAttr = attMap.getNamedItem('extension');
			if(extAttr){
				_this.extension = extAttr.value;
			};
		};

		function parseTileSets(elem){
			var minZoomLevel = undefined,
				maxZoomLevel = undefined,
				maxResolution = undefined,
				numZoomLevels = 0;

			var nodeList = elem.childNodes;
			for(var i=0; i<nodeList.length; ++i){
				var childNode = nodeList.item(i);
				
				if( childNode.nodeType === 1 ){ // element
					if( 'TileSet' === childNode.localName ){
						var attMap = childNode.attributes;
						
						var zoomLevelAttr = attMap.getNamedItem('href');
						if( zoomLevelAttr ){
							var zoomLevel = 1 * zoomLevelAttr.value;
							++numZoomLevels;

							if( typeof minZoomLevel === 'undefined' ){
								minZoomLevel = zoomLevel;
							} else if( minZoomLevel > zoomLevel ){
								minZoomLevel = zoomLevel;
							};

							if( typeof maxZoomLevel === 'undefined' ){
								maxZoomLevel = zoomLevel;
							} else if( maxZoomLevel < zoomLevel ){
								maxZoomLevel = zoomLevel;
							};
						};
						
						var unitsPerPixelAttr = attMap.getNamedItem('units-per-pixel');
						if( unitsPerPixelAttr ){
							var resolution = 1 * unitsPerPixelAttr.value;

							if( typeof maxResolution === 'undefined' ){
								maxResolution = resolution;
							} else if( maxResolution < resolution ){
								maxResolution = resolution;
							};
						};
					};
				};
			};

			if( typeof minZoomLevel !== 'undefined' ){
				_this.mapMinZoom = minZoomLevel;
			};
			if( typeof maxZoomLevel !== 'undefined' ){
				_this.mapMaxZoom = maxZoomLevel;
			};
			if( typeof maxResolution !== 'undefined' ){
				_this.maxResolution = maxResolution;
			};
			
			_this.numZoomLevels = numZoomLevels;
		};
	}
});

// =========================================================================

$n2.displayTiledImage = {
	DisplayTiledImage: DisplayTiledImage
};	
	
})(jQuery,nunaliit2);
