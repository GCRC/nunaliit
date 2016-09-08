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

//var 
//	_loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); }
//	,DH = 'n2.csv'
//	;

// ------------------------------------------------------------------------
/**
 * Given an array of values, compute a line of CSV.
 * @param values Array of values
 * @return String that represents the values in CSV format
 */
function ComputeCsvLine(values){
	if( ! $n2.isArray(values) ){
		throw 'In CSV conversion, values must be given in the form of an array';
	};
	
	var line = [];
	for(var j=0,k=values.length; j<k; ++j){
		var value = values[j];
		if( typeof value === 'string' ) {
			value = value.replace(/"/g,'""');
			line.push('"'+value+'"');

		} else if( typeof value === 'undefined' ) {
			line.push('');

		} else {
			line.push(''+value);
		};
	};
	
	return line.join(',');
};

//------------------------------------------------------------------------
/**
 * Given a table of values, compute the CSV representation
 * and return it into a string.
 * @param table A table of values
 * @return String that represents the values in CSV format
 */
function ValueTableToCsvString(table){
	var valid = true;
	if( ! $n2.isArray(table) ){
		valid = false;
	} else {
		for(var i=0,e=table.length; i<e; ++i){
			var row = table[i];
			if( ! $n2.isArray(row) ){
				valid = false;
				break;
			};
		};
	};
	if( !valid ){
		throw 'In CSV conversion, a table must be given in the form of an array of arrays of values';
	};
	
	var result = [];
	for(var i=0,e=table.length; i<e; ++i){
		var row = table[i];
		var line = ComputeCsvLine(row);
		result.push(line);
	};
	
	return result.join('\n');
};

$n2.csv = {
	ComputeCsvLine: ComputeCsvLine
	,ValueTableToCsvString: ValueTableToCsvString
};

})(nunaliit2);
