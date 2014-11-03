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

;(function($n2) {

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };

//=========================================================================
var ObjectSelector = $n2.Class({
	
	selectors: null,
	
	initialize: function(selectors){
		this.selectors = selectors;
	},
	
	getValue: function(obj){
		if( typeof obj === 'undefined' ){
			return obj;
			
		} else if( typeof obj === 'object' ){
			var effObj = obj;
			for(var i=0,e=this.selectors.length; i<e; ++i){
				var sel = this.selectors[i];
				if( typeof effObj[sel] === 'undefined' ){
					return undefined;
				};
				effObj = effObj[sel];
			};
			return effObj;
			
		} else if(this.selectors.length < 1){
			return obj;
		
		} else {
			return undefined;
		};
	},
	
	setValue: function(obj, value, create){
		
		var createFlag = (typeof create !== 'undefined') ? create : false;
		
		if( typeof obj !== 'object' ){
			return false;
		};
		if( this.selectors.length < 1 ){
			return false;
		};
		
		var effObj = obj;
		for(var i=0,e=this.selectors.length-1; i<e; ++i){
			var sel = this.selectors[i];
			if( typeof effObj[sel] === 'undefined' ){
				if( createFlag ){
					effObj[sel] = {};
				} else {
					return false;
				};
			} else if( typeof effObj[sel] !== 'object' ){
				return false;
			};
			effObj = effObj[sel];
		};
		var lastSel = this.selectors[this.selectors.length-1];
		effObj[lastSel] = value;
		
		return true;
	},
	
	getSelectorString: function(){
		return this.selectors.join('.');
	}
});

//=========================================================================
function parseSelector(selectorString){
	var parts = selectorString.split('.');
	return new ObjectSelector(parts);
};

// =========================================================================

$n2.objectSelector = {
	parseSelector: parseSelector
};	
	
})(nunaliit2);
