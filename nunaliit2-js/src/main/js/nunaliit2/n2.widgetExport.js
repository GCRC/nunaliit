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
 ,DH = 'n2.widgetExport'
 ;

//--------------------------------------------------------------------------
var ExportWidget = $n2.Class({
	
	dispatchService: null,
	
	exportService: null,
	
	sourceModelId: null,
	
	label: null,
	
	elemId: null,

	modelDocsById: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			containerId: null
			,dispatchService: null
			,exportService: null
			,sourceModelId: null
			,label: _loc('Export')
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.exportService = opts.exportService;
		this.sourceModelId = opts.sourceModelId;
		this.label = opts.label;
		
		this.modelDocsById = {};

		if( !this.exportService ){
			throw new Error('ExportWidget requires export service');
		};
		
		// Get container
		var containerId = opts.containerId;
		if( !containerId ){
			throw new Error('containerId must be specified');
		};
		var $container = $('#'+containerId);
		
		this.elemId = $n2.getUniqueId();
		
		$('<div>')
			.attr('id',this.elemId)
			.addClass('n2widget_export')
			.appendTo($container);
		
		// Set up model listener
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			this.dispatchService.register(DH, 'modelStateUpdated', f);

			// Initialize state
			var m = {
				type:'modelGetState'
				,modelId: this.sourceModelId
			};
			this.dispatchService.synchronousCall(DH, m);
			if( m.state ){
				this._sourceModelUpdated(m.state);
			};
		};
		
		$n2.log('ExportWidget', this);
	},
	
	_getElem: function(){
		return $('#'+this.elemId);
	},

	_sourceModelUpdated: function(sourceState){
		var _this = this;
		
		// Loop through all added documents
		if( sourceState.added ){
			for(var i=0,e=sourceState.added.length; i<e; ++i){
				var doc = sourceState.added[i];
				this.modelDocsById[doc._id] = doc;
			};
		};
		
		// Loop through all updated documents
		if( sourceState.updated ){
			for(var i=0,e=sourceState.updated.length; i<e; ++i){
				var doc = sourceState.updated[i];
				this.modelDocsById[doc._id] = doc;
			};
		};
		
		// Loop through all removed documents
		if( sourceState.removed ){
			for(var i=0,e=sourceState.removed.length; i<e; ++i){
				var doc = sourceState.removed[i];
				delete this.modelDocsById[doc._id];
			};
		};

		// Redraw
		var $elem = this._getElem();
		$elem.empty();
		if( this._atLeastOneDocumentAvailable() ){
			$('<a>')
				.attr('href','Export Documents')
				.text( this.label )
				.appendTo( $elem )
				.click(function(){
					_this._performExport();
					return false;
				});
		};
	},
	
	_atLeastOneDocumentAvailable: function(){
		for(var docId in this.modelDocsById){
			return true;
		};
		return false;
	},
	
	_performExport: function(){
		var docIds = [];
		for(var docId in this.modelDocsById){
			var doc = this.modelDocsById[docId];
			docIds.push( doc._id );
		};
		
		this.exportService.createExportApplication({
			docIds: docIds
			,logger: new $n2.logger.CustomLogger({
				logFn: function(){}
				,reportErrorFn: function(err){
					$n2.log('Export error: '+err);
				}
			})
		});
	},

	_handle: function(m, addr, dispatcher){
		if( 'modelStateUpdated' === m.type ){
			// Does it come from our source?
			if( this.sourceModelId === m.modelId ){
				this._sourceModelUpdated(m.state);
			};
		};
	}
});

//--------------------------------------------------------------------------
function HandleWidgetAvailableRequests(m){
	if( m.widgetType === 'exportWidget' ){
		if( $.fn.slider ) {
			m.isAvailable = true;
		};
    };
};

//--------------------------------------------------------------------------
function HandleWidgetDisplayRequests(m){
	if( m.widgetType === 'exportWidget' ){
		var widgetOptions = m.widgetOptions;
		var containerId = m.containerId;
		var config = m.config;
		
		var options = {};
		
		if( widgetOptions ){
			for(var key in widgetOptions){
				var value = widgetOptions[key];
				options[key] = value;
			};
		};

		options.containerId = containerId;
		
		if( config && config.directory ){
			options.dispatchService = config.directory.dispatchService;
			options.exportService = config.directory.exportService;
		};
		
		new ExportWidget(options);
    };
};

//--------------------------------------------------------------------------
$n2.widgetExport = {
	ExportWidget: ExportWidget
	,HandleWidgetAvailableRequests: HandleWidgetAvailableRequests
	,HandleWidgetDisplayRequests: HandleWidgetDisplayRequests
};

})(jQuery,nunaliit2);
