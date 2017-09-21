/*
Copyright (c) 2017, Geomatics and Cartographic Research Centre, Carleton 
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
 ,DH = 'n2.widgetDuplicate'
 ;

//--------------------------------------------------------------------------
var DuplicateWidget = $n2.Class('DuplicateWidget', {
	
	dispatchService: null,
	
	label: null,
	
	elemId: null,

	selectedDocId: null,

	docForDuplicate: null,
	
	showAsLink: false,

	duplicateAllDocs: false,
	
	duplicateOnSchemas: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			containerId: null
			,dispatchService: null
			,label: _loc('Duplicate')
			,showAsLink: false
			,duplicateAllDocs: undefined
			,duplicateOnSchemas: undefined
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.label = opts.label;
		this.showAsLink = opts.showAsLink;
		
		this.selectedDocId = null;
		this.docForDuplicate = null;

		this.duplicateAllDocs = undefined;
		if( opts.duplicateAllDocs ){
			var selectors = this._parseSelectors(opts.duplicateAllDocs, 'duplicateAllDocs');
			this.duplicateAllDocs = selectors;
		};

		this.duplicateOnSchemas = {};
		if( opts.duplicateOnSchemas ){
			for(var schemaName in opts.duplicateOnSchemas){
				var v = opts.duplicateOnSchemas[schemaName];
				var selectors = this._parseSelectors(v, 'duplicateOnSchemas['+schemaName+']');
				this.duplicateOnSchemas[schemaName] = selectors;
			};
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
			.addClass('n2widget_duplicate')
			.appendTo($container);
		
		// Set up model listener
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			this.dispatchService.register(DH,'selected',f);
			this.dispatchService.register(DH,'unselected',f);
			this.dispatchService.register(DH,'documentContent',f);
		};
		
		this._redraw();
		
		$n2.log(this._classname, this);
	},
	
	_getElem: function(){
		return $('#'+this.elemId);
	},
	
	_parseSelectors: function(v, position){
		if( 'ALL_ATTRIBUTES' === v ){
			return true;
			
		} else if( typeof v === 'boolean' && !v ) {
			return false;

		} else if( $n2.isArray(v) ){
			var selectors = [];
			v.forEach(function(sel){
				if( typeof sel === 'string' ){
					try {
						var objSel = $n2.objectSelector.parseSelector(sel);
						selectors.push(objSel);
					} catch(e) {
						$n2.logError(this._classname+': Error while parsing object selector for '+position+': '+sel, e);
					};
				} else {
					$n2.logError(this._classname+': Unknown copy scheme for schema '+position+': '+sel, e);
				};
			});
			
			return selectors;
			
		} else {
			$n2.logError(this._classname+': Unrecognized selectors for '+position);
		};
	},

	_handle: function(m, addr, dispatcher){
		if( 'selected' === m.type ){
			this.selectedDocId = null;
			this.docForDuplicate = null;
			if( m.doc ){
				this.selectedDocId = m.doc._id;
				if( this._isDocumentEligibleForDuplicate(m.doc) ){
					this.docForDuplicate = m.doc;
				};

			} else if( m.docId ){
				this.selectedDocId = m.docId;
				var m = {
					type: 'requestDocument'
					,docId: m.docId
				};
				dispatcher.send(DH,m);
			};
			
			this._redraw();

		} else if( 'unselected' === m.type ){
			this.selectedDocId = null;
			this.docForDuplicate = null;
			this._redraw();

		} else if( 'documentContent' === m.type ) {
			var doc = m.doc;
			if( doc 
			 && this.selectedDocId === doc._id 
			 && !this.docForDuplicate 
			 && this._isDocumentEligibleForDuplicate(doc) ){
				this.docForDuplicate = doc;
				this._redraw();
			};
		};
	},
	
	_isDocumentEligibleForDuplicate: function(doc){
		if( !doc ){
			return false;
		};

		if( this.duplicateAllDocs ){
			return true;
		};
		
		var schemaName = doc.nunaliit_schema;
		if( this.duplicateOnSchemas[schemaName] ){
			return true;
		};
		
		return false;
	},
	
	_redraw: function(){
		var _this = this;

		var $elem = this._getElem();
		$elem.empty();
		if( this.docForDuplicate ){
			if( this.showAsLink ) {
				$elem.addClass('n2widget_duplicate_asLink');
				$('<a>')
					.attr('href', _loc('Duplicate'))
					.text( this.label )
					.appendTo( $elem )
					.click(function(){
						try {
							_this._performDuplicate();
						} catch(e) {
							$n2.log('Error during duplicate: '+e);
						};
						return false;
					});
			} else {
				$elem.removeClass('n2widget_duplicate_asLink');
				$('<button>')
					.text( _loc('Duplicate') )
					.appendTo($elem)
					.click(function(){
						_this._performDuplicate();
						return false;
					});
			};
		};
	},
	
	_performDuplicate: function(){
		var _this = this;

		if( this.docForDuplicate ){
			var doc = {
				nunaliit_schema: this.docForDuplicate.nunaliit_schema
			};
			
			var schemaName = doc.nunaliit_schema;
			if( this.duplicateOnSchemas[schemaName] ){
				this._copyOnSelectors(doc, this.docForDuplicate, this.duplicateOnSchemas[schemaName]);
			} else if( this.duplicateAllDocs ) {
				this._copyOnSelectors(doc, this.docForDuplicate, this.duplicateAllDocs);
			};
			
			this.dispatchService.send(DH, {
				type: 'editInitiate'
				,doc: doc
			});
		} else {
			$n2.logError('DuplicateWidget: no document selected for duplicate');
		};
	},
	
	_copyOnSelectors: function(targetDoc, sourceDoc, selectors){
		if( 'ALL_ATTRIBUTES' === selectors ){
			for(var key in sourceDoc){
				if( typeof key === 'string' 
				 && key.length > 0 
				 && key[0] === '_' ){
					// Do not duplicate keys reserved by CouchDB
				} else if( 'nunaliit_import' === key
				 || 'nunaliit_attachments' === key
				 || 'nunaliit_created' === key
				 || 'nunaliit_last_updated' === key
				 || 'nunaliit_geom' === key ) {
					// Do not duplicate keys reserved by Nunaliit
				} else {
					var v = sourceDoc[key];
					targetDoc[key] = $n2.deepCopy(v);
				};
 			};
			
		} else if( $n2.isArray(selectors) ){
			selectors.forEach(function(objSel){
				var v = objSel.getValue(sourceDoc);
				if( undefined === v ){
					objSel.removeValue(targetDoc);
				} else {
					var value = $n2.deepCopy(v);
					objSel.setValue(targetDoc, value, true);
				};
			});

		} else {
			throw new Error(this._classname+' Unknown copy selector',selectors);
		};
	}
});

//--------------------------------------------------------------------------
function HandleWidgetAvailableRequests(m){
	if( m.widgetType === 'duplicateWidget' ){
		if( $.fn.slider ) {
			m.isAvailable = true;
		};
    };
};

//--------------------------------------------------------------------------
function HandleWidgetDisplayRequests(m){
	if( m.widgetType === 'duplicateWidget' ){
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
		};
		
		new DuplicateWidget(options);
    };
};

//--------------------------------------------------------------------------
$n2.widgetDuplicate = {
	DuplicateWidget: DuplicateWidget
	,HandleWidgetAvailableRequests: HandleWidgetAvailableRequests
	,HandleWidgetDisplayRequests: HandleWidgetDisplayRequests
};

})(jQuery,nunaliit2);
