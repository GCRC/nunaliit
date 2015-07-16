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

$Id: n2.upload.js 8165 2012-05-31 13:14:37Z jpfiset $
*/

/*
 * @requires n2.utils.js
 * @requires n2.class.js
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
			,geometryType: 'all'
			,contentType: null
			,fileName: null
			,onError: $n2.reportError
		},opts_);
		
		if( !opts.docIds ) {
			onError('docIds must be provided when exporting by docIds');
		};
		
		// Target window
		var target = '';
		if( opts.targetWindow ){
			target = ' target="'+opts.targetWindow+'"';
		};
		
		var url = this.serverUrl + 'export';
		if( opts.fileName ){
			url = url + '/' + opts.fileName;
		};
		var $form = $('<form action="'+url+'" method="POST"'+target+'></form>');
		
		$('<input type="hidden" name="format" value="geojson"></input>').appendTo($form);
		$('<input type="hidden" name="method" value="doc-id"></input>').appendTo($form);
		$('<input type="hidden" name="filter"></input>')
			.val(opts.geometryType)
			.appendTo($form);
		
		if( opts.contentType ){
			$('<input type="hidden" name="contentType"></input>')
				.val(opts.contentType)
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
	}
});
	
$n2.couchExport = {
	Export: Export
};

})(jQuery,nunaliit2);