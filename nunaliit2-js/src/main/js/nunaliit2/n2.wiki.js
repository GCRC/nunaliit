/*
Copyright (c) 2015, Geomatics and Cartographic Research Centre, Carleton 
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
"use strict";

//var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };

//*******************************************************
function WikiToHtml(opts_){
	var opts = $n2.extend({
		wiki: null
	},opts_);
	
	var text = opts.wiki;
	if( !text ){
		throw 'Wiki text must be specified for WikiToHtml()';
	};

	// Character escaping
	text = text.replace(/&/g,'&amp;');
	text = text.replace(/</g,'&lt;');
	text = text.replace(/>/g,'&gt;');

	// Headings
	text = text.replace(/(?:^|\n)([=]+)(.*)\1/g, function (m, l, t) { // headings
        return '<h' + l.length + ' class="n2wiki">' + t + '</h' + l.length + '>';
    });

	// Horizontal Line
	text = text.replace(/(?:^|\n)([-]+)\s*/g, function (m, l, t) { // headings
        return '<hr class="n2wiki"/>';
    });
	
	return text;
};

//*******************************************************
$n2.wiki = {
	WikiToHtml: WikiToHtml
};

})(nunaliit2);
