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

;(function($,$n2) {
"use strict";

var 
 _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); }
 ,DH = 'n2.utilities'
 ;

//--------------------------------------------------------------------------
var AssignLayerOnDocumentCreation = $n2.Class({
		
	layerId: null,

	dispatchService: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			layerId: null
			,dispatchService: null
		},opts_);
		
		var _this = this;
		
		this.layerId = opts.layerId;
		this.dispatchService = opts.dispatchService;
			
		// Register to events
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};

			this.dispatchService.register(DH,'preDocCreation',f);
		};
		
		$n2.log('AssignLayerOnDocumentCreation', this);
	},
	
	_handle: function(m, addr, dispatcher){
		if( 'preDocCreation' === m.type ){
			var createdDoc = m.doc;

			if( !createdDoc.nunaliit_layers ){
				createdDoc.nunaliit_layers = [];
			};
			
			if( this.layerId ){
				if( createdDoc.nunaliit_layers.indexOf(this.layerId) < 0 ){
					createdDoc.nunaliit_layers.push(this.layerId);
				};
			};
		};
	}
});

//--------------------------------------------------------------------------
var SelectDocumentOnModuleIntroduction = $n2.Class({
		
	docIds: null,

	dispatchService: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			docId: null
			,docIds: null
			,dispatchService: null
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.docIds = [];
		
		this.moduleStarted = false;
		
		if( typeof opts.docId === 'string' ){
			this.docIds.push(opts.docId);
		};
		if( $n2.isArray(opts.docIds) ){
			for(var i=0,e=opts.docIds.length; i<e; ++i){
				var docId = opts.docIds[i];
				if( typeof docId === 'string' ){
					this.docIds.push(docId);
				};
			};
		};
			
		// Register to events
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};

			this.dispatchService.register(DH,'modulePerformIntroduction',f);
		};
		
		$n2.log('SelectDocumentOnModuleIntroduction', this);
	},
	
	_handle: function(m, addr, dispatcher){
		if( 'modulePerformIntroduction' === m.type ){
			if( !m.performed ){
				if( this.docIds.length > 1 ){
					m.performed = true;
					this.dispatchService.send(DH,{
						type: 'selected'
						,docIds: this.docIds
					});
	
				} else if( this.docIds.length > 0 ){
					m.performed = true;
					this.dispatchService.send(DH,{
						type: 'selected'
						,docId: this.docIds[0]
					});
				};
			};
		};
	}
});

//--------------------------------------------------------------------------
var Service = $n2.Class({
	
	dispatchService: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		
		// Register to events
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			this.dispatchService.register(DH,'utilityCreate',f);
		};
	},
	
	_handle: function(m, addr, dispatcher){
		if( 'utilityCreate' === m.type ){
			if( ! m.utilityType ){
				$n2.log('utilityType must be provided when creating a utility');
				return;
			};
			
			if( 'assignLayerOnDocumentCreation' === m.utilityType ){
				var options = {};
				
				if( typeof m.utilityOptions === 'object' ){
					for(var key in m.utilityOptions){
						var value = m.utilityOptions[key];
						options[key] = value;
					};
				};
				
				if( m.config ){
					if( m.config.directory ){
						options.dispatchService = m.config.directory.dispatchService;
					};
				};
				
		        new AssignLayerOnDocumentCreation(options);
		        
		        m.created = true;

			} else if( 'selectDocumentOnModuleIntroduction' === m.utilityType ){
				var options = {};
				
				if( typeof m.utilityOptions === 'object' ){
					for(var key in m.utilityOptions){
						var value = m.utilityOptions[key];
						options[key] = value;
					};
				};
				
				if( m.config ){
					if( m.config.directory ){
						options.dispatchService = m.config.directory.dispatchService;
					};
				};
				
		        new SelectDocumentOnModuleIntroduction(options);
		        
		        m.created = true;

			} else {
				if( $n2.mapUtilities 
				 && typeof $n2.mapUtilities.HandleUtilityCreateRequests === 'function' ){
					$n2.mapUtilities.HandleUtilityCreateRequests(m, addr, dispatcher);
				};
		    };
		};
	}
});

//--------------------------------------------------------------------------
$n2.utilities = {
	Service: Service
	,AssignLayerOnDocumentCreation: AssignLayerOnDocumentCreation
	,SelectDocumentOnModuleIntroduction: SelectDocumentOnModuleIntroduction
};

})(jQuery,nunaliit2);
