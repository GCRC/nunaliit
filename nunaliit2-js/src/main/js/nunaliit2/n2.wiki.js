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
var regBlank = /^\s*$/;
function isBlankLine(line){
	if( '' === line ) return true;
	if( regBlank.test(line) ){
		return true;
	};
	return false;
};

//*******************************************************
var regBlock = /^[=-]/;
function isBlockLine(line){
	if( isBlankLine(line) ) return true;
	
	if( regBlock.test(line) ){
		return true;
	};
	return false;
};

//*******************************************************
function getCharAt(line, index){
	var c = undefined;
	if( line.length > index ){
		c = line[index];
	};
	return c;
};

//*******************************************************
// Look at consecutive lines and merge them into one if
// a line is a continuation of another
function mergeLines(lines){
	function isContinuingLine(line){
		if( isBlockLine(line) ) return false;
		if( '*' === line[0] ) return false;
		if( '#' === line[0] ) return false;
			
		return true;
	};
	
	var newLines = [];
	
	var previousLine = null;
	
	for(var i=0,e=lines.length; i<e; ++i){
		var line = lines[i];
	
		if( null === previousLine ){
			if( isBlockLine(line) ){
				// This is a block line. Can not be continued
				previousLine = null;
			} else {
				previousLine = line;
			};

			// Simply add this one
			newLines.push(line);
			
			
		} else {
			if( isContinuingLine(line) ){
				// Should continue previous line
				previousLine = previousLine + ' ' + line;
				newLines[newLines.length-1] = previousLine;
				
			} else {
				
				if( isBlockLine(line) ){
					// This is a block line. Can not be continued
					previousLine = null;
				} else {
					previousLine = line;
				};

				newLines.push(line);

			};
		};
	};
	
	return newLines;
};

//*******************************************************
function processLists(lines){
	
	function outputListLines(lines, offset, newLines){
		var firstChar = getCharAt(lines[0],offset);
		
		if( '*' === firstChar ){
			newLines.push('<ul>');
		} else {
			newLines.push('<ol>');
		};

		var isOpened = false;
		
		for(var i=0,e=lines.length; i<e; ++i){
			var line = lines[i];

			var c2 = getCharAt(line, offset+1);
			
			if( '*' === c2 || '#' === c2 ){
				if( !isOpened ){
					newLines.push('<li class="n2wiki">');
				};

				var listLines = [];
				while( i<e ){
					line = lines[i];
					var c3 = getCharAt(line, offset+1);
					if( c3 !== c2 ){
						break;
					} else {
						listLines.push(line);
						++i;
					};
				};
				
				if( i<e ){
					--i;
				};
				
				outputListLines(listLines, offset+1, newLines);
				newLines.push('</li>');
				isOpened = false;
				
			} else {
				if( isOpened ){
					newLines.push('</li><li class="n2wiki">');
				} else {
					newLines.push('<li class="n2wiki">');
				};
				newLines.push( line.substr(offset+1) );
				isOpened = true;
			};
		};

		if( isOpened ){
			newLines.push('</li>');
		};

		if( '*' === firstChar ){
			newLines.push('</ul>');
		} else {
			newLines.push('</ol>');
		};
	};
	
	var newLines = [];
	
	for(var i=0,e=lines.length; i<e; ++i){
		var line = lines[i];
		
		var firstChar = getCharAt(line,0);

		if( '*' === firstChar 
		 || '#' === firstChar ){
			
			var listLines = [];
			
			while( i<e ){
				line = lines[i];

				var c1 = getCharAt(line, 0);
				
				if( c1 !== firstChar ){
					break;
				} else {
					listLines.push( line );
					++i;
				};
			};
			
			if( i<e ){
				--i;
			};
			
			outputListLines(listLines, 0, newLines);

		} else {
			newLines.push(line);
		};
	};
	
	return newLines;
};

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
	text = text.replace(/[&><\r]/g,function(m){
		if( '&' === m ) return '&amp;';
		if( '>' === m ) return '&gt;';
		if( '<' === m ) return '&lt;';
		if( '\r' === m ) return '';
		return m;
	});
	
	var lines = text.split('\n');
	
	lines = mergeLines(lines);
	lines = processLists(lines);

	for(var i=0,e=lines.length; i<e; ++i){
		var line = lines[i];
		
		// Headings
		line = line.replace(/(?:^)([=]+)(.*)\1/g, function (m, l, t) {
	        return '<h' + l.length + ' class="n2wiki">' + t + '</h' + l.length + '>';
	    });
		
		// Horizontal Line
		line = line.replace(/(?:^|\n)([-]+)\s*/g, function (m) {
	        return '<hr class="n2wiki"/>';
	    });
		
		lines[i] = line;
	};

	return lines.join('');
};

//*******************************************************
$n2.wiki = {
	WikiToHtml: WikiToHtml
};

})(nunaliit2);
