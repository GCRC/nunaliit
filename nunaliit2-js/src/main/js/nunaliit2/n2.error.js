/*
Copyright (c) 2016, Geomatics and Cartographic Research Centre, Carleton 
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
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); }
,DH = 'n2.error'
;

// *******************************************************
var Error = $n2.Class({

	msg: undefined,

	cause: undefined,

	conditions: undefined,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			msg: undefined
			,cause: undefined
			,conditions: undefined
		},opts_);
		
		this.msg = opts.msg;
		this.cause = opts.cause;

		if( $n2.isArray(opts.conditions) ){
			for(var i=0,e=opts.conditions.length; i<e; ++i){
				var condition = opts.conditions[i];
				this.setCondition(condition);
			};
		};
	},

	getMessage: function(){
		if( typeof this.msg === 'string' ){
			return this.msg;
		};
		return _loc('<error>');
	},
	
	setCondition: function(condition){
		if( typeof condition === 'string' ){
			if( !this.conditions ){
				this.conditions = {};
			};
			this.conditions[condition] = true;
		};
	},

	isConditionSet: function(condition){
		if( typeof condition === 'string' ){
			if( this.conditions
			 && this.conditions[condition] ){
				return true;
			};

			if( this.cause 
			 && typeof this.cause.isConditionSet === 'function' ){
				return this.cause.isConditionSet(condition);
			};
		};
		
		return false;
	},

	getCause: function(){
		return this.cause;
	},

	setCause: function(cause){
		this.cause = cause;
	},

	toString: function(){
		var messages = [];
		var cause = this;
		while( cause ){
			if( cause.msg ){
				messages.push(cause.msg);
			};
			cause = cause.cause;
		};
		if( messages.length < 1 ){
			messages.push( _loc('<error>') );
		};
		return messages.join(': ');
	}
});

//*******************************************************
function fromString(str,cause){
	var err = new Error({
		msg: str
		,cause: cause
	});
	
	return err;
};

//*******************************************************
function checkErrorCondition(err, condition){
	if( typeof err === 'object' 
	 && typeof err.isConditionSet === 'function' ){
		return err.isConditionSet(condition);
	};
	return false;
};

//*******************************************************
$n2.error = {
	Error: Error
	,fromString: fromString
	,checkErrorCondition: checkErrorCondition
};

})(nunaliit2);
