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
// Remove comments
var gStartComment = "<!--";
var gEndComment = "-->";
function removeComments(lines){
	function stripCommentFromLine(info){
		if( info.commentOpen ){
			if( info.line.indexOf(gEndComment) >= 0 ){
				var index = info.line.indexOf(gEndComment);
				var after = within.substr(index+gEndComment.length);
				
				info.line = after;
				info.commentOpen = false;
			} else {
				info.skipLine = true;
				return;
			};
		};
		
		if( info.line.indexOf(gStartComment) >= 0 ){
			var index = info.line.indexOf(gStartComment);
			var before = info.line.substr(0,index);
			var within = info.line.substr(index+gStartComment.length);
			
			info.commentOpen = true;
			info.commentFound = true;
			info.line = before;
			
			if( within.indexOf(gEndComment) >= 0 ){
				var index = within.indexOf(gEndComment);
				var after = within.substr(index+gEndComment.length);
				
				info.line = before + after;
				info.commentOpen = false;
				
				stripCommentFromLine(info);
			};
		};
	};
	
	var newLines = [];
	var info = {
		commentOpen: false
		,commentFound: false
		,skipLine: false
	};
	
	for(var i=0,e=lines.length; i<e; ++i){
		var line = lines[i];

		info.line = line;
		info.skipLine = false;
		info.commentFound = false;
		
		stripCommentFromLine(info);

		if( info.skipLine ){
			// skip line
		} else if( info.commentFound ){
			if( $n2.trim(info.line) !== '' ){
				newLines.push( info.line );
			};
			
		} else {
			newLines.push( info.line );
		};
	};
	
	return newLines;
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
		
		var tableLine = '<table class="n2wiki"';
		
		if( tableOptions ){
			tableLine += ' ';
			tableLine += tableOptions;
		};
		
		tableLine += '>';

		newLines.push(tableLine);
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
				
				newLines.push('</tr>');
				
				var trLine = '<tr';
					
				if( rowOptions.length > 0 ){
					trLine += ' ';
					trLine += rowOptions;
				};

				trLine += '>';
				
				newLines.push(trLine);
				
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
					
					var tdLine = '<td';
					if( isHeading ){
						tdLine = '<th';
					};
					
					if( cellOptions ){
						tdLine += ' ';
						tdLine += escapeOptions(cellOptions);
					};

					tdLine += '>';
					newLines.push( tdLine );

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
var reSectionOption = /^\s*([-_a-zA-Z][-_a-zA-Z0-9]*)\s*=\s*"(.*)"\s*$/;
function processSections(lines){

	var sections = [];
	var pendingSections = [];
	
	for(var i=0,e=lines.length; i<e; ++i){
		var line = lines[i];

		if( '{{' === line.substr(0,2) ){
			// Start of Section
			
			var section = {
				start: i
			};
			pendingSections.push(section);

		} else if( '}}' === line.substr(0,2) ){
			// End of Section
			if( pendingSections.length > 0 ){
				var section = pendingSections.pop();
				section.end = i;
				sections.push(section);
			};
		};
	};
	
	for(var i=0,e=sections.length; i<e; ++i){
		var section = sections[i];
		var startLine = lines[section.start];
		var replacementLine = getReplacementLine(startLine);
		
		if( replacementLine ){
			lines[section.start] = replacementLine;
			lines[section.end] = '</div>';
		};
	};
	
	return lines;
	
	function getReplacementLine(line){
		var line = line.substr(2);
		var options = line.split('|');
		var attributeMap = {};
		
		for(var i=0,e=options.length; i<e; ++i){
			var option = options[i];
			var matcher = reSectionOption.exec(option);
			if( matcher ){
				var name = matcher[1];
				var value = matcher[2];
				
				attributeMap[name] = value;
				
			} else {
				$n2.log('Invalid wiki section attribute: '+option);
			};
		};
		
		var html = [];
		
		html.push('<div');

		for(var name in attributeMap){
			var validAttribute = false;
			// Black list all scripts
			if( 'on' === name.substr(0,'on'.length) ){
				// Do not output "on" attributes
			} else if( 'nunaliit-' === name.substr(0,'nunaliit-'.length) ){
				// Allow nunaliit specific attributes
				validAttribute = true;
			} else if( $n2.html.isAttributeNameValid(name) ){
				validAttribute = true;
			};
			
			if( validAttribute ){
				var value = attributeMap[name];
				html.push(' ');
				html.push(name);
				html.push('="');
				html.push(value);
				html.push('"');
			};
		};

		html.push('>');
		
		return html.join('');
	};
};

//*******************************************************
var regexAttribute = /^\s*([-_a-zA-Z][-_a-zA-Z0-9]*)\s*=\s*"(.*)"\s*$/;
function insertShowService(links){
	var classNames = [];
	classNames.push( links.shift() );

	// Parse attributes
	var attributeValuesByName = {};
	for(var i=0,e=links.length; i<e; ++i){
		var link = links[i];
		var matcher = regexAttribute.exec(link);
		if( matcher ){
			var name = matcher[1];
			var value = matcher[2];
			
			if( 'class' === name ){
				classNames.push(value);
			} else {
				attributeValuesByName[name] = value;
			};
			
		} else {
			$n2.log('Invalid wiki nunaliit attribute: '+link);
		};
	};

	// Generate HTML
	var html = [];
	
	html.push('<div class="');

	for(var i=0,e=classNames.length; i<e; ++i){
		var className = classNames[i];
		if( i > 0 ){
			html.push(' ');
		};
		html.push(className);
	};
	html.push('"');
	
	for(var name in attributeValuesByName){
		var validAttribute = false;
		// Black list all scripts
		if( 'on' === name.substr(0,'on'.length) ){
			// Do not output "on" attributes
		} else if( 'nunaliit-' === name.substr(0,'nunaliit-'.length) ){
			// Allow nunaliit specific attributes
			validAttribute = true;
		} else if( $n2.html.isAttributeNameValid(name) ){
			validAttribute = true;
		};
		
		if( validAttribute ){
			var value = attributeValuesByName[name];
			html.push(' ');
			html.push(name);
			html.push('="');
			html.push(value);
			html.push('"');
		};
	};

	html.push('/>');
	
	return html.join('');
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

	} else if( 'nunaliit:' === url.substr(0,'nunaliit:'.length) ){
		links[0] = url.substr('nunaliit:'.length);
		return insertShowService(links);

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
// Transform wiki markup to HTML
// Comments:
//    <!-- -->
//
// Special characters are escaped:
//    & -> &amp;
//    < -> &lt;
//    > -> &gt;
//
// Unordered list:
// * line
// * line
// ** line
// ** line
// * line
//
// Ordered list:
// # line
// # line
// ## line
// ## line
// # line
//
// Tables:
// {|                   Start table
// |+                   Table caption
// |-                   New row
// !                    Heading cell
// |                    Cell
// | options | content  Cell with options
// | cell1 || cell2     Multiple cells on one line
// |}                   End table
//
// Headings:
// = Heading1 =
// == Heading2 ==
// === Heading3 ===
// ==== Heading4 ====
// ===== Heading5 =====
// ====== Heading6 ======
// 
// Horizontal lines:
// ----
//
// Links:
// [[http://abc.com | description]]   External link
// [[https://abc.com | description]]  External link
// [[docId | description]]            Internal link
// [[nunaliit:class | option]]        Show service insert
//
// Styling:
// ''italics''
// '''bold'''
// 
function WikiToHtml(opts_){
	var opts = $n2.extend({
		wiki: null
	},opts_);
	
	var text = opts.wiki;
	if( typeof text !== 'string' ){
		throw new Error('Wiki text must be specified for WikiToHtml()');
	};

	var lines = text.split('\n');

	lines = removeComments(lines);
	
	// Character escaping
	for(var i=0,e=lines.length; i<e; ++i){
		var line = lines[i];
		lines[i] = escapeCharacters(line);
	};
	
	lines = mergeLines(lines);
	lines = processLists(lines);
	lines = processTables(lines);
	lines = processSections(lines);

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
