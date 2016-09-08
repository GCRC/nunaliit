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

;(function($,$n2){
"use strict";

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };

// **********************************************************************
var Logger = $n2.Class({
	divId: null,
	
	initialize: function(opts_){
	},

	reportError: function(err){
		this.log(err);
	},
	
	log: function(msg){
		throw new Error('Subclasses must implement function log()');
	}
});

//**********************************************************************
var HtmlLogger = $n2.Class('HtmlLogger', Logger, {
	divId: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			elem: null
		},opts_);
		
		Logger.prototype.initialize.apply(this,arguments);
		
		var $div = $(opts.elem)
			.addClass('n2logger_html');
		this.divId = $n2.utils.getElementIdentifier($div);
		
		$n2.log('HtmlLogger',this);
	},

	reportError: function(err){
		var $e = this._getLogsDiv();

		var $d = $('<div class="error"></div>');
		$d.text(err);
		$e.append($d);
	},
	
	log: function(msg){
		var $e = this._getLogsDiv();

		var $d = $('<div class="log"></div>');
		$d.text(msg);
		$e.append($d);
	},
	
	clear: function(){
		this._getLogsDiv().empty();
	},
	
	_getLogsDiv: function(){
		return $('#'+this.divId);
	}
});

//**********************************************************************
var CustomLogger = $n2.Class('CustomLogger', Logger, {

	logFn: null,
	
	reportErrorFn: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			logFn: null
			,reportErrorFn: null
		},opts_);
		
		Logger.prototype.initialize.apply(this,arguments);
		
		this.logFn = opts.logFn;
		this.reportErrorFn = opts.reportErrorFn;
		
		if( typeof this.logFn !== 'function' ){
			throw new Error('In CustomLogger, a function must be provided for logFn');
		} else {
			this.logFn = this.logFn;
		};
		
		if( typeof this.reportErrorFn === 'function' ){
			this.reportError = this.reportErrorFn;
		};

		$n2.log('CustomLogger',this);
	}
});


$n2.logger = {
	Logger: Logger
	,HtmlLogger: HtmlLogger
	,CustomLogger: CustomLogger
};

})(jQuery,nunaliit2);
