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

$Id: n2.olFilter.js 8165 2012-05-31 13:14:37Z jpfiset $
*/

// @requires n2.utils.js
// @requires n2.class.js

;(function($,$n2){

function reportFilterError(errStr, filterObj) {
	$n2.reportError('OL_FILTER','Filter error. Application might not work properly. '+errStr);
	
	log('Filter error: '+errStr, filterObj);
};

function convertFilterArray(arr, onError) {
	var filters = [];
	
	for(var loop=0; loop<arr.length; ++loop) {
		var filter = convertToOpenLayers(arr[loop], onError);
		if( filter ) { filters.push(filter); };
	}
	
	return filters;
};


/**

 Convert a JSON object declaring a filter into
 an OpenLayers filter.
<pre>
 JSON format:
 {
    comparison: <comparison-name>
    ,property:  <property-name>
    ,value:     <value>
 }
   where comparison-name is '='

 or

 {
    logical: <logical-operation>
    ,filters:  [ <filter>, ... ]
 }
   where logical-operation is 'and', 'or'
</pre>
 	@name convertToOpenLayers
 	@function
 	@memberOf nunaliit2
 	@param {Object} obj JSON object that describes the filter
 */
var convertToOpenLayers = function(obj, onError) {
	if( !onError ) onError = reportFilterError;
	
	if( obj.comparison ) {
		if( null == obj.property ) {
			onError('Missing "property" from comparison filter', obj);
			return null;
		};
		if( null == obj.value ) {
			onError('Missing "value" from comparison filter', obj);
			return null;
		};

		if( '=' == obj.comparison ) {
			return new OpenLayers.Filter.Comparison({
				type: OpenLayers.Filter.Comparison.EQUAL_TO
				,property: obj.property
				,value: obj.value
				});
		};
		
		onError('Invalid comparison filter: '+obj.comparison, obj);
		return null;
	};

	if( obj.logical ) {
		if( null == obj.filters ) {
			onError('Missing "filters" from logical filter', obj);
			return null;
		};
		var filters = convertFilterArray( obj.filters, onError );
		
		if( 'and' == obj.logical ) {
			return new OpenLayers.Filter.Logical({
				type: OpenLayers.Filter.Logical.AND
				,filters: filters
				});
		}

		if( 'or' == obj.logical ) {
			return new OpenLayers.Filter.Logical({
				type: OpenLayers.Filter.Logical.OR
				,filters: filters
				});
		}

		onError('Invalid logical filter: '+obj.logical, obj);
		return null;
	}
	
	onError('Unknown filter type', obj);
	return null;
};

var Filter = $n2.Class({
	olFilter: null
	
	,initialize: function() {
	}
	
	,parseJsonFilter: function(opts_) {
		var opts = $n2.extend({
			json: null
			,onError: reportFilterError
		},opts_);
		
		if( !opts.json ) {
			opts.onError('Invalid JSON',this);
			return false;
		};
		
		this.olFilter = convertToOpenLayers(opts.json, opts.onError);
		
		return (this.olFilter != null);
	}
	
	,fromFids: function(fids) {

		this.olFilter = new OpenLayers.Filter.FeatureId({fids:fids});
		
		return true;
	}
	
	,getOpenLayerFilter: function() {
		return this.olFilter;
	}
	
	,matches: function(f) {
		if( !this.olFilter ) {
			// No filter, matches everything
			return true;
		}
		
		return this.olFilter.evaluate(f);
	}
});

$n2.olFilter = {
	CreateOpenLayersFilter: convertToOpenLayers
	,Filter: Filter
	,fromJson: function(json) {
		var filter = new Filter();
		filter.parseJsonFilter({json:json});
		return filter;
	}
	,fromFid: function(fid) {
		var filter = new Filter();
		filter.fromFids([fid]);
		return filter;
	}
	,fromFids: function(fids) {
		var filter = new Filter();
		filter.fromFids(fids);
		return filter;
	}
};


})(jQuery,nunaliit2);