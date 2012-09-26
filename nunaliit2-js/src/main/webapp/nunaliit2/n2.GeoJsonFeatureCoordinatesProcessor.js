/*
Copyright (c) 2011, Geomatics and Cartographic Research Centre, Carleton 
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

$Id: n2.GeoJsonFeatureCoordinatesProcessor.js 8165 2012-05-31 13:14:37Z jpfiset $
*/

// @requires n2.core.js
// @requires n2.utils.js
// @requires n2.class.js

;(function($,$n2){

	function wrapGeoOutput(type, data, status) {
		var d;
		if (null === data) {
			d = null;
		} else {
			d = {
				'type': type,
				'coordinates': data
			};
		};
		
		return {
			data: d,
			status: status 
		};
	};

	var defaultOptions = {
		coordinateProcessors: {
			/*
			 * Note that each of these returns only the processed coordinates
			 * for the geometry, or null if none to return.
			 * 
			 * default: just return the coordinates unchanged.
			 */
			'point': function(coordinates) { 
				return coordinates; 
			},
			'multipoint': function(coordinates) { 
				return coordinates; 
			},
			'linestring': function(coordinates) { 
				return coordinates; 
			},
			'multilinestring': function(coordinates) { 
				return coordinates; 
			},
			'polygon': function(coordinates) { 
				return coordinates; 
			},
			'multipolygon': function(coordinates) { 
				return coordinates; 
			}
		},
		
		/*
		 * Return the data structure needed for status tracking of the processing to 
		 * be performed.
		 */
		'initialStatus': function() {
			return null;
		},
		
		/*
		 * Compute the status for a processing step performed on a 'simple' geometry
		 * (i.e., those other than the feature itself and a geometrycollection).
		 * 
		 * @param accumulate accumulating status structure
		 * @param inData the original unprocessed data
		 * @param update the result of processing (data and status)
		 * The original unprocessed data and the processed data are passed in
		 * to allow comparisons of the results of processing (e.g., size of
		 * coordinates arrays) to be included in the status info.
		 */
		'computeStatus': function(accumulate, inData, update) {
			// do nothing
		},
		
		/*
		 * Accumulate the status for a set of processed geometries.  This is required 
		 * with geometrycollections and could be, but is not currently used with features
		 * (there a simple assignment is currently used since it would only be done once).
		 * 
		 * @param accumulate accumulating status structure
		 * @param update the result status
		 */
		'accumulateStatus': function(accumulate, update) {
			// do nothing
		},
		
		/*
		 * return an initial context structure.
		 */
		"initialContext": function() {
			return [ ];
		},
		
		/*
		 * @param context context information showing what IS being processed.  Context accumulates
		 * down (geometryCollection, coordinates) and laterally (geometries, across coordinate arrays).
		 * @param direction'down' or 'lateral'
		 * Note that 'down" adjustments are mutable (the original will be unchanged) but lateral
		 * adjustments update the input context.
		 */
		"adjustContext": function(context, direction) {
			var temp;
			if ('down' === direction) {
				// copy array add a new element
				temp = context.slice(0);
				temp.push( 0 );
			} else {
				context[context.length - 1] += 1; // increment last element
				temp = context;
			};
			return temp;
		}
	};
	$n2.GeoJsonFeatureCoordinatesProcessor = $n2.Class({
		/*
		 * Object to scan the coordinates for all linestrings and positions in 
		 * a GeoJSON feature representation and perform configured functions on
		 * each, accumulating status and data concerning the function performed
		 * at the level of the feature.
		 * 
		 * A replicate/modified feature and the stats computed are returned.
		 * 
		 * Handling point geometry is handled as a special case.
		 */
		options: null,	
					
		/*
		 * Object with properties corresponding to the GeoJSON types encapsulated 
		 * within a feature.  Each is a function that invokes processing on the 
		 * corresponding object type and returns data and status information
		 * specific to that processing.
		 * 
		 * Idea for general structuring approach borrowed from 
		 * OpenLayers.Format.GeoJSON.extract.
		 * 
		 * Contained functions are initialized below to get instance initialization correct.  
		 * See use of this.
		 */
		process: {},

		initialize: function(/* ... variable argument list ... */) { // duplicates? - rightmost take precedence
			this.options = $.extend({}, defaultOptions);
			for (var i=0; i < arguments.length; i++) { // update o with properties from objects in variable arg list.
				var o = arguments[i];
				if ($n2.isDefined(o)) {
					this.options = $.extend(true, this.options, o);
				};
			};
			
			/*
			 * NOW INITIALIZE ALL OF THE FUNCTIONS MAINTAINED IN this.process
			 */
			var that = this;
			
			/*
			 * @param feature object with structure corresponding to a GeoJSON
			 *		feature.
			 * @return an object encapsulating the object representing the 
			 * processed feature and the status of the operation performed.
			 */
			this.process.feature = function(feature) {
				if (null === feature) {
					return null;
				};
				
				var context = that.options.initialContext();
				
				var out = { data: {}, status: null };
				for (var p in feature) {
					if (feature.hasOwnProperty(p)) {
						if ('geometry' == p) {
							var geometryType = feature[p].type;
							var geo = that.process[geometryType.toLowerCase()].apply(
								that, [feature[p], that.options.adjustContext(context, 'down')]);
							if (! $n2.isDefined(geo) || ! $n2.isDefined(geo.data)) {
								// processing eliminated geometry - drop feature....
								out.data = null;
							} else {
								out.data[p] = geo.data;
							};
							out.status = geo.status; // don't accumulate here - just retain
						} else {
							if ($n2.isDefined(out.data)) {
								out.data[p] = feature[p];
							};
						};
					};
				};
				
				return out;
			};

			/*
			 * @param point object with structure corresponding to a GeoJSON
			 *		point.
			 * @return an object encapsulating the object representing the 
			 * processed point and the status of the operation performed.
			 */
			this.process.point = function(point, context) {
				if (null === point) {
					return null;
				};

				var out = { data: [], status: that.options.initialStatus() };
				var p = that.options.coordinateProcessors.point(point.coordinates, context);
				that.options.computeStatus(out.status, point.coordinates, p);

				return wrapGeoOutput(point.type, p, out.status);
			};

			/*
			 * @param multipoint object with structure corresponding to a GeoJSON
			 *		multipoint.
			 * @return an object encapsulating the object representing the 
			 * processed multipoint and the status of the operation performed.
			 */
			this.process.multipoint = function(multipoint, context) {
				if (null === multipoint) {
					return null;
				};
				
				var out = { data: [], status: that.options.initialStatus() };
				for (var i=0, len=multipoint.coordinates.length; i<len; ++i) {
					var p = that.options.coordinateProcessors.multipoint(multipoint.coordinates[i], context);
					if ($n2.isDefined(p)) {
						out.data.push(p);
					};
					that.options.computeStatus(
							out.status, multipoint.coordinates[i], p);
					that.options.adjustContext(context, 'lateral');
				};
				
				if (0 === out.data.length) {
					out.data = null;
				};
				
				return wrapGeoOutput(multipoint.type, out.data, out.status);
			};
			
			/*
			 * @param linestring object with structure corresponding to a GeoJSON
			 *		linestring.
			 * @return an object encapsulating the object representing the 
			 * processed linestring and the status of the operation performed.
			 */
			this.process.linestring = function(linestring, context) {
				if (null === linestring) {
					return null;
				};

				var out = { data: [], status: that.options.initialStatus() };
				var s = that.options.coordinateProcessors.linestring(linestring.coordinates, context);
				that.options.computeStatus(
						out.status, linestring.coordinates, s);

				return wrapGeoOutput(linestring.type, s, out.status);
			};

			/*
			 * @param multilinestring object with structure corresponding to a GeoJSON
			 *		multilinestring.
			 * @return an object encapsulating the object representing the 
			 * processed multilinestring and the status of the operation performed.
			 */
			this.process.multilinestring = function(multilinestring, context) {
				if (null === multilinestring) {
					return null;
				};

				var out = { data: [], status: that.options.initialStatus() };
				for (var i=0, len=multilinestring.coordinates.length; i<len; ++i) {
					var s = that.options.coordinateProcessors.multilinestring(multilinestring.coordinates[i], context);
					if ($n2.isDefined(s)) {
						out.data.push(s);
					};
					that.options.computeStatus(
							out.status, multilinestring.coordinates[i], s);
					that.options.adjustContext(context, 'lateral');
				};
				
				if (0 === out.data.length) {
					out.data = null;
				};
				
				return wrapGeoOutput(multilinestring.type, out.data, out.status);
			};
			
			/*
			 * @param polygon object with structure corresponding to a GeoJSON
			 *		polygon.
			 * @return an object encapsulating the object representing the 
			 * processed polygon and the status of the operation performed.
			 */
			this.process.polygon = function(polygon, context) {
				if (null === polygon) {
					return null;
				};

				var out = { data: [], status: that.options.initialStatus() };
				for (var i=0, len=polygon.coordinates.length; i<len; ++i) {
					var p = that.options.coordinateProcessors.polygon(polygon.coordinates[i], context);
					if ($n2.isDefined(p)) {
						out.data.push(p);
					};
					that.options.computeStatus(
							out.status, polygon.coordinates[i], p);
					that.options.adjustContext(context, 'lateral');
				};

				if (0 === out.data.length) {
					out.data = null;
				};
				
				return wrapGeoOutput(polygon.type, out.data, out.status);
			};

			/*
			 * @param multipolygon object with structure corresponding to a GeoJSON
			 *		multipolygon.
			 * @return an object encapsulating the object representing the 
			 * processed multipolygon and the status of the operation performed.
			 */
			this.process.multipolygon = function(multipolygon, context) {
				if (null === multipolygon) {
					return null;
				};

				var out = { data: [], status: that.options.initialStatus() };

				for (var i=0, len=multipolygon.coordinates.length; i<len; ++i) {
					var data2 = [];
					var ctxt = that.options.adjustContext(context, 'down');
					
					for (var j=0, len2=multipolygon.coordinates[i].length; j < len2; j++) {
						var p = that.options.coordinateProcessors.multipolygon(multipolygon.coordinates[i][j], ctxt);
						if ($n2.isDefined(p)) {
							data2.push(p);
						};
						that.options.computeStatus(
								out.status, multipolygon.coordinates[i][j], p);
						that.options.adjustContext(ctxt, 'lateral');
					};
					
					if (0 !== data2.length) {
						out.data.push(data2);
					};
					
					that.options.adjustContext(context, 'lateral');
				};
				
				if (0 === out.data.length) {
					out.data = null;
				};
				
				return wrapGeoOutput(multipolygon.type, out.data, out.status);
			};
			
			/*
			 * @param geometrycollection object with structure corresponding to a GeoJSON
			 *		geometrycollection.
			 * @return an object encapsulating the object representing the 
			 * processed geometrycollection and the status of the operation performed.
			 */
			this.process.geometrycollection = function(geometrycollection, context) {
				if (null === geometrycollection) {
					return null;
				};
				
				var out = { data: [], status: that.options.initialStatus() };

				for (var i=0, len=geometrycollection.geometries.length; i<len; i++) {
					var geometryType = geometrycollection.geometries[i].type;
					var geo = that.process[geometryType.toLowerCase()].apply(
						that, 
						[geometrycollection.geometries[i], that.options.adjustContext(context, 'down')]);
					if ($n2.isDefined(geo) && $n2.isDefined(geo.data)) {
						out.data.push(geo.data);
					};
					
					// note special case of null inData for this case
					that.options.accumulateStatus(out.status, geo.status);
					that.options.adjustContext(context, 'lateral');
				};
				
				/*
				 * wrapping this here allows for recursive geometrycollections which,
				 * the way I read the spec, are allowed.
				 */ 
				var d;
				if (0 === out.data.length) {
					d = null;
				} else {
					d = { 
						"type": geometrycollection.type,
						"geometries": out.data
					};
				};
				
				return {
					data: d,
					status: out.status
				};
			};
		}
	});

})(jQuery,nunaliit2);
