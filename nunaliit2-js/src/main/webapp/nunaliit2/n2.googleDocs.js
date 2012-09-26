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

function getSpreadSheet(options_) {
	var options = $.extend({
			key: null
			,page: '1'
			,format: 'raw'
			,success: function(data){}
			,error: function(XMLHttpRequest, textStatus, errorThrown){}
		},options_);
		
	if( !options.key ) {
		$n2.reportError('Google Spreadsheet key required.');
	};
	
	$.ajax({
		async: true
		,dataType: 'json'
		,data: {
			alt: 'json'
		}
		,cache: false
		,traditional: true
		,url: 'https://spreadsheets.google.com/feeds/list/'+options.key+'/'+options.page+'/public/values'
		,success: handleData
		,error: options.error
	});
	
	function handleData(data) {		
		if( options.format === 'parsed' ) {
			var entries = parseSpreadSheet(data);
			options.success(entries);
		} else {
			options.success(data);
		};
	};
};

var gsxRe = /^gsx\$(.*)$/;
function parseSpreadSheet(data) {
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
	getSpreadSheet: getSpreadSheet
	,parseSpreadSheet: parseSpreadSheet
};

})(jQuery,nunaliit2);