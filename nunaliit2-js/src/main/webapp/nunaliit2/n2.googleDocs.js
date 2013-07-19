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

$Id: n2.googleDocs.js 8165 2012-05-31 13:14:37Z jpfiset $
*/

// @requires n2.utils.js

;(function($,$n2){

// =============================================
// SpreadSheet
// =============================================

var SpreadSheet = $n2.Class({
	
	descriptor: null
	
	,entries: null
	
	,initialize: function(opts_){
		var opts = $n2.extend({
			descriptor: null
			,entries: null
		},opts_);

		this.descriptor = opts.descriptor;
		this.entries = opts.entries;
	}

	,getDescriptor: function(){
		return this.descriptor;
	}
	
	,getTitle: function(){
		return this.descriptor.title;
	}
	
	,getPosition: function(){
		return this.descriptor.position;
	}

	,getEntries: function(){
		return this.entries;
	}
});	

// =============================================
// SpreadSheetDescriptor
// =============================================

var SpreadSheetDescriptor = $n2.Class({
	
	key: null
	
	,id: null
	
	,position: null
	
	,title: null
	
	,initialize: function(opts_){
		var opts = $n2.extend({
			key: null
			,id: null
			,position: null
			,title: null
		},opts_);

		this.key = opts.key;
		this.id = opts.id;
		this.position = opts.position;
		this.title = opts.title;
	}

	,getSpreadSheet: function(opts_) {
		var opts = $.extend({
				onSuccess: function(spreadsheet){}
				,onError: function(errMsg){}
			},opts_);
		
		var _this = this;
			
		getSpreadSheetData({
			key: this.key
			,position: this.position
			,format: 'parsed'
			,onSuccess: function(entries){
				var s = new SpreadSheet({
					descriptor: _this
					,entries: entries
				});
				opts.onSuccess(s);
			}
			,onError: function(errorMsg){
				opts.onError('Error loading spreadsheet at position '+this.position+': '+errorMsg);
			}
		});		
	}
});	

// =============================================
// WorkBook
// =============================================

var WorkBook = $n2.Class({
	
	key: null
	
	,title: null
	
	,author: null
	
	,spreadSheetDescriptors: null
	
	,initialize: function(opts_){
		var opts = $n2.extend({
			key: null
			,title: null
		},opts_);

		this.spreadSheetDescriptors = [];
		
		this.key = opts.key;
		this.title = opts.title;
	}

	,getSpreadSheetDescriptors: function(){
		return this.spreadSheetDescriptors;
	}
	
	,getSpreadSheetDescriptor: function(opts_){
		var opts = $n2.extend({
			id: null
			,position: null
			,title: null
		},opts_);
		
		for(var i=0,e=this.spreadSheetDescriptors.length; i<e; ++i){
			var sd = this.spreadSheetDescriptors[i];
			
			if( opts.id && opts.id === sd.id ) {
				return sd;
			} else if( typeof(opts.position) === 'number' && opts.position === sd.position ) {
				return sd;
			} else if( opts.title && opts.title === sd.title ) {
				return sd;
			};
		};
		
		return null;
	}
	
	,getSpreadSheet: function(opts_){
		var opts = $n2.extend({
			id: null
			,position: null
			,title: null
			,onSuccess: function(speadsheet){}
			,onError: function(errMsg){}
		},opts_);
		
		var sd = this.getSpreadSheetDescriptor(opts);
		if( sd ){
			sd.getSpreadSheet({
				onSuccess: opts.onSuccess
				,onError: opts.onError
			});
			return;
		};
		
		opts.onError('SpreadSheet descriptor not found: '+opts.title+'/'+opts.id+'/'+opts.position);
	}
	
	,getAllSpreadSheets: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(arr){}
			,onError: function(errMsg){}
		},opts_);

		var descriptors = this.getSpreadSheetDescriptors();
		
		var waiting = {};
		for(var i=0,e=descriptors.length; i<e; ++i){
			var id = descriptors[i].id;
			waiting[id] = true;
		};
		
		for(var i=0,e=descriptors.length; i<e; ++i){
			var sd = descriptors[i];
			sd.getSpreadSheet({
				onSuccess: loaded
				,onError: opts.onError
			});
		};
		
		var result = [];
		function loaded(spreadSheet){
			var id = spreadSheet.getDescriptor().id;
			delete waiting[id];
			result.push(spreadSheet);
			
			for(id in waiting){
				if( waiting[id] ) return; // still waiting
			};
			
			// All arrived
			opts.onSuccess(result);
		};
	}
});	
	
function getWorkBook(options_) {
	var options = $.extend({
			key: null
			,onSuccess: function(workbook){}
			,onError: function(errMsg){}
		},options_);
		
	if( !options.key ) {
		options.onError('Google Spreadsheet key required.');
	};
	
	$.ajax({
		async: true
		,dataType: 'json'
		,data: {
			alt: 'json'
		}
		,cache: false
		,traditional: true
		,url: 'https://spreadsheets.google.com/feeds/worksheets/'+options.key+'/public/basic'
		,success: handleData
		,error: function(XMLHttpRequest, textStatus, errorThrown){
			options.onError('Unable to load workbook: '+textStatus);
		}
	});
	
	function handleData(data) {
		var workbook = new WorkBook({
			key: options.key
		});
		
		if( data && data.feed ){
			var feed = data.feed;
			
			if( feed.title && feed.title.$t ){
				workbook.title = feed.title.$t;
			};
			
			if( feed.author ){
				workbook.author = {};
				
				if( feed.author.name && feed.author.name.$t ){
					workbook.author.name = feed.author.name.$t;
				};
				
				if( feed.author.email && feed.author.email.$t ){
					workbook.author.email = feed.author.email.$t;
				};
			};
			
			if( feed.entry ){
				for(var i=0,e=feed.entry.length; i<e; ++i){
					var entry = feed.entry[i];
					var sheet = {
						key: options.key
						,position: i+1
					};
					
					if( entry.title ){
						sheet.title = entry.title.$t;
					};
					
					if( entry.id && entry.id.$t ){
						var index = entry.id.$t.lastIndexOf('/');
						if( index >= 0 ){
							sheet.id = entry.id.$t.substr(index+1);
						};
					};
					
					var sd = new SpreadSheetDescriptor(sheet);

					workbook.spreadSheetDescriptors.push(sd);
				};
			};
		};
		
		options.onSuccess(workbook);
	};
};
	
//=============================================
// Functions
//=============================================
	
function getSpreadSheetData(opts_) {
	var opts = $.extend({
			key: null
			,position: '1'
			,format: 'raw'
			,onSuccess: function(data){}
			,onError: function(errorMsg){}
		},opts_);
		
	if( !opts.key ) {
		opts.onError('Google Spreadsheet key required.');
	};
	
	$.ajax({
		async: true
		,dataType: 'json'
		,data: {
			alt: 'json'
		}
		,cache: false
		,traditional: true
		,url: 'https://spreadsheets.google.com/feeds/list/'+opts.key+'/'+opts.position+'/public/values'
		,success: handleData
		,error: function(XMLHttpRequest, textStatus, errorThrown){
			opts.onError('Unable to load spreadsheet: '+textStatus);
		}
	});
	
	function handleData(data) {		
		if( opts.format === 'parsed' ) {
			var entries = parseSpreadSheetData(data);
			opts.onSuccess(entries);
		} else {
			opts.onSuccess(data);
		};
	};
};

var gsxRe = /^gsx\$(.*)$/;
function parseSpreadSheetData(data) {
	var res = [];
	
	if( data && data.feed && data.feed.entry ) {
		var entries = data.feed.entry;
		for(var loop=0; loop<entries.length; ++loop) {
			var entry = entries[loop];
			var e = {};
			for(var key in entry) {
				var match = key.match(gsxRe);
				if( match ) {
					var value = entry[key].$t;
					e[match[1]] = value;
				};
			};
			res.push(e);
		};
	};

	return res;
};

$n2.googleDocs = {
	getWorkBook: getWorkBook
	,getSpreadSheetData: getSpreadSheetData
	,parseSpreadSheetData: parseSpreadSheetData
};

})(jQuery,nunaliit2);