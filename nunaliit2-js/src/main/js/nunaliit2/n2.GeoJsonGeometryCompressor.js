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

*/

;(function($n2){

	var DEFAULT_PRECISION = 0.00001;
	var MIN_POSITIONS_LINEAR_RING = 4;
	var MIN_POSITIONS_LINE_STRING = 2;
	
	/**
	 * @param ca coordinate array.  Note this is not what is called 'coordinates' in GeoJSON
	 *           because that is a misnomer, except in the case of Point and Multipoint.
	 *           That is an array of positions (the GeoJSON spec explains
	 *           it correctly but the explanation is not consistent with the naming in the structures).
	 *           This IS the array of coordinates for a single position.
	 * @return recomputed array of position coordinates or null if ca is not an array
	 */
	function compressCoordinateArray(ca, precision, sigDecimals) {
		function compressCoordinate(c) {
			/*
			 * If you have negative values, floor() makes it absolutely larger.
			 * Reverse case for positives.  So I'm going to round.
			 */
			var temp = Math.round(c / precision) * precision;
			
			/*
			 * the above works and is pretty fast but leaves rounding errors in the
			 * binary representation that then need clean-up code.  
			 * 
			 * Note: the above computation is still needed because for precisions > 1.0,
			 * the sigDecimals are still no less than 0 (can't be...) and the above 
			 * ensures that the rounding is done properly according to precision.
			 */
			var str = temp.toFixed(sigDecimals); // toss rounding error digits
			return parseFloat(str);
		};
		
		/*
		 * Only need 2-d coordinates now but handle more for future
		 */
		var out = [];
		for (var i=0, len=ca.length; i < len; i++) {
			out[i] = compressCoordinate(ca[i]);
		};
		return out;
	};
	
	function computeSignificantDecimalDigits(precision) {
		/*
		 * precision is greater than 1 => no digits after the decimal needed
		 */
		var sigDecimals = 0;
		if (precision < 1.0) {
			for (var temp = precision; temp < 1.0; temp *= 10, sigDecimals++) {
				// do nothing
			};
		};
		return sigDecimals;
	};
	
	var defaultOptions_GJCC = {
		precision: DEFAULT_PRECISION, // difference comparison threshold; <> 0

		/*
		 * Default behaviour is to treat a coordinates array as representing the 
		 * positions in a linestring.  The following booleans adjust this 
		 * behaviour.
		 * ! isLinearRing && ! isPoint => linestring
		 * ! isLinearRing && isPoint   => point
		 * isLinearRing && ! isPoint   => linearring
		 */
		
		// if true, 1st and last point are identical and there must be at least four positions
		isLinearRing: false,
		
		// if true, coordinates are intended to represent a point
		isPoint: false,
		
		// if true, the inner rings are dropped from multipolygons and polygons.
		dropInnerRings: false
	};
	$n2.GeoJsonCoordinatesCompressor = $n2.Class({
		/*
		 * Object to scan the coordinates for a linear set of positions
		 * and simplify it to ensure that positions
		 * are distinct when compared using the configured precision.
		 * 
		 * Adjusting the precision of a point geometry is handled as a special case.
		 */
		options: null,	
				
		significantDigits: null,
			
		initialize: function(/* ... variable argument list ... */) { // duplicates? - rightmost take precedence
			this.options = $n2.extend({}, defaultOptions_GJCC);
			for (var i=0; i < arguments.length; i++) { // update o with properties from objects in variable arg list.
				var o = arguments[i];
				if ($n2.isDefined(o)) {
					this.options = $n2.extend(true, this.options, o);
				};
			};
			
			/*
			 * If precision makes no sense, revert to default.
			 */
			if (0.0 === this.options.precision) {
				this.options.precision = DEFAULT_PRECISION;
			};
			this.significantDigits = computeSignificantDecimalDigits(this.options.precision);
		},
		
		/**
		 * @param coordinates array of coordinate pairs, each an array, to be compressed
		 * @return compressed array of coordinates or null if precision-adjustment geometry
		 * is insignificant.
		 */
		compress: function(coordinates) {
			if (this.options.isPoint) {
				return compressCoordinateArray(coordinates, this.options.precision, this.significantDigits);
			};
			
			/*
			 * Except in the point case handled above, all coordinate arrays are misnamed position arrays.
			 * For all remaining cases, the elements of coordinates must be arrays.  Check only the first
			 * and simply return the input coordinates array if it is not an array.  Probably a Point being
			 * processed without configuring the options properly to deal with that.
			 * 
			 * Better to just keep the existing precision of the point than to mangle the coordinates in the
			 * following code that expects arrays.
			 * 
			 * Only check the first array element for efficiency.
			 */
			if (! $n2.isArray(coordinates[0])) {
				return coordinates;
			};
			
			var out = [];
			var last = compressCoordinateArray(coordinates[0], this.options.precision, this.significantDigits);
			out.push(last); // 1st position
			
			for (var i=1, len=coordinates.length - 1; i < len; i++) {
				var curr = compressCoordinateArray(coordinates[i], this.options.precision, this.significantDigits);
				if (last[0] !== curr[0] ||
					last[1] !== curr[1]) {
					out.push(curr);
					last = curr;
				};
			};
			out.push(compressCoordinateArray(coordinates[len], this.options.precision, this.significantDigits));
			
			// sanity check
			if (this.options.isLinearRing && MIN_POSITIONS_LINEAR_RING > out.length) {
				return null; // return null - zero area ring
			} else if (MIN_POSITIONS_LINE_STRING > out.length) {
				return null; // return null - zero length 
			};
			
			return out;
		}
	});

	/**
	 * class-level utility functions for $n2.GeoJsonFeatureCoordinatesProcessor
	 */
	function initialStatus() {
		return {
			original: { linestrings: 0, positions: 0 },
			processed: { linestrings: 0, positions: 0 }
		};
	};
	
	/**
	 * @param accumulate accumulating status structure
	 * @param update the result status
	 */
	function accumulateStatus(accumulate, update) {
		accumulate.original.positions += update.original.positions;
		accumulate.original.linestrings += update.original.linestrings;
		accumulate.processed.positions += update.processed.positions;
		accumulate.processed.linestrings += update.processed.linestrings;
	};

	/**
	 * @param accumulate accumulating status structure
	 * @param inData the original unprocessed data
	 * @param update the result of processing (data and status)
	 * The original unprocessed data and the processed data are passed in
	 * to allow comparisons of the results of processing (e.g., size of
	 * coordinates arrays) to be included in the status info.
	 */
	function computeStatus(accumulate, inData, update) {
		function isPointCase(coords) {
			/*
			 * for point and multipoint, processing occurs on 1-d arrays of
			 * coordinates.  For other cases, processing occurs on 2-d arrays
			 * of positions (n-dim coordinate vectors).
			 */
			if (! $n2.isArray(coords[0])) {
				return true;
			};
			return false;
		};
		
		/*
		 * compare length of in to out coordinate arrays.
		 */
		var inLength, outLength;
		if (isPointCase(inData)) {
			// point counts as 1 position, regardless length of coordinate array
			inLength = 1;
			if ($n2.isDefined(update)) {
				outLength = 1;
			} else {
				outLength = 0;
			};
		} else {
			inLength = inData.length;
			if ($n2.isDefined(update)) {
				outLength = update.length
			} else {
				outLength = 0;
			};					
		};

		accumulate.original.positions += inLength; // number positions
		accumulate.original.linestrings += 1; // one linestring
		accumulate.processed.positions += outLength; // number positions
		if (outLength > 0) {
			accumulate.processed.linestrings += 1; // one linestring
		};
	};
	
	var defaultOptions_GJGC = {
		precision: DEFAULT_PRECISION // difference comparison threshold; <> 0
	};
	$n2.GeoJsonGeometryCompressor = $n2.Class({
		/*
		 * Object to scan the coordinates for all linestrings and positions in 
		 * a GeoJSON feature representation and simplify them to ensure that
		 * positions within each are distinct when compared using the
		 * configured precision.
		 * 
		 * Adjusting the precision of point geometries is handled as a special case.
		 */
		options: null,
		
		/*
		 * compressors for linestring, point, and linearRings
		 */
		linestringCoordCompressor: null,
		pointCoordCompressor: null,
		linearRingCoordCompressor: null,
					
		/*
		 * utility functions for $n2.GeoJsonFeatureCoordinatesProcessor
		 */
		coordinateProcessors: null,

		/*
		 * the coordinate processor
		 */
		featureProcessor: null,

		initialize: function(/* ... variable argument list ... */) { // duplicates? - rightmost take precedence
			this.options = $n2.extend({}, defaultOptions_GJGC);
			for (var i=0; i < arguments.length; i++) { // update o with properties from objects in variable arg list.
				var o = arguments[i];
				if ($n2.isDefined(o)) {
					this.options = $n2.extend(true, this.options, o);
				};
			};

			/*
			 * If precision makes no sense, revert to default.
			 */
			if (0.0 === this.options.precision) {
				this.options.precision = DEFAULT_PRECISION;
			};

			/*
			 * create the coordinate array processors
			 */
			this.linestringCoordCompressor = new $n2.GeoJsonCoordinatesCompressor({
				precision: this.options.precision
			});
			this.pointCoordCompressor = new $n2.GeoJsonCoordinatesCompressor({
				precision: this.options.precision,
				isPoint: true
			});
			this.linearRingCoordCompressor = new $n2.GeoJsonCoordinatesCompressor({
				precision: this.options.precision,
				isLinearRing: true
			});

			/*
			 * encapsulate the processor functions to resolve 'this'.
			 */
			function createCoordinateProcessors(that) {
				that.coordinateProcessors = {
					'point': function(coordinates, context) { 
						return that.pointCoordCompressor.compress(coordinates);
					},
					'multipoint': function(coordinates, context) { 
						return that.pointCoordCompressor.compress(coordinates);
					},
					'linestring': function(coordinates, context) { 
						return that.linestringCoordCompressor.compress(coordinates);
					},
					'multilinestring': function(coordinates, context) { 
						return that.linestringCoordCompressor.compress(coordinates);
					},
					'polygon': function(coordinates, context) { 
						if (that.options.dropInnerRings && 
								0 !== context[context.length-1]) {
							return null;
						};
						return that.linearRingCoordCompressor.compress(coordinates);
					},
					'multipolygon': function(coordinates, context) { 
						if (that.options.dropInnerRings && 
								0 !== context[context.length-1]) {
							return null;
						};
						return that.linearRingCoordCompressor.compress(coordinates);
					}
				};
			};
			createCoordinateProcessors(this);
			
			/*
			 * create the feature coordinate processor
			 */
			this.featureProcessor = new $n2.GeoJsonFeatureCoordinatesProcessor({
				coordinateProcessors: this.coordinateProcessors,
				initialStatus: initialStatus,
				computeStatus: computeStatus,
				accumulateStatus: accumulateStatus
			});
		},
		
		/**
		 * @param feature object with structure corresponding to a GeoJSON
		 *		feature.
		 * @return an object encapsulating the object representing the 
		 * processed feature and the status of the operation performed.
		 */
		compressFeature: function(feature) {
			var out = this.featureProcessor.process.feature(feature);
			return out;
		}
	});

})(nunaliit2);
