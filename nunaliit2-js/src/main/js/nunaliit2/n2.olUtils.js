/*
Copyright (c) 2012, Geomatics and Cartographic Research Centre, Carleton 
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

function isValidGeom(olGeom){
	var vertices = olGeom.getVertices();
	for(var i=0,e=vertices.length; i<e; ++i){
		var vertice = vertices[i];
		if( typeof(vertice.x) !== 'number' 
			|| vertice.x !== vertice.x // check for NaN
			) { 
			return false;
		} else if( typeof(vertice.y) !== 'number'
			|| vertice.y !== vertice.y // check for NaN
			) {
			return false;
		};
	};
	
	return true;
};

//Sort features so that points are drawn on top (come last)
//of linestrings and linestrings on top of polygons.
//Between polygons and linestrings, sort the largest
//geometries first.
function sortFeatures(features){
	features.forEach(function(f){
		delete f._n2Sort;
	});
    features.sort(featureSorting);
};
function featureSorting(a,b){
	var aSort = a._n2Sort;
	if( !aSort ) {
		aSort = prepareFeatureForSorting(a);
	};
	var bSort = b._n2Sort;
	if( !bSort ) {
		bSort = prepareFeatureForSorting(b);
	};
	
	if( aSort.isPoint && bSort.isPoint ) {
		return 0;
	} else if( aSort.isPoint ) {
		return 1;
	} else if( bSort.isPoint ) {
		return -1;
	} else {
		// One of the two geometries is not a point
		if( aSort.isLineString && bSort.isLineString ) {
			if( aSort.largestDim > bSort.largestDim ) {
				return -1;
			} else {
				return 1;
			};
		} else if( aSort.isLineString ){
			return 1;
		} else if ( bSort.isLineString ) {
			return -1
		} else {
			// Both geometries are polygons
			if( aSort.largestDim > bSort.largestDim ) {
				return -1;
			} else {
				return 1;
			};
		};
	};
};
//Prepare features for sorting
function prepareFeatureForSorting(f){
	f._n2Sort = {};
	var geomClass = f.geometry.CLASS_NAME;
	f._n2Sort.isPoint = (geomClass.indexOf('Point') >= 0);
	if( f._n2Sort.isPoint ) {
		f._n2Sort.isLineString = false;
		f._n2Sort.isPolygon = false;
		f._n2Sort.largestDim = 0;
	} else {
		f._n2Sort.isLineString = (geomClass.indexOf('LineString') >= 0);
		if( f._n2Sort.isLineString ){
			var bounds = f.geometry.getBounds();
			
			f._n2Sort.largestDim = bounds.top - bounds.bottom;
			var tmp = bounds.right - bounds.left;
			if( f._n2Sort.largestDim < tmp ) {
				f._n2Sort.largestDim = tmp;
			};
		} else {
			f._n2Sort.isPolygon = true;
			
			var bounds = f.geometry.getBounds();
			
			// Use area
			f._n2Sort.largestDim = (bounds.top - bounds.bottom) * (bounds.right - bounds.left);
		};
		
	};
	return f._n2Sort;
};


$n2.olUtils = {
	isValidGeom: isValidGeom
	,sortFeatures: sortFeatures
	,featureSorting: featureSorting
};


})(jQuery,nunaliit2);