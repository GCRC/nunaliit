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

*/

;(function($,$n2){
"use strict";

/**
 	Returns a map of functions to access the database engine.
 	@name dbSearchEngine
 	@function
 	@memberOf nunaliit2
 	@param {Object} options_
 		Options to connect to the database.
 		url: Relative path, from the application root, where the
 		the database search servlet can be accessed
 		relMediaPath: Relative path, from the application root, where media
 		files are located.
 	@returns {DbSearchEngine}
 		Instance of DbSearchEngine configured according to
 		options.
 */
$n2.dbSearchEngine = function(options_) {

	var defaultOptions = {
		url: './search'
		,relMediaPath: 'test_media/'
	};
	
	var options = $.extend({},defaultOptions,options_);
	
	return {
		getRelMediaPath: function(mediaFile) {
			if( mediaFile ) {
				return options.relMediaPath+mediaFile;
			};
			return options.relMediaPath;
		}
		
		,getHoverSound: function(placeId, opts_) {
			$.ajax({
				type: 'POST'
				,url: options.url + '/getHoverMedia'
				,data: {
					id:placeId
				}
				,dataType: 'json'
				,contentType: 'application/x-www-form-urlencoded; charset=utf-8'
				,async: true
				,success: function(result) {
    				if( result && result.media && result.media.length > 0 ) {
    					var media = result.media[0];
						if( media && media.hover_audio) {
							opts_.installSoundFn(media.hover_audio, opts_);
	    				};
    				};
				}
			});
		}
	
		,searchForContributions: function(searchString, callback) {
			$.ajax({
				type: 'POST'
				,url: options.url + '/searchContributions'
				,data: {
					content:searchString
				}
				,dataType: 'json'
				,contentType: 'application/x-www-form-urlencoded; charset=utf-8'
				,async: true
				,success: function(result) {
					if( result.contributions ) {
						callback(result.contributions);
					};
				}
			});
		}
		
		,searchForPlaceNames: function(searchString, callback) {
			$.ajax({
				type: 'POST'
				,url: options.url + '/searchFeatures'
				,data: {
					content:searchString
				}
				,dataType: 'json'
				,contentType: 'application/x-www-form-urlencoded; charset=utf-8'
				,async: true
				,success: function(result) {
					if( result.features ) {
						callback(result.features);
					};
				}
			});
		}
		
		,findGeometryCentroidFromPlaceId: function(placeId, callback) {
			$.ajax({
				type: 'POST'
				,url: options.url + '/findGeometryCentroid'
				,data: {
					type:'place_id'
					,id:placeId
				}
				,dataType: 'json'
				,contentType: 'application/x-www-form-urlencoded; charset=utf-8'
				,async: true
				,success: function(result) {
					if( result && result.features ) {
						callback(result.features);
					};
				}
			});
		}
		
		,findGeometryCentroidFromId: function(id, callback) {
			$.ajax({
				type: 'POST'
				,url: options.url + '/findGeometryCentroid'
				,data: {
					type:'id'
					,id:id
				}
				,dataType: 'json'
				,contentType: 'application/x-www-form-urlencoded; charset=utf-8'
				,async: true
				,success: function(result) {
					if( result && result.features ) {
						callback(result.features);
					};
				}
			});
		}
		
		,getAudioMediaFromPlaceId: function(placeId, callback) {
			$.ajax({
				type: 'POST'
				,url: options.url + '/getAudioMedia'
				,data: {
					id:placeId
				}
				,dataType: 'json'
				,contentType: 'application/x-www-form-urlencoded; charset=utf-8'
				,async: true
				,success: function(result) {
					if( result && result.media ) {
						callback(result.media);
					};
				}
			});
		}
	};
};

})(jQuery,nunaliit2);