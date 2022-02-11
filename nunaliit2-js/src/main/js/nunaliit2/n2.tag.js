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

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };

// Dispatcher
var DH = 'n2.tag';

//============ Research ========================
// Abstract class that defines the API for researching
// a concept in the database
var TagService = $n2.Class({
	searchView: null,
	dispatchService: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null,
			designDoc: null
		},opts_);
		
		// Create an api and use it
		// Research.prototype.initialize.apply(this,arguments);

		this.designDoc = opts.designDoc;
		this.dispatchService = opts.dispatchService;
		
		if( typeof this.designDoc !== 'object' ){
			throw 'In TagService constructor, the designDoc must be provided';
		};

		if( typeof this.dispatchService !== 'object' ){
			throw 'In TagService constructor, the dispatchService must be provided';
		};
	},

	getAutocompleteQueryFn: function(){
		var _this = this;
		return function(term, cb, tagGroup){
			_this.autocompleteQuery(term, cb, tagGroup);
		};
	},

	autocompleteQuery: function(opts, cb, tagGroup, limit){
		var resultLimit = limit;
		if(!limit) {
			resultLimit = 10;
		}
		var searchTagGroup = tagGroup;
		if(!tagGroup) {
			searchTagGroup = 'undefined';
		}

		this.designDoc.queryView({
			viewName: 'tags'
			,startkey: [searchTagGroup, opts.term, null]
			,endkey: [searchTagGroup, opts.term + '\u9999', {}]
			,group: true
			,reduce: true
			,top: resultLimit
			,onSuccess: function(rows) {
				var values = [];
				for (var i = 0, e = rows.length; i < e; i += 1) {
					values.push(rows[i].key[1]);
				}
				cb(values);
			}
			,onError: function(err) {
				opts.onError(err);
			}
		});
	}
});

// ================ API ===============================
$n2.tag = {
	TagService: TagService
};

})(jQuery,nunaliit2);

