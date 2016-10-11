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

//--------------------------------------------------------------------------
// Helper functions for elements accepted by the table canvas
function Cell(cell){
	cell.getValue = Cell.getValue;
	cell.getSortValue = Cell.getSortValue;
	cell.getExportValue = Cell.getExportValue;
};
Cell.getValue = function(element){
	if( typeof this.value === 'function' ){
		return this.value(this, element);
	}
	return this.value;
};
Cell.getSortValue = function(element){
	var sortValue = this.sortValue;
	if( typeof sortValue === 'undefined' ){
		sortValue = this.getValue(element);
	};
	return sortValue;
};
Cell.getExportValue = function(element){
	var exportValue = undefined;
	if( typeof this.exportValue === 'function' ){
		exportValue = this.exportValue(this, element);
	} else if(  typeof this.exportValue !== 'undefined'  ){
		exportValue = this.exportValue;
	} else {
		exportValue = this.getValue(element);
	};
	return exportValue;
};

function Element(element){
	element.getCell = Element.getCell;
	element.getValue = Element.getValue;
	element.getSortValue = Element.getSortValue;
	element.getExportValue = Element.getExportValue;
	
	if( element.cells ){
		for(var name in element.cells){
			var cell = element.cells[name];
			Cell(cell);
		};
	};
};
Element.getCell = function(name){
	var cell = this.cells ? this.cells[name] : undefined;
	return cell;
};
Element.getValue = function(name){
	var cell = this.getCell(name);
	var value = cell ? cell.getValue(this) : undefined;
	return value;
};
Element.getSortValue = function(name){
	var cell = this.getCell(name);
	var sortValue = cell ? cell.getSortValue(this) : undefined;
	return sortValue;
};
Element.getExportValue = function(name){
	var cell = this.getCell(name);
	var exportValue = cell ? cell.getExportValue(this) : undefined;
	return exportValue;
};

// --------------------------------------------------------------------------
/* 
 This canvas displays tabular data in an HTML table. The elements from the generators
 represent rows in a table. Each row has a number of cells, which are the values found
 under each heading.

 Elements are expected to have the following format:
{
	id: <string>  (Unique identifier for this element)
	cells: {
		"heading1": {
			value: "value1"
			,sortValue: "value1"
			,exportValue: "value1"
			,type: "string"
		}
		,"heading2": {
			value: "123456789"
			,display: function($td, cell, element){ ... }
			,sortValue: "ABC"
			,exportValue: "ABC"
			,type: "reference"
		}
	}
}

The attribute for each cell is described here:
- value: Required. This is the value of the cell. It can be a string, a number, a boolean, etc.
         If it is a function, it will be called with the following signature: function(cell, element)
- sortValue: Optional. Value to be used when sorting the column based on this value. If not specified,
             the value is used.
- exportValue: Optional. Value to be used when table is exported. If not specified, the value is
               used. If this is a function, the following signature is used: function(cell, element)
- type: Optional. Type of the value. If not specified, it assumed to be 'string'. Supported types
        are 'string' and 'reference'.
- display: Optional. Function to be used when displaying this value to the user. This replaces the
           default behaviour and allows the element generator to supply any display function.
           When used, the following signature is used: function($td, cell, element) 


One element can be provided to specify the columns and the order in which they should be
displayed. This element has the following format:

{
	isHeader: true,
	columns: [
		{
			name: 'heading1'
			,label: 'First'
		}
		,{
			name: 'heading2'
			,label: {
				nunaliit_type: 'localized'
				,en: 'Second'
			}
		}
	]
}


*/
var TableCanvas = $n2.Class({

	canvasId: null,
 	
	sourceModelId: null,

	elementGenerator: null,

	dispatchService: null,

	showService: null,
	
	elementsById: null,
	
	sortedElements: null,
	
	headings: null,
	
	sortOrder: null,

	styleRules: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			canvasId: null
			,sourceModelId: null
			,elementGenerator: null
			,styleRules: null
			,dispatchService: null
			,showService: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);
 		
		var _this = this;
		
		this.canvasId = opts.canvasId;
		this.sourceModelId = opts.sourceModelId;
		this.elementGenerator = opts.elementGenerator;
		this.dispatchService = opts.dispatchService;
		this.showService = opts.showService;
		
		this.elementsById = {};
		this.sortedElements = [];
		this.headings = [];
		this.sortOrder = [];

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

			$('<button>')
				.text('Export CSV')
				.appendTo($elem)
				.click(function(){
					_this._exportCsv();
					return false;
				});
		

			$('<table>')
				.appendTo($elem);
		};
 	},
 		
	_backgroundClicked: function(){
		if( this.dispatchService ){
			this.dispatchService.send(DH,{
				type: 'userUnselect'
			});
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
				Element(added);
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
				Element(updated);
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
			var $th = $('<th>')
				.appendTo($tr);
			$('<a>')
				.attr('href','#')
				.attr('data-sort-name',heading.name)
				.text(label)
				.appendTo($th)
				.click(function(){
					var $a = $(this);
					var headingName = $a.attr('data-sort-name');
					_this._sortOnName(headingName);
					return false;
				});
		});
		
		this.sortedElements.forEach(function(element){
			var $tr = $('<tr>')
				.attr('nunaliit-element',element.id)
				.appendTo($table);

			if( !element.elemId ){
				element.elemId = $n2.getUniqueId();
			};
			$tr.attr('id',element.elemId);
			
			_this._adjustElementStyles($tr, element);

			_this.headings.forEach(function(heading){
				var name = heading.name;
				var $td = $('<td>')
					.appendTo($tr);
				var cell = element.getCell(name);
				
				if( typeof cell.display === 'function' ){
					cell.display($td, cell, element);

				} else if( typeof cell.display === 'string' ){
					var $a = $('<a>')
						.attr('href','#'+element.id)
						.attr('nunaliit-element',element.id)
						.text(cell.display)
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
					
				} else {
					var value = element.getValue(name);

					if( typeof value !== 'undefined' ){
						if( 'reference' === cell.type ){
							if( typeof value === 'string' ){
								$('<a>')
									.addClass('n2s_referenceLink')
									.attr('nunaliit-document',value)
									.text(value)
									.appendTo($td);
							};
							
						} else {
							$('<a>')
								.attr('href','#'+element.id)
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
					};
				};
			});
		});

		this.showService.fixElementAndChildren($table);
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
	
	_sortOnName: function(name){
		// Special case: first time clicking on first column
		// Assume that first column was already clicked
		if( this.sortOrder.length < 1 
		 && this.headings.length > 0
		 && this.headings[0].name === name ){
			this.sortOrder.unshift({
				name: name
				,direction: 1
			});
		};
		
		// Detect if already in array
		var index = -1;
		this.sortOrder.forEach(function(sortEntry, i){
			if( sortEntry.name === name ){
				index = i;
			};
		});
		
		var insert = true;
		if( index == 0 ){
			// Selecting same twice. Reverse direction
			this.sortOrder[0].direction = this.sortOrder[0].direction * -1;
			insert = false;

		} else if( index >= 0  ){
			// remove it
			this.sortOrder.splice(index,1);
		};

		// Insert at the beginning
		if( insert ){
			this.sortOrder.unshift({
				name: name
				,direction: 1
			});
		};
		
		this._sortElements(this.sortedElements);
		
		this._reorderDisplayedRows();
	},
	
	_reorderDisplayedRows: function(){
		this.sortedElements.forEach(function(row){
			var rowId = row.elemId;
			if( rowId ){
				var $row = $('#'+rowId);
				if( $row.length > 0 ){
					var $parent = $row.parent();
					$row.appendTo($parent);
				};
			};
		});
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
 		
 		// Figure out the order in which things should be sorted
 		var orderedNames = [];
 		var seenNameMap = {};
 		this.sortOrder.forEach(function(sortEntry){
 			var name = sortEntry.name;

 			if( !seenNameMap[name] ){
 	 			orderedNames.push(sortEntry);
 	 			seenNameMap[name] = true;
 			};
 		});
 		this.headings.forEach(function(heading){
 			var name = heading.name;
 			if( !seenNameMap[name] ){
 	 			orderedNames.push({
 	 				name: name
 	 				,direction: 1
 	 			});
 	 			seenNameMap[name] = true;
 			};
 		});

 		elements.sort(function(a,b){
 			for(var i=0,e=orderedNames.length; i<e; ++i){
 				var name = orderedNames[i].name;
 				var direction = orderedNames[i].direction;

 				var aValue = a.getSortValue(name);
 				var bValue = b.getSortValue(name);
 				
 				if( aValue < bValue ) {
 					return -1 * direction;
 				} else if( aValue > bValue ) {
 					return 1 * direction;
 				};
 			};
 			
 			return 0;
 		});
 	},

 	_computeCsvContent: function(){
 		var _this = this;
 		var table = [];
		
		// Headings
		var headLine = [];
		table.push(headLine);
		this.headings.forEach(function(heading){
			headLine.push(heading.name);
		});
		
		// Data
		if( this.sortedElements ){
			this.sortedElements.forEach(function(element){
				var line = [];
				table.push(line);
				_this.headings.forEach(function(heading){
					var name = heading.name;
					
					var value = element.getExportValue(name);

					line.push(value);
				});
			});
		};
		
		var csvContent = $n2.csv.ValueTableToCsvString(table);
		
		return csvContent;
	},

 	_exportCsv: function(){
		var csvContent = this._computeCsvContent();
		
		if( typeof Blob !== 'undefined' 
		 && typeof saveAs === 'function' ){
			var blob = new Blob([csvContent],{type: "text/plain;charset=" + document.characterSet});
			saveAs(blob, 'table.csv');
			
		} else {
			var $dialog = $('<div>')
				.addClass('n2canvasReferenceBrowser_exportCsv_dialog');
			var diagId = $n2.utils.getElementIdentifier($dialog);
			
			$('<textarea>')
				.addClass('n2canvasTable_exportCsv_text')
				.text(csvContent)
				.appendTo($dialog);
			
			$dialog.dialog({
				autoOpen: true
				,title: _loc('CSV')
				,modal: true
				,width: 370
				,close: function(event, ui){
					var diag = $('#'+diagId);
					diag.dialog('destroy');
					diag.remove();
				}
			});
		};
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
				id: {
					value: doc._id
				}
				,rev: {
					value: doc._rev
				}
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
				options.showService = m.config.directory.showService;
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
