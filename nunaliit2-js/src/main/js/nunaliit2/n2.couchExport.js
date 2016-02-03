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

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };

var Export = $n2.Class('Export',{
	
	serverUrl: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			url: null
		},opts_);
		
		this.serverUrl = opts.url;
	},

	checkAvailable: function(opts_){
		var opts = $n2.extend({
			onAvailable: function(){}
			,onNotAvailable: function(){}
		},opts_);
		
		if( !this.serverUrl ){
			opts.onNotAvailable();
			return;
		};
		
		$.ajax({
			url: this.serverUrl+'welcome'
			,type: 'GET'
			,dataType: 'json'
			,success: function(data, textStatus, jqXHR){
				if( data && data.ok ) {
					opts.onAvailable(data);
				} else {
					opts.onNotAvailable();
				};
			}
			,error: function(jqXHR, textStatus, errorThrown){
				opts.onNotAvailable();
			}
		});
	},
	
	exportByDocIds: function(opts_){
		var opts = $n2.extend({
			docIds: null
			,targetWindow: null
			,filter: 'all'
			,contentType: null
			,fileName: null
			,format: null
			,onError: $n2.reportError
		},opts_);
		
		if( !opts.docIds ) {
			onError('docIds must be provided when exporting by docIds');
		};
		
		var url = this.serverUrl + 'export';
		if( opts.fileName ){
			url = url + '/' + opts.fileName;
		};
		var $form = $('<form>')
			.attr('action',url)
			.attr('method','POST')
			.css({
				display: 'none'
				,visibility: 'hidden'
			});

		// Target window
		if( opts.targetWindow ){
			$form.attr('target',opts.targetWindow);
		};
		
		$('<input type="hidden" name="method" value="doc-id"></input>').appendTo($form);

		if( opts.contentType ){
			$('<input>')
				.attr('type','hidden')
				.attr('name','contentType')
				.val(opts.contentType)
				.appendTo($form);
		};

		if( opts.filter ){
			$('<input>')
				.attr('type','hidden')
				.attr('name','filter')
				.val(opts.filter)
				.appendTo($form);
		} else {
			$('<input>')
				.attr('type','hidden')
				.attr('name','filter')
				.val('all')
				.appendTo($form);
		};

		if( opts.format ){
			$('<input>')
				.attr('type','hidden')
				.attr('name','format')
				.val(opts.format)
				.appendTo($form);
		} else {
			$('<input>')
				.attr('type','hidden')
				.attr('name','format')
				.val('geojson')
				.appendTo($form);
		};
		
		for(var i=0,e=opts.docIds.length; i<e; ++i){
			var docId = opts.docIds[i];
			$('<input type="hidden" name="name"></input>')
				.val(docId)
				.appendTo($form);
		};
		
		$('body').append($form);
		
		$form.submit();
	},
	
	exportBySchemaName: function(opts_){
		var opts = $n2.extend({
			schemaName: null
			,targetWindow: null
			,filter: 'all'
			,contentType: null
			,fileName: null
			,format: null
			,onError: $n2.reportError
		},opts_);
		
		if( !opts.schemaName ) {
			onError('schemaName must be provided when exporting by schema name');
		};
		
		opts.docIds = undefined;

		if( opts.targetWindow ){
			this._exportByForm(opts);
		} else {
			this._exportByAjax(opts);
		};
	},
	
	_exportByForm: function(opts_){
		var opts = $n2.extend({
			docIds: null
			,schemaName: null
			,targetWindow: null
			,filter: 'all'
			,contentType: 'application/binary'
			,fileName: null
			,format: null
			,onError: $n2.reportError
		},opts_);
		
		var url = this.serverUrl + 'export';
		if( opts.fileName ){
			url = url + '/' + opts.fileName;
		};
		var $form = $('<form>')
			.attr('action',url)
			.attr('method','POST')
			.css({
				display: 'none'
				,visibility: 'hidden'
			});

		// Target window
		if( opts.targetWindow ){
			$form.attr('target',opts.targetWindow);
		};

		if( opts.docIds ){
			$('<input>')
				.attr('type','hidden')
				.attr('name','method')
				.attr('value','doc-id')
				.appendTo($form);

			for(var i=0,e=opts.docIds.length; i<e; ++i){
				var docId = opts.docIds[i];
				$('<input>')
					.attr('type','hidden')
					.attr('name','name')
					.val(docId)
					.appendTo($form);
			};

		} else if( opts.schemaName ) {
			$('<input>')
				.attr('type','hidden')
				.attr('name','method')
				.attr('value','schema')
				.appendTo($form);
			$('<input>')
				.attr('type','hidden')
				.attr('name','name')
				.val(opts.schemaName)
				.appendTo($form);

		} else {
			opts.onError('Unrecognized export method');
		};

		if( opts.contentType ){
			$('<input>')
				.attr('type','hidden')
				.attr('name','contentType')
				.val(opts.contentType)
				.appendTo($form);
		};

		if( opts.filter ){
			$('<input>')
				.attr('type','hidden')
				.attr('name','filter')
				.val(opts.filter)
				.appendTo($form);
		} else {
			$('<input>')
				.attr('type','hidden')
				.attr('name','filter')
				.val('all')
				.appendTo($form);
		};

		if( opts.format ){
			$('<input>')
				.attr('type','hidden')
				.attr('name','format')
				.val(opts.format)
				.appendTo($form);
		} else {
			$('<input>')
				.attr('type','hidden')
				.attr('name','format')
				.val('geojson')
				.appendTo($form);
		};
		
		$('body').append($form);
		
		$form.submit();
	},
	
	_exportByAjax: function(opts_){
		var opts = $n2.extend({
			docIds: null
			,schemaName: null
			,filter: 'all'
			,format: null
			,onSuccess: function(result){}
			,onError: $n2.reportError
		},opts_);
		
		var url = this.serverUrl + 'export';

		var data = {};
		if( opts.docIds ){
			data.method = 'doc-id';
			data.name = opts.docIds;

		} else if( opts.schemaName ) {
			data.method = 'schema';
			data.name = opts.schemaName;

		} else {
			opts.onError('Unrecognized export method');
		};

		if( opts.contentType ){
			data.contentType = 'text/plain';
		};

		if( opts.filter ){
			data.filter = opts.filter;
		} else {
			data.filter = 'all';
		};

		if( opts.format ){
			data.format = opts.format;
		} else {
			data.format = 'geojson';
		};
		
		$.ajax({
			url: url
			,type: 'POST'
			,data: data
			,traditional: true
			,dataType: 'text'
			,success: function(res, textStatus, jqXHR){
				opts.onSuccess(res);
			}
			,error: function(jqXHR, textStatus, httpError){
				opts.Error(textStatus);
			}
		});
	}
});
	
$n2.couchExport = {
	Export: Export
};

})(jQuery,nunaliit2);