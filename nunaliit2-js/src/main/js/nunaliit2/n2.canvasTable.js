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
// ROW ELEMENTS
// Helper functions for elements accepted by the table canvas. These functions
// are used to support element generators that provides elements that are complete
// rows.
//
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

function RowElement(element){
	element.getCell = RowElement.getCell;
	element.getValue = RowElement.getValue;
	element.getSortValue = RowElement.getSortValue;
	element.getExportValue = RowElement.getExportValue;
	element.getRowName = RowElement.getRowName;
	element.isRowElement = true;
	
	if( element.cells ){
		for(var name in element.cells){
			var cell = element.cells[name];
			Cell(cell);
			
			// If a cell is not assigned any fragment, then inherit
			// those from the row
			if( !cell.fragments ){
				cell.fragments = element.fragments;
			};
		};
	};
};
RowElement.getCell = function(name){
	var cell = this.cells ? this.cells[name] : undefined;
	return cell;
};
RowElement.getValue = function(name){
	var cell = this.getCell(name);
	var value = cell ? cell.getValue(this) : undefined;
	return value;
};
RowElement.getSortValue = function(name){
	var cell = this.getCell(name);
	var sortValue = cell ? cell.getSortValue(this) : undefined;
	return sortValue;
};
RowElement.getExportValue = function(name){
	var cell = this.getCell(name);
	var exportValue = cell ? cell.getExportValue(this) : undefined;
	return exportValue;
};
RowElement.getRowName = function(){
	// The name of a row in a row element is its id
	return this.id;
};

//--------------------------------------------------------------------------
// CELL ELEMENTS
// Helper functions for elements accepted by the table canvas. These functions
// are used to support element generators that provides elements that are cells.
//
function CellElement(cell){
	cell.getValue = CellElement.getValue;
	cell.getSortValue = CellElement.getSortValue;
	cell.getExportValue = CellElement.getExportValue;

	cell.isCellElement = true;
};
CellElement.getValue = function(row){
	if( typeof this.value === 'function' ){
		return this.value(this, row);
	}
	return this.value;
};
CellElement.getSortValue = function(row){
	var sortValue = this.sortValue;
	if( typeof sortValue === 'undefined' ){
		sortValue = this.getValue(row);
	};
	return sortValue;
};
CellElement.getExportValue = function(row){
	var exportValue = undefined;
	if( typeof this.exportValue === 'function' ){
		exportValue = this.exportValue(this, row);
	} else if(  typeof this.exportValue !== 'undefined'  ){
		exportValue = this.exportValue;
	} else {
		exportValue = this.getValue(row);
	};
	return exportValue;
};

function CompositeRow(row){
	row.addCell = CompositeRow.addCell;
	row.getCell = CompositeRow.getCell;
	row.getValue = CompositeRow.getValue;
	row.getSortValue = CompositeRow.getSortValue;
	row.getExportValue = CompositeRow.getExportValue;
	row.getRowName = CompositeRow.getRowName;
	
	if( !row.cells ){
		row.cells = {};
	};
};
CompositeRow.addCell = function(cell){
	var columnName = cell.column;
	this.cells[columnName] = cell;
};
CompositeRow.getCell = function(name){
	var cell = this.cells ? this.cells[name] : undefined;
	return cell;
};
CompositeRow.getValue = function(name){
	var cell = this.getCell(name);
	var value = cell ? cell.getValue(this) : undefined;
	return value;
};
CompositeRow.getSortValue = function(name){
	var cell = this.getCell(name);
	var sortValue = cell ? cell.getSortValue(this) : undefined;
	return sortValue;
};
CompositeRow.getExportValue = function(name){
	var cell = this.getCell(name);
	var exportValue = cell ? cell.getExportValue(this) : undefined;
	return exportValue;
};
CompositeRow.getRowName = function(){
	return this.rowName;
};

// --------------------------------------------------------------------------
/* 
 This canvas displays tabular data in an HTML table. The elements from the generators
 can take two formats: rows or cells.
 
 In the case of row elements, each element represents a row in a table. Each row has a 
 number of cells, which are the values found under each heading.

 Row elements are expected to have the following format:
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

 In the case of cell elements, each element is associated with a single cell. Cell element
 are expected to have the following format:
{
	id: <string>  (Unique identifier for this element)
	,row: <string> (Identifier of the row)
	,column: <string> (Identifier of the colmun)
	,value: "value1"
	,display: function($td, cell, element){ ... }
	,sortValue: "value1"
	,exportValue: "value1"
	,type: "string"  ("string" or "reference")
}

The attribute for each cell is described here:
- value: Required. This is the value of the cell. It can be a string, a number, a boolean, etc.
         If it is a function, it will be called with the following signature: function(cell, row)
         Note that depending on the type of elements provided by the element generator, it is possible
         that the element is the cell or the row.
         
- sortValue: Optional. Value to be used when sorting the column based on this value. If not specified,
             the value is used.

- exportValue: Optional. Value to be used when table is exported. If not specified, the value is
               used. If this is a function, the following signature is used: function(cell, row).
               Note that depending on the type of elements provided by the element generator, it is 
               possible that the element is the cell or the row.
               
- type: Optional. Type of the value. If not specified, it assumed to be 'string'. Supported types
        are 'string' and 'reference'.

- display: Optional. Function to be used when displaying this value to the user. This replaces the
           default behaviour and allows the element generator to supply any display function.
           When used, the following signature is used: function($td, cell, row) 


One element can be provided to specify the columns and the order in which they should be
displayed. This element has the following format:

{
	isHeader: true,
	columns: [
		{
			name: 'heading1'
			,label: 'First'
			,title: 'Explanation of First'
		}
		,{
			name: 'heading2'
			,label: {
				nunaliit_type: 'localized'
				,en: 'Second'
			}
			,title: {
				nunaliit_type: 'localized'
				,en: 'Explanation of Second'
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
	
	rowsByName: null,
	
	sortedRows: null,
	
	headings: null,
	
	sortOrder: null,

	styleRules: null,
	
	useLazyDisplay: null,

	showRowCount: null,

	refreshIntervalInMs: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			canvasId: null
			,sourceModelId: null
			,elementGenerator: null
			,useLazyDisplay: false
			,showRowCount: false
			,refreshIntervalInMs: 200
			,styleRules: null
			,dispatchService: null
			,showService: null
			,sortOrder: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);
 		
		var _this = this;
		
		this.canvasId = opts.canvasId;
		this.sourceModelId = opts.sourceModelId;
		this.elementGenerator = opts.elementGenerator;
		this.useLazyDisplay = opts.useLazyDisplay;
		this.showRowCount = opts.showRowCount;
		this.refreshIntervalInMs = opts.refreshIntervalInMs;
		this.dispatchService = opts.dispatchService;
		this.showService = opts.showService;
		this.sortOrder = [];
		if( typeof opts.sortOrder === 'string' ){
			// Only one column, assume ascending
			this.sortOrder.push({
				name: opts.sortOrder
				,direction: 1
			});
		} else if( $n2.isArray(opts.sortOrder) ) {
			for(var i=0,e=opts.sortOrder.length; i<e; ++i){
				var s = opts.sortOrder[i];
				if( typeof s === 'string' ){
					// Column name, assume ascending
					this.sortOrder.push({name: s, direction: 1});
				} else if( typeof s === 'object' 
				 && typeof s.name === 'string' ){
					if( typeof s.direction !== 'number' ){
						// If not specified, assume ascending
						s.direction = 1;
					};
					this.sortOrder.push(s);
				};
			};
		} else if( opts.sortOrder 
		 && typeof opts.sortOrder === 'object' 
		 && typeof opts.sortOrder.name === 'string' ){
			if( typeof opts.sortOrder.direction !== 'number' ){
				// If not specified, assume ascending
				opts.sortOrder.direction = 1;
			};
			this.sortOrder.push(opts.sortOrder);
		};
		
		this.elementsById = {};
		this.rowsByName = {};
		this.sortedRows = [];
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
	
	_getTableRowCount: function(){
		var nunaliitRows = $('tbody tr[nunaliit-row]');

		return nunaliitRows.length;
	},

	_displayRowCounter: function(){
		var numRows = this._getTableRowCount();
		var $tableCanvas = $('.n2TableCanvas');
		if ($tableCanvas.length) {
			if (!$('.n2TableCanvasRowCounter').length) {
				$('<div>')
					.addClass('n2TableCanvasRowCounter')
					.prependTo($tableCanvas);
			}

			// Add/Update number of rows text
			$('.n2TableCanvasRowCounter')
				.text(_loc('Rows') + ': ' + numRows);
		}
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
				.text(_loc('Export CSV'))
				.appendTo($elem)
				.click(function(){
					_this._exportCsv();
					return false;
				});
		

			var $table = $('<table>')
				.appendTo($elem);
			
			$('<tbody>')
				.appendTo($table)
				.scroll(function(){
					_this._scrollChanged( $(this) );
					return true;
				});
		};
 	},
 		
	_backgroundClicked: function(){
		if( this.dispatchService ){
			this.dispatchService.send(DH,{
				type: 'userUnselect'
			});
		};
	},

	_scrollChanged: function( $table ){
		if( this.useLazyDisplay ){
			var _this = this;
			
			var scrollTop = $table.scrollTop();

			// Wait a bit before refreshing
			this.lastScrollTop = scrollTop;
			window.setTimeout(function(){
				if( _this.lastScrollTop === scrollTop  ){
					_this._refreshRows();
				};
			},this.refreshIntervalInMs);
		};
	},

 	_elementsChanged: function(addedElements, updatedElements, removedElements){
 		var _this = this;
 		
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

			} else if( added.cells ) {
				// This is an element that is a complete row
				this.elementsById[ added.id ] = added;
				RowElement(added);
				
			} else if( added.row && added.column ) {
				// This is an element that provides only a cell.
				this.elementsById[ added.id ] = added;
				CellElement(added);
			};
		};
		
		// Update elements
		for(var i=0,e=updatedElements.length; i<e; ++i){
			var updated = updatedElements[i];
			if( updated.isHeader ){
				installHeader(updated);

			} else if( updated.cells ) {
				// This is an element that is a complete row
				this.elementsById[ updated.id ] = updated;
				RowElement(updated);

			} else if( updated.row && updated.column ) {
				// This is an element that provides only a cell.
				this.elementsById[ updated.id ] = updated;
				CellElement(updated);
			};
		};
		
		// Make rows from elements
 		var sortedRows = [];
 		var rowsByName = {};
 		for(var elementId in this.elementsById){
 			var element = this.elementsById[elementId];
 			
 			if( element.cells ){
 				// This is a RowElement. Insert as a row
 				sortedRows.push(element);
	 			rowsByName[element.getRowName()] = element;
 			} else if( element.row && element.column ){
 				// This is a cell element. Insert into a row.
 				var rowName = element.row;
 				var row = rowsByName[rowName];
 				if( !row ){
 	 				row = {
 	 					rowName: rowName
 	 				};
 	 				CompositeRow(row);
 	 				rowsByName[rowName] = row;
 	 				sortedRows.push(row);
 				};
 				row.addCell(element);
 			};
 		};
		this._sortRows(sortedRows);
		this.sortedRows = sortedRows;
		this.rowsByName = rowsByName;

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
		var $table = $elem.find('tbody');
		
		$table.empty();
		const tableDocumentFragment = $(new DocumentFragment())
		
		var $tr = $('<tr>')
			.appendTo(tableDocumentFragment);
		this.headings.forEach(function(heading){
			var label = _loc( heading.label );
			if( !label ){
				label = heading.name;
			};
			var $th = $('<th>')
				.appendTo($tr);
			var $a = $('<a>')
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
			
			if( heading.title ){
				$a.attr('title', _loc(heading.title));
			};
		});
		
		this.sortedRows.forEach(function(row){
			var $tr = $('<tr>')
				.attr('nunaliit-row',row.getRowName())
				.appendTo(tableDocumentFragment);

			// Assign element id to row
			if( !row.elemId ){
				row.elemId = $n2.getUniqueId();
			};
			$tr.attr('id',row.elemId);
			
			// If row is an element, adjust styles
			if( row.isRowElement ) {
				_this._adjustStyles($tr, row);
			};

			_this.headings.forEach(function(heading){
				var name = heading.name;
				var $td = $('<td>')
					.attr('nunaliit-column',name)
					.attr('nunaliit-row',row.getRowName())
					.appendTo($tr);
				var cell = row.getCell(name);
				
				if( cell ){
					if( cell.isCellElement ){
						if( !cell.elemId ){
							cell.elemId = $n2.getUniqueId();
						};
						$td.attr('id',cell.elemId);
	
						_this._adjustStyles($td, cell);
					};

					if( _this.useLazyDisplay ){
						$td.addClass('n2TableCanvas_lazyDisplay');
					} else {
						_this._displayCell($td);
					};
				};
			});
		});
		
		if( this.useLazyDisplay ){
			this._refreshRows();
		} else {
			this.showService.fixElementAndChildren(tableDocumentFragment);
		};
		
		$table.append(tableDocumentFragment)
		
		if( this.showRowCount ){
			this._displayRowCounter();
		}
	},
	
	/**
	 * Loops through the rows and display those that are visible
	 */
	_refreshRows: function(){
		var _this = this;

		var $canvas = this._getElem();
		var $table = $canvas.find('tbody');

		var elemPosition = $table.position();
		var elemHeight = $table.height();
		var elemOffsetTop = $table.scrollTop();
		
		var atLeastOneShown = false;
		$canvas.find('.n2TableCanvas_lazyDisplay').each(function(){
			var $cell = $(this);
			
			var cellPosition = $cell.position();
			var cellHeight = $cell.height();
			
			var show = true;
			if( cellPosition.top > (elemHeight + elemOffsetTop + elemPosition.top) ){
				show = false;
			} else if( (cellPosition.top + cellHeight) < (elemOffsetTop + elemPosition.top) ){
				show = false;
			};
			
			if( show ){
				_this._displayCell($cell);
				$cell.removeClass('n2TableCanvas_lazyDisplay');
				atLeastOneShown = true;
			} else {
				// Keep content already displayed
			};
		});
		
		if( atLeastOneShown ){
			this.showService.fixElementAndChildren($canvas);
		};
	},
	
	_displayCell: function($td){
		var _this = this;
		
		var colName = $td.attr('nunaliit-column');
		var rowName = $td.attr('nunaliit-row');
		var row = this.rowsByName[rowName];
		var cell = row.getCell(colName);

		if( cell ){
			if( typeof cell.display === 'function' ){
				cell.display($td, cell, row);
				
				$td
					.click(function(){
						var $td = $(this);
						_this._selectedCell($td);
						return false;
					}).mouseover(function(){
						var $td = $(this);
						_this._mouseOver($td);
						return false;
					})
					.mouseout(function(){
						var $td = $(this);
						_this._mouseOut($td);
						return false;
					});

			} else if( typeof cell.display === 'string' ){
				$('<a>')
					.attr('href','#')
					.attr('nunaliit-row',row.getRowName())
					.attr('nunaliit-colmun',colName)
					.text(cell.display)
					.appendTo($td)
					.click(function(){
						var $a = $(this);
						_this._selectedCell($a);
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
				var value = row.getValue(colName);

				if( typeof value !== 'undefined' ){
					if( 'reference' === cell.type ){
						$('<a>')
							.addClass('n2s_referenceLink')
							.attr('nunaliit-document',value)
							.text(value)
							.appendTo($td);
						
					} else {
						$('<a>')
							.attr('href','#')
							.attr('nunaliit-row',row.getRowName())
							.attr('nunaliit-column',colName)
							.text(value)
							.appendTo($td)
							.click(function(){
								var $a = $(this);
								_this._selectedCell($a);
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
		};
	},
	
	_selectedCell: function($a){
		var element = this._getElementFromHtml($a);

		if( element ){
 			this.elementGenerator.selectOn(element);
		};
	},
	
	_mouseOver: function($a){
		var element = this._getElementFromHtml($a);

		if( element ){
 			this.elementGenerator.focusOn(element);
		};
	},
	
	_mouseOut: function($a){
		var element = this._getElementFromHtml($a);

		if( element ){
 			this.elementGenerator.focusOff(element);
		};
	},
	
	_getElementFromHtml: function($a){
		var rowName = $a.attr('nunaliit-row');
		var columnName = $a.attr('nunaliit-column');
		var row = this.rowsByName[rowName];
		
		if( row ){
			var cell = row.getCell(columnName);
			if( cell && cell.isCellElement ){
				return cell;
			};
			
			if( row.isRowElement ){
				return row;
			};
		};
		
		return undefined;
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

		const headerElements = $('th');
		for(let i = 0; i < headerElements.length; i++){
			$(headerElements[i]).removeClass();
		}

		//remove sort info
		for(let i = 0; i < this.sortOrder.length; i++) {
			const s = this.sortOrder[i];
			const order = i+1
			//add sort order info to th
			const thElement = $(($(`a[data-sort-name=${s.name}]`).parent())[0])
			if(s.direction > 0) {
				thElement.addClass('nunaliit-sort-asc')
				thElement.addClass(`nunaliit-sort-asc-${order}`)
			} else {
				thElement.addClass('nunaliit-sort-desc')
				thElement.addClass(`nunaliit-sort-desc-${order}`)
			}
		}
		
		this._sortRows(this.sortedRows);
		
		this._reorderDisplayedRows();
	},
	
	_reorderDisplayedRows: function(){
		this.sortedRows.forEach(function(row){
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

		changedElements.forEach(function(element){
			if( element.elemId ){
				var $elem = $('#'+element.elemId);
				if( $elem.length > 0 ){
					_this._adjustStyles($elem, element);
				};
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

 	_adjustStyles: function($elem, element){
		element.n2_elem = $elem[0];
		var symbolizer = this.styleRules.getSymbolizer(element);
		symbolizer.adjustHtmlElement($elem[0],element);
		delete element.n2_elem;
 	},
 	
 	_sortRows: function(rows){
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

 		rows.sort(function(a,b){
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
		if( this.sortedRows ){
			this.sortedRows.forEach(function(element){
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
