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
"use strict";

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };

var Interval = $n2.Class({
	
	min: null,
	
	max: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			min: null
			,max: null
		},opts_);
		
		if( typeof opts.min !== 'number' ){
			throw _loc('Interval min must be a number');
		};
		if( typeof opts.max !== 'number' ){
			throw _loc('Interval max must be a number');
		};
		if( opts.min > opts.max ){
			throw _loc('Interval min can not be greater than max');
		};
		
		this.min = opts.min;
		this.max = opts.max;
	},
	
	size: function(){
		return (this.max - this.min);
	},

	equals: function(interval){
		if( !interval ){
			return false;
		};
		
		if( typeof interval.min !== 'number' ){
			return false;
		};
		if( typeof interval.max !== 'number' ){
			return false;
		};
		
		if( this.min === interval.min 
		 && this.max === interval.max ){
			return true;
		};

		return false;
	},

	isIncludedIn: function(interval){
		if( !interval ){
			return false;
		};
		
		if( typeof interval.min !== 'number' ){
			return false;
		};
		if( typeof interval.max !== 'number' ){
			return false;
		};
		
		if( this.min >= interval.min 
		 && this.max <= interval.max ){
			return true;
		};

		return false;
	},

	extendTo: function(interval){
		var min = this.min;
		var max = this.max;
		
		if( interval ){
			if( min > interval.min ){
				min = interval.min;
			};
			
			if( max < interval.max ){
				max = interval.max;
			};
		};
		
		var myClass = this.getClass();
		
		return new myClass({
			min: min
			,max: max
		});
	},

	intersectsWith: function(interval){
		if( !interval ){
			return false;
		};
		
		if( this.min > interval.max ){
			return false;
		};
		if( this.max < interval.min ){
			return false;
		};
		
		return true;
	},

	intersection: function(interval){
		if( !this.intersectsWith(interval) ){
			return null;
		};
		
		var min = this.min;
		var max = this.max;

		if( min < interval.min ){
			min = interval.min;
		};

		if( max > interval.max ){
			max = interval.max;
		};
		
		var myClass = this.getClass();
		
		return new myClass({
			min: min
			,max: max
		});
	}
});

//*******************************************************
$n2.Interval = Interval;
$n2.interval = {
	Interval: Interval
};

})(nunaliit2);
