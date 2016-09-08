/*
Copyright (c) 2014, Geomatics and Cartographic Research Centre, Carleton 
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

//*******************************************************
var DateService = $n2.Class({
	
	url: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			url: null
		},opts_);
		
		this.url = opts.url;
	},
	
	getDocIdsFromInterval: function(opts_){
		var opts = $n2.extend({
			interval: null
			,onSuccess: function(docIds){}
			,onError: function(err){}
		},opts_);
		
		var min = null;
		if( !opts.interval 
		 || typeof opts.interval.min !== 'number' ){
			opts.onError('Interval must be supplied');
			return;
		} else {
			min = opts.interval.min;
		};
		var ongoing = false;
		var max = min;
		if( typeof opts.interval.ongoing === 'boolean' ){
			ongoing = opts.interval.ongoing;
		};
		if( !ongoing ){
			if( typeof opts.interval.max !== 'number' ){
				opts.onError('Interval must contain ongoing or max');
				return;
			} else {
				max = opts.interval.max;
			};
		};
		
		var requestData = {
			min: min	
		};
		if( ongoing ) {
			requestData.ongoing = true;
		} else {
			requestData.max = max;
		};
		
	    $.ajax({
	    	url: this.url + 'docIdsFromInterval'
	    	,type: 'get'
	    	,async: true
	    	,data: requestData
	    	,dataType: 'json'
	    	,success: function(res) {
	    		if( res.docIds ) {
	    			opts.onSuccess(res.docIds);
	    		} else {
					opts.onError('Malformed response for doc ids from interval('+min+','+max+')');
	    		};
	    	}
	    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
	    		var err = $n2.utils.parseHttpJsonError(XMLHttpRequest, textStatus);
				var errStr = err.error;
				opts.onError('Error obtaining doc ids from interval('+min+','+max+'): '+errStr);
	    	}
	    });
	}
});



//*******************************************************
$n2.dateService = {
	DateService: DateService
};

})(jQuery,nunaliit2);
