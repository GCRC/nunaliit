/*
Copyright (c) 2012, Geomatics and Cartographic Research Centre, Carleton 
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
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); }
,DH = 'n2.couchDispatchSupport'
;

var DispatchSupport = $n2.Class('DispatchSupport',{
	
	dispatchService: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		if( this.dispatchService ) {
			var f = function(m){
				_this._handleDispatch(m);
			};
			
			this.dispatchService.register(DH, 'editClosed', f);
		};
		
		// Window resize event
		$(window).resize(function() {
			_this._windowResized();
		});
	},

	_handleDispatch: function(m){
		if( 'editClosed' === m.type ) {
//			var dispatcher = this.dispatchService;
//			if( dispatcher ) {
//				if( m.deleted ) {
//					dispatcher.send(DH,{
//						type: 'unselected'
//					});
//				} else if( m.cancelled ) {
//					dispatcher.send(DH,{
//						type: 'historyBack'
//					});
//				} else {
//					dispatcher.send(DH,{
//						type: 'selected'
//						,docId: m.doc._id
//						,doc: m.doc
//					});
//				};
//			};
		};
	},

	_windowResized: function(){
		var d = this.dispatchService;
		if( d ){
			d.send(DH,{
				type: 'windowResized'
			});
		};
	}
});

$n2.couchDispatchSupport = {
	DispatchSupport: DispatchSupport
};

})(nunaliit2);
