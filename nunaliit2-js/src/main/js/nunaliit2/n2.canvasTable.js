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
 ,DH = 'n2.canvasTable'
 ,uniqueId = 0
 ;
 
var $d = undefined;


// --------------------------------------------------------------------------
/* 
 This canvas displays tabular data in an HTML table. The elements from the generators
 represent rows in a table. Each row has a number of cells, which are the values found
 under each heading.

 Elements are expected to have the following format:
{
	id: <string>  (Unique identifier for this element)
	cells: {
		"heading1": "value1"
		,"heading2": "value2"
	}
}

Here are attributes added by the canvas:
{
}

*/
var TableCanvas = $n2.Class({

	canvasId: null,
 	
	sourceModelId: null,

	elementGenerator: null,

	dispatchService: null,
	
	elementsById: null,
	
	sortedElements: null,
	
	headings: null,

	styleRules: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			canvasId: null
			,sourceModelId: null
			,elementGenerator: null
			,styleRules: null
			,dispatchService: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);
 		
		var _this = this;
		
		this.canvasId = opts.canvasId;
		this.sourceModelId = opts.sourceModelId;
		this.elementGenerator = opts.elementGenerator;
		this.dispatchService = opts.dispatchService;
		
		this.elementsById = {};
		this.sortedElements = [];
		this.headings = [];

		this.styleRules = $n2.styleRule.loadRulesFromObject(opts.styleRules);
 		
 		// Element generator
 		if( this.elementGenerator ){
			this.elementGenerator.setElementsChangedListener(function(added, updated, removed){
				_this._elementsChanged(added, updated, removed);
			});
			this.elementGenerator.setIntentChangedListener(function(updated){
				_this._intentChanged(updated);
			});
 		};
 		
 		// Register to events
 		if( this.dispatchService ){
 			var f = function(m){
 				_this._handleDispatch(m);
 			};
 			
 			this.dispatchService.register(DH,'modelGetInfo',f);
 			this.dispatchService.register(DH,'modelStateUpdated',f);
 		};
 		
 		this.createGraph();
 		
 		opts.onSuccess();

 		if( this.sourceModelId ){
 			if( this.dispatchService ){
 				var msg = {
 					type: 'modelGetState'
 					,modelId: this.sourceModelId
 					,state: null
 				};
 				this.dispatchService.synchronousCall(DH,msg);
 				if( msg.state ){
 					this._sourceModelUpdated(msg.state);
 				};
 			};
 		};

 		$n2.log('TableCanvas',this);
 	},
	
	_getElem: function(){
		var $elem = $('#'+this.canvasId);
		if( $elem.length < 1 ){
			return undefined;
		};
		return $elem;
	},
 	
 	createGraph: function() {
		var _this = this;
		
		var $elem = this._getElem();
		if( $elem ){
			$elem
				.empty()
				.addClass('n2TableCanvas')
				.click(function(e){
					_this._backgroundClicked();
				});

			$('<table>')
				.appendTo($elem);
		};
 	},

 	_elementsChanged: function(addedElements, updatedElements, removedElements){
 		var _this = this;
 		
 		var sortedElements = [];

 		// Remove elements that are no longer there
		for(var i=0,e=removedElements.length; i<e; ++i){
			var removed = removedElements[i];
			delete this.elementsById[removed.id];
		};
		
		// Add elements
		for(var i=0,e=addedElements.length; i<e; ++i){
			var added = addedElements[i];
			if( added.isHeader ){
				installHeader(added);
			} else {
				this.elementsById[ added.id ] = added;
				sortedElements.push(added);
			};
		};
		
		// Update elements
		for(var i=0,e=updatedElements.length; i<e; ++i){
			var updated = updatedElements[i];
			if( updated.isHeader ){
				installHeader(updated);
			} else {
				this.elementsById[ updated.id ] = updated;
				sortedElements.push(updated);
			};
		};
		
		this._sortElements(sortedElements);
		this.sortedElements = sortedElements;

		this._redraw();
		
		function installHeader(element){
			if( element.columns ){
				_this.headings = element.columns;
			};
		};
	},
	
	_redraw: function(){
		var _this = this;

		var $elem = this._getElem();
		var $table = $elem.find('table');
		
		$table.empty();
		
		var $tr = $('<tr>')
			.appendTo($table);
		this.headings.forEach(function(heading){
			var label = _loc( heading.label );
			if( !label ){
				label = heading.name;
			};
			$('<th>')
				.text(label)
				.appendTo($tr);
		});
		
		this.sortedElements.forEach(function(element){
			var $tr = $('<tr>')
				.attr('nunaliit-element',element.id)
				.appendTo($table);
			
			_this._adjustElementStyles($tr, element);

			_this.headings.forEach(function(heading){
				var name = heading.name;
				var value = element.cells ? element.cells[name] : undefined;
				var $td = $('<td>')
					.appendTo($tr);
				
				if( value ){
					var $a = $('<a>')
						.attr('href','#')
						.attr('nunaliit-element',element.id)
						.text(value)
						.appendTo($td)
						.click(function(){
							var $a = $(this);
							_this._selectedLink($a);
							return false;
						})
						.mouseover(function(){
							var $a = $(this);
							_this._mouseOver($a);
							return false;
						})
						.mouseout(function(){
							var $a = $(this);
							_this._mouseOut($a);
							return false;
						});
				};
			});
		});
	},
	
	_selectedLink: function($a){
		var elementId = $a.attr('nunaliit-element');
		var element = undefined;
		if( elementId ){
			element = this.elementsById[elementId];
		};
		if( element ){
 			this.elementGenerator.selectOn(element);
		};
	},
	
	_mouseOver: function($a){
		var elementId = $a.attr('nunaliit-element');
		var element = undefined;
		if( elementId ){
			element = this.elementsById[elementId];
		};
		if( element ){
 			this.elementGenerator.focusOn(element);
		};
	},
	
	_mouseOut: function($a){
		var elementId = $a.attr('nunaliit-element');
		var element = undefined;
		if( elementId ){
			element = this.elementsById[elementId];
		};
		if( element ){
 			this.elementGenerator.focusOff(element);
		};
	},

	_intentChanged: function(changedElements){
		var _this = this;

		var changedElementsById = {};
		changedElements.forEach(function(element){
			changedElementsById[element.id] = element;
		});

		var $elem = this._getElem();
		$elem.find('tr').each(function(){
			var $tr = $(this);
			var elementId = $tr.attr('nunaliit-element');
			
			var element = undefined;
			if( elementId ){
				element = changedElementsById[elementId];
			};
			
			if( element ){
				_this._adjustElementStyles($tr, element);
			};
		});
	},
 	
 	_sourceModelUpdated: function(state){
 		this.elementGenerator.sourceModelUpdated(state);
 	},

 	_handleDispatch: function(m){
 		if( 'modelGetInfo' === m.type ){
 			if( m.modelId === this.modelId ){
 				m.modelInfo = this._getModelInfo();
 			};
 			
 		} else if( 'modelStateUpdated' === m.type ) {
 			if( this.sourceModelId === m.modelId ){
 				if( m.state ){
 					this._sourceModelUpdated(m.state);
 				};
 			};
 		};
 	},

 	_adjustElementStyles: function($elem, element){
		element.n2_elem = $elem[0];
		var symbolizer = this.styleRules.getSymbolizer(element);
		symbolizer.adjustHtmlElement($elem[0],element);
		delete element.n2_elem;
 	},
 	
 	_sortElements: function(elements){
 		var _this = this;

 		elements.sort(function(a,b){
 			for(var i=0,e=_this.headings.length; i<e; ++i){
 				var heading = _this.headings[i];
 				var name = heading.name;
 				var aValue = a.cells ? a.cells[name] : undefined;
 				var bValue = b.cells ? b.cells[name] : undefined;
 				
 				if( aValue < bValue ) {
 					return -1;
 				} else if( aValue > bValue ) {
 					return 1;
 				};
 			};
 			
 			return 0;
 		});
 	}
});

//--------------------------------------------------------------------------
// Define default element generator for table canvas
var ElementGenerator = $n2.canvasElementGenerator.ElementGenerator;

var DefaultTableElementGenerator = $n2.Class('DefaultTableElementGenerator', ElementGenerator, {
	initialize: function(opts_){
		ElementGenerator.prototype.initialize.call(this, opts_);
	},

	_createFragmentsFromDoc: function(doc){
		return [
			{
				id: doc._id
				,n2_id: doc._id
				,n2_doc: doc
			}
		];
	},

	_updateElements: function(fragmentMap, currentElementMap){
		var elementsById = {};
		
		var header = {
			id: '__HEADER__'
			,isHeader: true
			,columns: [
			   {
				   name: 'id'
				   ,label: 'id'
			   }
			   ,{
				   name: 'rev'
				   ,label: 'rev'
			   }
			]
		};
		elementsById[header.id] = header;
		
		for(var fragId in fragmentMap){
			var frag = fragmentMap[fragId];
			
			var elementId = fragId;
			var element = currentElementMap[elementId];
			if( !element ){
				element = {
					id: elementId
				};
			};
			element.fragments = {};
			element.fragments[fragId] = frag;
			elementsById[elementId] = element;
			
			var doc = frag.n2_doc;
			element.cells = {
				id: doc._id
				,rev: doc._rev
			};
			element.n2_id = doc._id;
		};
		
		return elementsById;
	}
});

function DefaultTableElementGeneratorFactory(opts_){
	var opts = $n2.extend({
		type: null
		,options: null
		,config: null
	},opts_);
	
	var options = {};
	if( opts.options ){
		for(var key in opts.options){
			var value = opts.options[key];
			options[key] = value;
		};
	};
	
	if( opts.config 
	 && opts.config.directory ){
		options.dispatchService = opts.config.directory.dispatchService;
	};
	
	return new DefaultTableElementGenerator(options);
};

$n2.canvasElementGenerator.AddElementGeneratorFactory({
	type: 'tableDefault'
	,factoryFn: DefaultTableElementGeneratorFactory
});

//--------------------------------------------------------------------------
function HandleCanvasAvailableRequest(m){

	if( m.canvasType === 'table' ){
		m.isAvailable = true;
	};
};

//--------------------------------------------------------------------------
function HandleCanvasDisplayRequest(m){
	if( m.canvasType === 'table' ){
		
		var options = {
			elementGeneratorType: 'tableDefault'
		};
		if( m.canvasOptions ){
			for(var key in m.canvasOptions){
				options[key] = m.canvasOptions[key];
			};
		};
		
 		if( !options.elementGenerator ){
 			// If not defined, use the one specified by type
 			options.elementGenerator = $n2.canvasElementGenerator.CreateElementGenerator({
 	 			type: options.elementGeneratorType
 	 			,options: options.elementGeneratorOptions
 	 			,config: m.config
 	 		});
 		};
		
		options.canvasId = m.canvasId;
		options.interactionId = m.interactionId;
		options.moduleDisplay = m.moduleDisplay;
		options.onSuccess = m.onSuccess;
		options.onError = m.onError;

		if( m.config ){
			if( m.config.directory ){
				options.dispatchService = m.config.directory.dispatchService;
			};
		};
		
		new TableCanvas(options);
	};
};

//--------------------------------------------------------------------------
$n2.canvasTable = {
	TableCanvas: TableCanvas
	,HandleCanvasAvailableRequest: HandleCanvasAvailableRequest
	,HandleCanvasDisplayRequest: HandleCanvasDisplayRequest
};

})(jQuery,nunaliit2);
