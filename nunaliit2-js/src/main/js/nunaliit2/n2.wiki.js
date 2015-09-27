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
function escapeCharacters(text){
	
	text = text.replace(/[&><\r]/g,function(m){
		if( '&' === m ) return '&amp;';
		if( '>' === m ) return '&gt;';
		if( '<' === m ) return '&lt;';
		if( '\r' === m ) return '';
		return m;
	});
	
	return text;
};

//*******************************************************
function escapeOptions(text){
	
	text = text.replace(/[><]/g,function(m){
		if( '>' === m ) return '&gt;';
		if( '<' === m ) return '&lt;';
		return m;
	});
	
	return text;
};

//*******************************************************
// Look at consecutive lines and merge them into one if
// a line is a continuation of another
function mergeLines(lines){
	function isContinuingLine(line){
		if( isBlockLine(line) ) return false;
		if( '*' === line[0] ) return false;
		if( '#' === line[0] ) return false;
		if( '{' === line[0] ) return false;
		if( '|' === line[0] ) return false;
		if( '!' === line[0] ) return false;
			
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
			newLines.push('<ul class="n2wiki">');
		} else {
			newLines.push('<ol class="n2wiki">');
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
var reTableStart = /^\{\|(.*)$/;
var reTableEnd = /^\|\}(.*)$/;
var reTableCaption = /^\|\+(.*)$/;
var reTableCell = /^(?:\||!)(.*)$/;
var reTableRow = /^\|-(.*)$/;
function processTables(lines){
	function startTable(tableOptions, caption, newLines){
		if( caption ){
			newLines.push('<div class="n2wiki n2wiki_tableCaption">');
			newLines.push(caption);
			newLines.push('</div>');
		};
		
		newLines.push('<table class="n2wiki"');
		
		if( tableOptions ){
			newLines.push(' ');
			newLines.push(tableOptions);
		};
		
		newLines.push('>');
		newLines.push('<tr>');
	};

	function outputTableLines(lines, newLines){
		var tableStarted = false;
		var tableOptions = undefined;
		var caption = undefined;
		for(var i=0,e=lines.length; i<e; ++i){
			var line = lines[i];
			
			var mTableStart = reTableStart.exec(line);
			var mTableEnd = reTableEnd.exec(line);
			var mTableCaption = reTableCaption.exec(line);
			var mTableCell = reTableCell.exec(line);
			var mTableRow = reTableRow.exec(line);

			// Start table
			if( mTableStart ){
				var options = escapeOptions( mTableStart[1] );
				options = $n2.trim(options);
				if( options.length > 0 ){
					tableOptions = options;
				};
				
			} else if( mTableEnd ){
				// End table
				if( !tableStarted ) {
					startTable(tableOptions, caption, newLines);
					tableStarted = true;
				};
				newLines.push('</tr></table>');
			
			} else if( mTableCaption ){
				// Table Caption
				var cap = escapeCharacters( mTableCaption[1] );
				cap = $n2.trim(cap);
				if( cap.length > 0 ){
					caption = cap;
				};
				
			} else if( mTableRow ){
				// Table Row
				if( !tableStarted ) {
					startTable(tableOptions, caption, newLines);
					tableStarted = true;
				};
				
				var rowOptions = mTableRow[1];
				rowOptions = escapeOptions(rowOptions);
				rowOptions = $n2.trim(rowOptions);
				
				newLines.push('</tr><tr');
					
				if( rowOptions.length > 0 ){
					newLines.push( ' ' );
					newLines.push( rowOptions );
				};

				newLines.push('>');
				
			} else if( mTableCell ){
				// Table Cell
				if( !tableStarted ) {
					startTable(tableOptions, caption, newLines);
					tableStarted = true;
				};
				
				var isHeading = false;
				if( line[0] === '!' ){
					isHeading = true;
				};
				var cells = mTableCell[1].split('||');
				for(var j=0,k=cells.length; j<k; ++j){
					var cell = cells[j];
					var cellSplits = cell.split('|');
					var cellOptions = undefined;
					var cellContent = undefined;
					if( cellSplits.length > 1 ){
						cellOptions = cellSplits[0];
						cellContent = cellSplits[1];
					} else {
						cellContent = cellSplits[0];
					};
					
					if( isHeading ){
						newLines.push('<th');
					} else {
						newLines.push('<td');
					};
					
					if( cellOptions ){
						newLines.push( ' ' );
						newLines.push( escapeOptions(cellOptions) );
					};

					newLines.push('>');

					newLines.push( escapeCharacters(cellContent) );

					if( isHeading ){
						newLines.push('</th>');
					} else {
						newLines.push('</td>');
					};
				};
			};
		};
	};

	var newLines = [];
	
	for(var i=0,e=lines.length; i<e; ++i){
		var line = lines[i];

		if( '{|' === line.substr(0,2) ){
			// Start of table
			
			var tableLines = [];
			
			while( i<e ){
				line = lines[i];

				if( '|}' === line.substr(0,2) ){
					// End of table
					tableLines.push( line );
					break;
				} else {
					tableLines.push( line );
					++i;
				};
			};
			
			outputTableLines(tableLines, newLines);

		} else {
			newLines.push(line);
		};
	};
	
	return newLines;
};

//*******************************************************
function computeLink(linkText){
	var links = linkText.split('|');
	
	var externalLink = false;
	var docLink = false;
	var url = links[0];
	var docId = undefined;
	if( 'http://' === url.substr(0,'http://'.length)
	 || 'https://' === url.substr(0,'https://'.length) ){
		externalLink = true;
	} else {
		docLink = true;
		docId = url;
		url = '#';
	};

	var displayProvided = false;
	var display = url;
	if( links.length > 1 ){
		display = links[1];
		displayProvided = true;
	};
	display = escapeCharacters(display);
	
	var html = [];
	html.push('<a class="n2wiki');
	if( docLink ){
		html.push(' n2s_userEvents n2s_createDocOnClick');
		if( !displayProvided ){
			html.push(' n2s_briefDisplay');
		};
	};
	html.push('" href="');
	html.push(url);
	html.push('"');
	if( docLink ){
		html.push(' nunaliit-document="'+docId+'"');
	};
	html.push('>');
	html.push(display);
	html.push('</a>');
	
	return html.join('');
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
	text = escapeCharacters(text);
	
	var lines = text.split('\n');
	
	lines = mergeLines(lines);
	lines = processLists(lines);
	lines = processTables(lines);

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

		// Links
		line = line.replace(/\x5b\x5b([^\x5d]*)\x5d\x5d/g, function (m,l) {
	        return computeLink(l);
	    });

		// Bold
		line = line.replace(/'''([^']+)'''/g, function (m,t) {
	        return '<b>'+t+'</b>';
	    });

		// Italics
		line = line.replace(/''([^']+)''/g, function (m,t) {
	        return '<i>'+t+'</i>';
	    });
		
		if( isBlankLine(line) ){
			line = '<br/>';
		};
		
		
		lines[i] = line;
	};

	return lines.join('');
};

//*******************************************************
$n2.wiki = {
	WikiToHtml: WikiToHtml
};

})(nunaliit2);
