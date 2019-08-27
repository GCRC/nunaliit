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
*/

;(function($,$n2){
"use strict";

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };

// ===================================
	
var FeatureClass = {
	ADMIN: 'A' // countries and states
	,HYDRO: 'H' // stream, lake
	,LANDMARKS: 'L' // park, area
	,PLACES: 'P' // city, village
	,ROADS: 'R' // road, railroad
	,SPOT: 'S' // spot, building, farm
	,MOUNTAINS: 'T' // mountain, hill, rock
	,UNDERSEA: 'U' // undersea
};

//===================================
var AutoComplete = $n2.Class({
	service: null,
	
	inputId: null,
	
	options: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			service: null
			,input: null
			,autocomplete: null
		},opts_);
		
		var _this = this;
		
		this.service = opts.service;
		
		var $input = null;
		if( typeof(opts.input) === 'string' ) {
			$input = $('#'+opts.input);
			this.inputId = opts.input;
		} else {
			$input = $(opts.input);
			var inputId = $input.attr('id');
			if( !inputId ){
				inputId = $n2.getUniqueId();
				$input.attr('id', inputId);
			};
			this.inputId = inputId;
		};
		
		// Request options
		this.options = {
			featureClass: $n2.GeoNames.FeatureClass.PLACES
			,maxRows: 12
		};
		for(var key in opts){
			if( 'service' === key ){
			} else if( 'input' === key ){
			} else if( 'autocomplete' === key ){
			} else {
				this.options[key] = opts[key];
			};
		};

		// Install autocomplete
		var autocompleteOptions = $n2.extend(
			{
				minLength: 3
			}
			,opts.autocomplete
			,{
				open: function() {
					$(this).removeClass("ui-corner-all").addClass("ui-corner-top");
				}
				,close: function() {
					$(this).removeClass("ui-corner-top").addClass("ui-corner-all");
				}
				,source: function(request, response) {
					_this._autocompleteSource(request, response);
				}
			}
		);
		
		$input = this.getInput();
		$input.autocomplete(autocompleteOptions);
	},

	getInput: function(){
		return $('#'+this.inputId);
	},
	
	_autocompleteSource: function(request, response) {
		if( request && request.term && request.term.length > 2 ) {
			var opts = $n2.extend({},this.options);
			
			opts.name = request.term;
			opts.onSuccess = function(results){
				var suggestions = [];
				var names = {};
				for(var i=0,e=results.length; i<e; ++i){
					var res = results[i];
					var name = res.name;
					if( !names[name] ) { // eliminate duplicates
						var obj = {
							label: res.name
							,value: res.name
						};
						suggestions[suggestions.length] = obj;
						names[name] = true;
					};
				};
				response(suggestions);
			};
			opts.onError = function(err){
				$n2.log('Error encountered during GeoService lookup: '+err,err);
				response([]);
			};
			
			this.service.getNameStartsWith(opts);
		};
	}
});
	
// ===================================
var GeoNameService = $n2.Class({
	options: null,
	
	initialize: function(opts_){
		this.options = $n2.extend({
			geoNamesUrl: 'http://api.geonames.org/'
			,username: 'nunaliit'
		},opts_);
	},

	getName: function(opts_){
		var opts = $n2.extend({
			name: null // must be provided
			,featureClass: null
			,maxRows: null
			,country: null
			,countryBias: null
			,style: null
			,onSuccess: function(results){}
			,onError: function(err){}
		},opts_);
		
		var data = {
			name: opts.name	
		};
		
		this._processGeoNamesSearchOptions(data, opts);
		
		this._getGeoNames(
			'searchJSON'
			,data
			,function(r){
				if( r.geonames ) {
					opts.onSuccess(r.geonames);
				} else {
					$n2.log('Invalid result returned by GeoNames',r);
					opts.onError( _loc('Invalid result returned by GeoNames') );
				};
			}
			,opts.onError
		);
	},

	getNameStartsWith: function(opts_){
		var opts = $n2.extend({
			name: null // must be provided
			,featureClass: null
			,maxRows: null
			,country: null
			,countryBias: null
			,style: null
			,onSuccess: function(results){}
			,onError: function(err){}
		},opts_);
		
		var data = {
			name_startsWith: opts.name	
		};
		
		this._processGeoNamesSearchOptions(data, opts);
		
		this._getGeoNames(
			'searchJSON'
			,data
			,function(r){
				if( r.geonames ) {
					opts.onSuccess(r.geonames);
				} else {
					$n2.log('Invalid result returned by GeoNames',r);
					opts.onError( _loc('Invalid result returned by GeoNames') );
				};
			}
			,opts.onError
		);
	},
	
	findNearby: function(opts_){
		var opts = $n2.extend({
			lng: null // must be provided
			,lat: null // must be provided
			,featureClass: null
			,featureCode: null
			,lang: null
			,radius: null
			,maxRows: null
			,style: null
			,localCountry: null
			,cities: null
			,onSuccess: function(results){}
			,onError: function(err){}
		},opts_);
		
		var data = {
			lng: opts.lng
			,lat: opts.lat
		};
		
		if( opts.maxRows ){
			data.maxRows = opts.maxRows;
		};
		
		this._getGeoNames(
			'findNearbyJSON'
			,data
			,function(r){
				if( r.geonames ) {
					opts.onSuccess(r.geonames);
				} else {
					$n2.log('Invalid result returned by GeoNames',r);
					opts.onError( _loc('Invalid result returned by GeoNames') );
				};
			}
			,opts.onError
		);
	},
	
	installAutoComplete: function(opts_){
		var opts = $n2.extend({
			input: null // jquery element of input
		},opts_);
		
		opts.service = this;
		
		return new AutoComplete(opts);
	},
	
	_processGeoNamesSearchOptions: function(data, opts){
		if( opts.featureClass ){
			data.featureClass = opts.featureClass;
		};
		
		if( typeof(opts.maxRows) === 'number' ){
			data.maxRows = opts.maxRows;
		};

		if( opts.country ){
			data.country = opts.country;
		};

		if( opts.countryBias ){
			data.countryBias = opts.countryBias;
		};

		if( opts.style ){
			data.style = opts.style;
		};
	},
	
	_getGeoNames: function(method, data, success, error) {
		var nonNullData = {};
		for (var key in data) {
			if (key && data[key]) {
				nonNullData[key] = data[key];
			};
		};
		nonNullData.username = this.options.username;
		$.ajax({
			url: this.options.geoNamesUrl + method
			,dataType: 'json'
			,data: nonNullData
			,traditional: true
			,success: success
			,error: function(xhr, textStatus) {
				error(textStatus);
			}
		});
	}
});

//===================================

$n2.GeoNames = {
	Service: GeoNameService
	,FeatureClass: FeatureClass
};

})(jQuery,nunaliit2);