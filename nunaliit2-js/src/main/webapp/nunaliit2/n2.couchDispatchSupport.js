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

$Id$
*/
;(function($,$n2){

// Localization
var _loc = function(str){ return $n2.loc(str,'nunaliit2-couch'); };

var DispatchSupport = $n2.Class('DispatchSupport',{
	options: null
	
	,dispatcherHandle: null
	
	,docCreatedCb: null

	,docUpdatedCb: null
	
	,initialize: function(opts_){
		this.options = $n2.extend({
			directory: null
		},opts_);
		
		var _this = this;
		
		this.docCreatedCb = function(doc){
			_this._docUploaded(doc,true);
		};
		this.docUpdatedCb = function(doc){
			_this._docUploaded(doc,false);
		};
		
		var dispatcher = this._getDispatcher();
		if( dispatcher ) {
			this.dispatcherHandle = dispatcher.getHandle('n2.couchDispatchSupport');
			
			var f = function(m){
				_this._handleDispatch(m);
			};
			
			dispatcher.register(this.dispatcherHandle, 'documentCreated', f);
			dispatcher.register(this.dispatcherHandle, 'documentUpdated', f);
		};
	}

	,_handleDispatch: function(m){
		if( 'documentCreated' === m.type ) {
			var requestService = this._getRequestService();
			if( requestService ){
				requestService.requestDocument(m.docId, this.docCreatedCb);
			};
			
		} else if( 'documentUpdated' === m.type ) {
			var requestService = this._getRequestService();
			if( requestService ){
				requestService.requestDocument(m.docId, this.docUpdatedCb);
			};
		};
	}
	
	,_docUploaded: function(doc,created){
		if( doc.nunaliit_geom ){
			var type = created ? 'featureCreated' : 'featureUpdated';

			// This is a feature
			this._dispatch({
				type: type
				,docId: doc._id
				,doc: doc
			});
		};
	}

	,_getDispatcher: function(){
		var d = null;
		if( this.options.directory ){
			d = this.options.directory.dispatchService;
		};
		return d;
	}
	
	,_dispatch: function(m){
		var dispatcher = this._getDispatcher();
		if( dispatcher ) {
			dispatcher.send(this.dispatcherHandle, m);
		};
	}
	
	,_getRequestService: function(){
		var r = null;
		if( this.options.directory ){
			r = this.options.directory.requestService;
		};
		return r;
	}
});

$n2.couchDispatchSupport = {
	DispatchSupport: DispatchSupport
};

})(jQuery,nunaliit2);
