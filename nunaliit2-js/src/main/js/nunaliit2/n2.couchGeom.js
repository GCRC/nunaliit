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

$Id: n2.couchGeom.js 8165 2012-05-31 13:14:37Z jpfiset $
*/

// @ requires n2.utils.js

;(function($n2){
"use strict";

/*
 * Returns a geometry object used in CouchDb given
 * a geometry obtained from OpenLayers.
 */
function getCouchGeometry(geom) {

	var bounds = geom.getBounds();
	var wkt = geom.toString();
	
	return {
		nunaliit_type: 'geometry'
		,wkt: wkt
		,bbox: [
			bounds.left
			,bounds.bottom
			,bounds.right
			,bounds.top
		]
	};
};

function updateDocumentWithWktGeometry(opts_) {
	var opts = $n2.extend({
		doc: null
		,wkt: null
	},opts_);
	
	if( !opts.doc ) {
		throw 'Attribute "doc" not provided while updating a geometry document';
	}
	if( !opts.wkt ) {
		throw 'Attribute "wkt" not provided while updating a geometry document';
	}
	
	if( OpenLayers && OpenLayers.Geometry && OpenLayers.Geometry.fromWKT ) {
		var olGeom = OpenLayers.Geometry.fromWKT(opts.wkt);
	} else { 
		opts.onError('OpenLayers must be installed to update document geometries');
		return;
	};		

	var couchGeom = getCouchGeometry(olGeom);
	
	// Install geometry
	opts.doc.nunaliit_geom = couchGeom;
};

/*
 * Given a couch geometry, fixes the bbox
 */
function updatedGeometry(couchGeom) {

	if( OpenLayers 
	 && OpenLayers.Geometry 
	 && OpenLayers.Geometry.fromWKT ) {
		var olGeom = OpenLayers.Geometry.fromWKT(couchGeom.wkt);
		var bounds = olGeom.getBounds();
		couchGeom.bbox = [
			bounds.left
			,bounds.bottom
			,bounds.right
			,bounds.top
			];
	};
	
	if( couchGeom.simplified ){
		delete couchGeom.simplified;
	};
};

/*
 * Returns a geometry object used in OpenLayers given
 * a geometry obtained from a Couch document.
 */
function getOpenLayersGeometry(opts_) {
	var opts = $n2.extend({
		doc: null
		,couchGeom: null
	},opts_);
	
	var nunaliit_geom = opts.couchGeom;
	
	if( !nunaliit_geom && opts.doc ){
		nunaliit_geom = opts.doc.nunaliit_geom;
	};
	
	if( nunaliit_geom ){
		if( OpenLayers && OpenLayers.Geometry && OpenLayers.Geometry.fromWKT ) {
			var olGeom = OpenLayers.Geometry.fromWKT(nunaliit_geom.wkt);
			return olGeom;
		} else { 
			throw 'OpenLayers must be installed to update document geometries';
		};
	};

	return undefined;
};

/*
 * Selects a tile layer from a bounding box. If a tile
 * layer is selected, then its name is set in the
 * 'viewName' attribute if the view options and the
 * tile identifiers are saved as an array in the 'keys'
 * property.
 * If an appropriate tile layer is found, true is returned.
 * Otherwise, false is returned.
 */	
function selectTileViewFromBounds(viewOptions, bb, layer, fids) {
	
	var views = [
		{
			tile:$n2.tiles.format4326_25M
			,name: 'geom-tile25m'
			,list: 'noduplicate'
			,layer: false
			,fid: false
		}
		,{
			tile:$n2.tiles.format4326_25M
			,name: 'geom-layer-tile25m'
			,list: 'noduplicate'
			,layer: true
			,fid: false
		}
		,{
			tile:$n2.tiles.format4326_65K
			,name: 'geom-tile65k'
			,list: 'noduplicate'
			,layer: false
			,fid: false
		}
		,{
			tile:$n2.tiles.format4326_65K
			,name: 'geom-layer-tile65k'
			,list: 'noduplicate'
			,layer: true
			,fid: false
		}
		,{
			tile:$n2.tiles.format4326_200
			,name: 'geom-tile200'
			,list: 'noduplicate'
			,layer: false
			,fid: false
		}
		,{
			tile:$n2.tiles.format4326_200
			,name: 'geom-layer-tile200'
			,list: 'noduplicate'
			,layer: true
			,fid: false
		}
		,{
			tile:null
			,name: 'geom-layer-fid'
			,layer: true
			,fid: true
		}
		,{
			tile:null
			,name: 'geom-layer'
			,layer: true
			,fid: false
		}
		,{
			tile:null
			,name: 'geom'
			,layer: false
			,fid: true
		}
	];
	
	// bbox and fids are mutually exclusive
	if( bb && fids ) bb = null;
	
	for(var i=0,e=views.length; i<e; ++i) {
		var v = views[i];

		if( bb && v.tile && layer && v.layer ) {
			// This view support tiles and layer
			if( $n2.tiles.getApproxTilesForBounds(
				v.tile
				,bb[0],bb[1]
				,bb[2],bb[3] ) < 500 ) {
				
				viewOptions.viewName = v.name;
				
				var tiles = $n2.tiles.getTilesFromBounds(
					v.tile
					,bb[0],bb[1]
					,bb[2],bb[3]
					);
					
				viewOptions.keys = [];
				for(var j=0,k=tiles.length; j<k; ++j) {
					viewOptions.keys.push( [layer,tiles[j]] );
				};
				
				if( v.list ) viewOptions.listName = v.list;
				
				return true;
			};
			
		} else if( bb && v.tile && !layer && !v.layer ) {
			// This view support tiles only
			if( $n2.tiles.getApproxTilesForBounds(
				v.tile
				,bb[0],bb[1]
				,bb[2],bb[3] ) < 500 ) {
				
				viewOptions.viewName = v.name;
				
				viewOptions.keys = $n2.tiles.getTilesFromBounds(
					v.tile
					,bb[0],bb[1]
					,bb[2],bb[3]
					);

				if( v.list ) viewOptions.listName = v.list;
				
				return true;
			};
			
		} else if( fids && v.fid && layer && v.layer ) {
			// This view supports layer and fid
			viewOptions.viewName = v.name;
			
			viewOptions.keys = [];
			for(var j=0,k=fids.length; j<k; ++j) {
				viewOptions.keys.push( [layer,fids[j]] );
			};

			if( v.list ) viewOptions.listName = v.list;
				
			return true;
			
		} else if( fids && v.fid && !layer && !v.layer ) {
			// This view supports fid
			viewOptions.viewName = v.name;
			
			viewOptions.keys = fids;

			if( v.list ) viewOptions.listName = v.list;
				
			return true;
			
		} else if( !fids && !v.fid && layer && v.layer ) {
			// This view supports fid
			viewOptions.viewName = v.name;
			
			viewOptions.keys = [layer];

			if( v.list ) viewOptions.listName = v.list;
				
			return true;
			
		} else if( !bb && !fids && !layer && !v.fid && !v.layer && !v.tile ) {
			// This view supports fid
			viewOptions.viewName = v.name;

			if( v.list ) viewOptions.listName = v.list;
				
			return true;
		};
	};
	
	return false;
};

function queryGeometries(atlasDesignDoc, viewOptions) {

	var bounds = null;
	
	// Rebuild view options
	var data = {};

	// Install default view
	data.viewName = 'geom';
	data.listName = 'noduplicate';
	
	// Copy over client request
	for(var key in viewOptions) {
		if( key === 'bounds' ) {
			bounds = viewOptions[key];
		} else {
			data[key] = viewOptions[key];
		};
	};
	
	// Select proper tile layer
	if( bounds ) {
		// Switch view name and add keys for bounds
		selectTileViewFromBounds(data, bounds);
	};
	
	// Make request
	atlasDesignDoc.queryView(data);
};

$n2.couchGeom = {
	getCouchGeometry: getCouchGeometry
	,updateDocumentWithWktGeometry: updateDocumentWithWktGeometry
	,updatedGeometry: updatedGeometry
	,getOpenLayersGeometry: getOpenLayersGeometry
	,selectTileViewFromBounds: selectTileViewFromBounds
	,queryGeometries: queryGeometries
};

})(nunaliit2);