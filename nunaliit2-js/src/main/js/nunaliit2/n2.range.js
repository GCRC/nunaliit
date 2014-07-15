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
;(function($n2){

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };

var Range = $n2.Class({
	
	min: null,
	
	max: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			min: null
			,max: null
		},opts_);
		
		if( typeof opts.min !== 'number' ){
			throw _loc('Range min must be a number');
		};
		if( typeof opts.max !== 'number' ){
			throw _loc('Range max must be a number');
		};
		if( opts.min > opts.max ){
			throw _loc('Range min can not be greater than max');
		};
		
		this.min = opts.min;
		this.max = opts.max;
	},

	intersectsWith: function(range){
		if( !range ){
			return false;
		};
		
		if( this.min > range.max ){
			return false;
		};
		if( this.max < range.min ){
			return false;
		};
		
		return true;
	},

	intersection: function(range){
		if( !this.intersectsWith(range) ){
			return null;
		};
		
		var min = this.min;
		var max = this.max;

		if( min < range.min ){
			min = range.min;
		};

		if( max > range.max ){
			max = range.max;
		};
		
		return new Range({
			min: min
			,max: max
		});
	}
});

//*******************************************************
$n2.range = {
	Range: Range
};

})(nunaliit2);
