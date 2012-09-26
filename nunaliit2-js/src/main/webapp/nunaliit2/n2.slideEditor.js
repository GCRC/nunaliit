/*
Copyright (c) 2010, Geomatics and Cartographic Research Centre, Carleton 
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

$Id: n2.slideEditor.js 8165 2012-05-31 13:14:37Z jpfiset $
*/

// @requires n2.utils.js
// @requires n2.class.js
// @namespace nunaliit2
;(function($,$n2){

// Localization
var _loc = function(str){ return $n2.loc(str,'nunaliit2'); };
	

/*
 OBJECT SUPPORT
 

 */

/**
 * Finds and returns a data structure from within an object 
 * that corresponds to the given object selector.
 * @param o {Object} An object where the structure is seeked
 * @param selectors {Array} An object selector
 * @return {Object} An object which is the inner structure found within
 *                  the given object that corresponds to the given
 *                  selector. Null is returned if nothing is found.
 */
function findDataFromObject(o, selectors) {
	if( null === selectors
	 || 0 === selectors.length ) {
		return o;
	};
	
	// This is an error. There are more
	// selectors in the array but we have
	// a scalar. Return an error.
	if( null == o
	 || typeof(o) === 'number' 
	 || typeof(o) === 'string'
	 || typeof(o) === 'undefined'
	 || typeof(o) === 'function' ) {
		return null;
	};
	
	if( $n2.isArray(o) ) {
		var index = 1 * selectors[0];
		if( index >= o.length ) {
			return null;
		};
		if( selectors.length < 2 ) {
			return o[index];
		};
		return findDataFromObject(o[index], selectors.slice(1));
	}

	if( typeof(o) === 'object' ) {
		var key = selectors[0];
		var value = o[key];
		if( value === undefined ) {
			return null;
		};
		if( selectors.length < 2 ) {
			return value;
		};
		return findDataFromObject(value, selectors.slice(1));
	};
	
	// Should not get here. Error. Return null.
	return null;
};

/**
 * Sets a data structure in an object at the position
 * represented by the given selector.
 * @param o {Object} The object where the data must be inserted
 * @param selectors {Array} An object selector that represents
 *                          the position where the new data structure
 *                          should be inserted.
 * @param data {Object} Data structure that should be inserted.
 * @return {Boolean} Returns true if the data structure was inserted. 
 */
function setObjectData(o, selectors, data) {
	if( null === selectors
	 || 0 === selectors.length ) {
		return false;
	};
	
	if( $n2.isArray(o) ) {
		var index = 1 * selectors[0];
		if( index >= o.length ) {
			return false;
		};
		if( selectors.length > 1 ) {
			return setObjectData(o[index], selectors.slice(1), data);
		};
		o[index] = data;
		return true;
	}

	if( typeof(o) === 'object' ) {
		var key = selectors[0];
		if( selectors.length == 1 ) {
			o[key] = data;
			return true;
		}
		var value = o[key];
		if( value === undefined ) {
			return false;
		};
		return setObjectData(value, selectors.slice(1), data);
	};
	
	return false;
};

/**
 * Removes a data structure from an object, given a selector.
 * @param o {Object} Object to be modified
 * @param selectors {Array} Position in the object that should be removed.
 * @return {Boolean} True if the deletion was possible
 */
function deleteObjectData(o, selectors) {
	if( null === selectors
	 || 0 === selectors.length ) {
		return false;
	};
	
	if( o === null ) {
		return false;
	};
	
	if( $n2.isArray(o) ) {
		var index = 1 * selectors[0];
		if( index >= o.length ) {
			return false;
		};
		if( selectors.length > 1 ) {
			return deleteObjectData(o[index], selectors.slice(1));
		};
		// Remove this index
		o.splice(index,1);
		return true;
	}

	if( typeof(o) === 'object' ) {
		var key = selectors[0];
		var value = o[key];
		if( value === undefined ) {
			return false;
		};
		if( selectors.length > 1 ) {
			return deleteObjectData(value, selectors.slice(1));
		};
		delete o[key];
		return true;
	};
	
	return false;
};


/*
ARRAY
*/

function arrayRemove(arr, elem) {
	for(var i=0,e=arr.length; i<e; ++i) {
		if( arr[i] === elem ) {
			arr.splice(i,1);
			return;
		};
	};
};


/*
 * 
OBJECT EDITOR


|-id=<editorId>-------------------------------------------------|
|                                                               |
| |-n2se_root-------------------------------------------------| |
| |                                                           | |
| | |-n2se_history------------------------------------------| | |
| | |                                                       | | |
| | |-------------------------------------------------------| | |
| |                                                           | |
| | |-n2se_main---------------------------------------------| | |
| | |                                                       | | |
| | | |-n2se_back-----------------------------------------| | | |
| | | |                                                   | | | |
| | | |---------------------------------------------------| | | |
| | |                                                       | | |
| | | |-n2se_display--------------------------------------| | | |
| | | |                                                   | | | |
| | | |                                                   | | | |
| | | |---------------------------------------------------| | | |
| | |                                                       | | |
| | |-------------------------------------------------------| | |
| |                                                           | |
| |-----------------------------------------------------------| |
|                                                               |
|---------------------------------------------------------------|


History:
<div class="n2se_history">
	<span class="n2se_history_back"><span class="n2se_btn"></span><span class="n2se_label">Back</span></span>
	<span class="n2se_history_head"></span>
	<span class="n2se_history_level">top</span>
	<span class="n2se_history_inter"></span>
	<span class="n2se_history_level"> ... </span>
	<span class="n2se_history_inter"></span>
	<span class="n2se_history_level"> ... </span>
	<span class="n2se_history_tail"></span>
</div>

Display:
<div class="n2se_display">
	<div class="n2se_entries">
		<div class="n2se_entry">
			<span class="n2se_entry_delete"></span>
			<input class="n2se_entry_key" type="text"/>  // in the case of an array, it is a span
			<span class="n2se_entry_is"> is </span>
			<select class="n2se_entry_select"></select>  // contains options for type
			
			// One of the following
			<input class="n2se_entry_text" type="text"/>
			<input class="n2se_entry_cb" type="checkbox"/>
			<span class="n2se_entry_forward"></span>
		</div>
		<div class="n2se_entry">
			...
		</div>
		(...)
	</div>
	<div class="n2se_addbar">
		<span class="n2se_addbar_addButton"><span class="n2se_btn"></span><span class="n2se_label">Add</span></span>
	</div>
</div>

in the case of editing a string:
<div class="n2se_display">
	<textarea class="n2se_textarea">
		...
	</textarea>
</div>


*/

function defaultCreateNewKey(cbAddKeyToObject, obj, selectors, data) {
	// Find a key
	var index = 0;
	var key = 'newkey_'+index;
	while( data[key] !== undefined ) {
		++index;
		key = 'newkey_'+index;
		if(index > 100) return;
	};
	
	// Call back into editor with new key and data
	cbAddKeyToObject(selectors, key, '');
}

function defaultGetDeleteConfirmation(cbDeleteKey) {
	if( confirm( _loc('Do you wish to delete this element?') ) ) {
		cbDeleteKey(); // yes
	};
}

function defaultObjectKeySort(objFrag) {
	var temp = [];
	for(var key in objFrag) {
		temp.push(key);
	};
	temp.sort();
	var keyOrder = [];
	if( objFrag.n2se_keyorder ) {
		for(var i=0,e=objFrag.n2se_keyorder.length; i<e; ++i) {
			var key = objFrag.n2se_keyorder[i];
			if( typeof(objFrag[key]) !== 'undefined' ) {
				arrayRemove(temp, key);
				keyOrder.push(key);
			};
		};
	};
	for(var i=0,e=temp.length; i<e; ++i) {
		var key = temp[i];
		keyOrder.push(key);
	};
	
	return keyOrder;
};

function defaultObjectKeyOrderSave(objFrag, orderArray) {
	objFrag.n2se_keyorder = orderArray;
};

function defaultIsKeyDisplayed(obj, selectors, data) {
	if( selectors.length > 0 ) {
		var key = selectors[selectors.length-1];
		if( key === 'n2se_keyorder' ) {
			return false;
		};
	};
	return true;
};

var createEditorDefaultOptions = {
	onObjectChanged: function(obj){}
	,objectKeySortAllowed: true
	,objectKeySort: defaultObjectKeySort
	,objectKeyOrderSave: defaultObjectKeyOrderSave
	,getDeleteConfirmation: defaultGetDeleteConfirmation
	,isKeyDisplayed: defaultIsKeyDisplayed
	,isKeyEditingAllowed: function(obj, selectors, data){ return true; }
	,isValueEditingAllowed: function(obj, selectors, data){ return true; }
	,isKeyDeletionAllowed: function(obj, selectors, data){ return true; }
	
	,createNewKey: defaultCreateNewKey
};

var SlideEditor = $n2.Class({
	
	divId: null
	
	,obj: null
	
	,options: null
	
	,currentSelectors: null
	
	,initialize: function($div, obj, opt_) {
		this.options = $.extend(
				{}
				,createEditorDefaultOptions
				,opt_
			);

		var divId = $div.attr('id');
		if( !divId ) {
			divId = $n2.getUniqueId();
			$div.attr('id',divId);
		};
		this.divId = divId;
		
		this.obj = obj;
		this.currentSelectors = [];
		
		this._installEditors();
	}

	/**
	 * This function must be called before an editor can be disposed of.
	 */
	,destroy: function() {
		this._removeEditors();

		this.divId = null;
		this.obj = null;
		this.options = null;
	}
	
	,getDiv: function() {
		
		if( this.divId ) {
			var $div = $('#'+this.divId);
			if( $div.length > 1 ) {
				return $div.first();
			} else if( $div.length > 0 ) {
				return $div;
			};
		};
		
		return null;
	}

	,getId: function() {
		return this.divId;
	}
	
	,getObject: function() {
		return this.obj;
	}
	
	/*
	 * Call from client to indicate that the underlying object was changed
	 */
	,refresh: function() {
		// Verify if current selector is still valid.
		var currentSelectors = this.currentSelectors;
		var objFrag = findDataFromObject(this.obj, currentSelectors);
		
		if( null !== objFrag ) {
			// Current selector is still valid, simply refresh
			this._refresh();
		} else {
			// Need to transition back to a valid place...
			
			// Adjust current selectors
			while(!objFrag) {
				currentSelectors.pop();
				objFrag = findDataFromObject(this.obj, currentSelectors);
			};
			
			// refresh display
			this._refresh({back:true});
		};
	}
	
	,_refresh: function(opt_) {
		this._refreshHistory(opt_);
		this._refreshDisplay(opt_);
	}
	
	,_refreshHistory: function() {
		var editor = this;
		var currentSelectors = this.currentSelectors;
		var $div = this.getDiv();
		if( $div ) {
			var $history = $div.find('.n2se_history');
			
			$history.empty();

			var $back = $('<span class="n2se_history_back"><span class="n2se_btn"></span><span class="n2se_label">'+_loc('Back')+'</span></span>');
			$history.append($back);
			$back.click(function(e){
				editor._backClicked(e);
			});

			var $head = $('<span class="n2se_history_head"></span>');
			$history.append($head);
			
			var $top = $('<span class="n2se_history_level">'+_loc('top')+'</span>');
			$history.append($top);
			$top.click(createHistoryCallback(editor, 0));
			
			for(var i=0,e=currentSelectors.length; i<e; ++i) {
				var $inter = $('<span class="n2se_history_inter"></span>');
				$history.append($inter);

				var selector = currentSelectors[i];
				var $level = $('<span class="n2se_history_level">'+selector+'</span>');
				$history.append($level);
				$level.click(createHistoryCallback(editor, i+1));
			};

			var $tail = $('<span class="n2se_history_tail"></span>');
			$history.append($tail);
		};
		
		function createHistoryCallback(editor, index) {
			var cb = function() {
				editor._historyClicked(index);
			};
			return cb;
		}
	}
	
	,_refreshDisplay: function(opt_) {
		var currentSelectors = this.currentSelectors;
		var $div = this.getDiv();
		if( $div ) {
			var objFrag = findDataFromObject(this.obj, currentSelectors);
			var currentSelectorsCopy = [];
			currentSelectorsCopy.push.apply(currentSelectorsCopy, currentSelectors);

			if( opt_ && opt_.back ) {
				// refresh display using a back transition
				var $main = $div.find('.n2se_main');
				
				var $previousDisplayDivs = $main.find('.n2se_display');

				var $display = $('<div class="n2se_display"></div>');
				if( $previousDisplayDivs.length > 0 ) {
					$previousDisplayDivs.first().before($display);
				} else {
					$main.append($display);
				};

				this._drawDisplayPage($display, this.obj, currentSelectorsCopy, objFrag);
				
				$display.effect(
					'slide'
					,{
						mode: 'show'
						,direction: 'left'
					}
					,500
					,null // no callback
				);
				
				$previousDisplayDivs.effect(
					'slide'
					,{
						mode: 'hide'
						,direction: 'right'
					}
					,500
					,function(){ $previousDisplayDivs.remove(); }
				);
				
			} else if( opt_ && opt_.forward ) {
				// Refresh display with forward transition
				var $main = $div.find('.n2se_main');
				
				var $previousDisplayDivs = $main.find('.n2se_display');

				var $display = $('<div class="n2se_display"></div>');
				$main.append($display);

				this._drawDisplayPage($display, this.obj, currentSelectorsCopy, objFrag);
				
				$previousDisplayDivs.effect(
					'slide'
					,{
						mode: 'hide'
						,direction: 'left'
					}
					,500
					,function(){ $previousDisplayDivs.remove(); }
				);
				
				$display.effect(
					'slide'
					,{
						mode: 'show'
						,direction: 'right'
					}
					,500
					,null // no callback
				);
				
			} else {
				// refresh display in place
				var $display = $div.find('.n2se_display');
				
				$display.empty();
	
				this._drawDisplayPage($display, this.obj, currentSelectorsCopy, objFrag);
			};
		};
	}
	
	,_drawDisplayPage: function($display, obj, selectors, objFrag) {
		var editor = this;
		
		var isArray = false;
		var addBarNeeded = false;
		if( typeof(objFrag) === 'string' ) {
			// String
			// Special case: we need to find the parent object
			//  and key required to update the string
			
			var isValueEditingAllowed = this.options.isValueEditingAllowed(obj, selectors, objFrag);
			var stringKey = selectors.pop();
			var stringParentObj = findDataFromObject(obj, selectors);
			
			var $keyDiv = $('<textarea class="n2se_textarea"></textarea>')
			$display.append($keyDiv);
			$keyDiv.val(objFrag);
			if( isValueEditingAllowed ) {
				$keyDiv.keyup(function(e){
					var $textarea = $(this);
					var newValue = $textarea.val();
					var currentValue = stringParentObj[stringKey];
	
					if( currentValue !== newValue ) {
						stringParentObj[stringKey] = newValue;
						editor._reportObjectChange();
					};
				});
			} else {
				$keyDiv.attr('disabled','disabled');
			};

		} else if( $n2.isArray(objFrag) ) {
			// Array
			addBarNeeded = true;
			isArray = true;
			
			var $entries = $('<div class="n2se_entries"></div>');
			$display.append($entries);

			for(var key=0,e=objFrag.length; key<e; ++key) {
				var $keyDiv = $('<div class="n2se_entry"></div>')
				$entries.append($keyDiv);
				
				selectors.push(key);
				var isValueEditingAllowed = this.options.isValueEditingAllowed(obj, selectors, objFrag[key]);
				var isKeyDeletionAllowed = this.options.isKeyDeletionAllowed(obj, selectors, objFrag[key]);
				selectors.pop();
				
				addKeyValue(editor, $keyDiv, objFrag, key, isArray, false, isValueEditingAllowed, isKeyDeletionAllowed);
			};
			
			$entries.sortable();
			$entries.bind('sortupdate',function(){
				editor._resortArray($display,objFrag);
			});
			
		} else {
			// Object
			addBarNeeded = true;
			
			var $entries = $('<div class="n2se_entries"></div>');
			$display.append($entries);
			
			var keyOrder = this.options.objectKeySort(objFrag);
			
			for(var i=0,e=keyOrder.length; i<e; ++i) {
				var key = keyOrder[i];

				selectors.push(key);
				var isKeyDisplayed = this.options.isKeyDisplayed(obj, selectors, objFrag[key]);
				var isKeyEditingAllowed = this.options.isKeyEditingAllowed(obj, selectors, objFrag[key]);
				var isValueEditingAllowed = this.options.isValueEditingAllowed(obj, selectors, objFrag[key]);
				var isKeyDeletionAllowed = this.options.isKeyDeletionAllowed(obj, selectors, objFrag[key]);
				selectors.pop();
				
				if( isKeyDisplayed ) {
					var $keyDiv = $('<div class="n2se_entry"></div>')
					$entries.append($keyDiv);
					
					addKeyValue(editor, $keyDiv, objFrag, key, isArray, isKeyEditingAllowed, isValueEditingAllowed, isKeyDeletionAllowed);
				};
			};
			
			if( this.options.objectKeySortAllowed ) {
				$entries.sortable();
				$entries.bind('sortupdate',function(){
					editor._resortObject($display,objFrag);
				});
			};
		};
		
		// Install 'add' bar
		if( addBarNeeded ) {
			var $addBar = $('<div class="n2se_addbar"></div>');
			$display.append($addBar);
			var $addButton = $('<span class="n2se_addbar_addButton"><span class="n2se_btn"></span><span class="n2se_label">'+_loc('Add')+'</span></span>');
			$addBar.append($addButton);
			$addButton.click(function(){
				if( isArray ) {
					objFrag.push('');
					editor._refreshDisplay();
					editor._reportObjectChange();

				} else {
					editor.options.createNewKey(function(selectors, newKey, newValue){
							objFrag[newKey] = newValue;
							editor._refreshDisplay();
							editor._reportObjectChange();
						}
						,obj
						,selectors
						,objFrag
					);
				};
			});
		};
		
		function addKeyValue(editor, $keyDiv, objFrag, key, isArray, isKeyEditingAllowed, isValueEditingAllowed, isKeyDeletionAllowed) {

			var value = objFrag[key];
			
			var $del = $('<span class="n2se_entry_delete"></span>');
			$keyDiv.append( $del );
			if( isKeyDeletionAllowed ) {
				$del.click(function(){
					editor.options.getDeleteConfirmation(function(){
						if( isArray ) {
							objFrag.splice(key,1);
						} else {
							delete objFrag[key];
						}
	
						editor._refreshDisplay();
						editor._reportObjectChange();
					});
				});
			} else {
				$del.addClass('n2se_entry_delete_disabled');
			};
			
			if( isArray ) {
				var $keyInput = $('<span class="n2se_entry_key">'+key+'</span>');
				$keyDiv.append( $keyInput );
			} else {
				var $keyInput = $('<input class="n2se_entry_key" type="text"/>');
				$keyDiv.append( $keyInput );
				$keyInput.val(key);
				if( isKeyEditingAllowed ) {
					$keyInput.change(function(e){
						var $keyInput = $(this);
						var newKey = $keyInput.val();
		
						if( key != newKey ) {
							// Check if key already exists
							if( objFrag[newKey] ) {
								// abort
								$keyInput.val(key);
							} else {
								objFrag[newKey] = objFrag[key];
								delete objFrag[key];
								$keyDiv.empty();
								addKeyValue(editor, $keyDiv, objFrag, newKey, isArray, isKeyEditingAllowed, isValueEditingAllowed, isKeyDeletionAllowed);
								editor._reportObjectChange();
							};
						};
					});
				} else {
					$keyInput.attr('disabled','disabled');
				};
			};
			
			$keyDiv.append( $('<span class="n2se_entry_is"> '+_loc('is')+' </span>') );
			
			var $select = $('<select class="n2se_entry_select"></select>');
			$keyDiv.append( $select );
			
			$select.append( $('<option value="string">'+_loc('a String')+'</option>') );
			$select.append( $('<option value="number">'+_loc('a Number')+'</option>') );
			$select.append( $('<option value="boolean">'+_loc('a Checkbox')+'</option>') );
			$select.append( $('<option value="array">'+_loc('an Array')+'</option>') );
			$select.append( $('<option value="object">'+_loc('an Object')+'</option>') );
			$select.append( $('<option value="null">'+_loc('empty')+'</option>') );
			
			var requiresTextBox = false;
			var requiresCheckBox = false;
			var requiresForwardButton = false;
			if( value === null ) {
				$select.val('null');
				
			} else if( typeof(value) === 'undefined' ) {
				$select.val('null');
				
			} else if( $n2.isArray(value) ) {
				$select.val('array');
				requiresForwardButton = true;

			} else if( typeof(value) === 'object' ) {
				$select.val('object');
				requiresForwardButton = true;

			} else if( typeof(value) === 'string' ) {
				$select.val('string');
				requiresTextBox = true;
				requiresForwardButton = true;
				
			} else if( typeof(value) === 'number' ) {
				$select.val('number');
				requiresTextBox = true;
				
			} else if( typeof(value) === 'boolean' ) {
				$select.val('boolean');
				requiresCheckBox = true;

			} else {
				$select.val('string');
				requiresTextBox = true;
				requiresForwardButton = true;
			};
			if( isValueEditingAllowed ) {
				$select.change(function(e){
					var $select = $(this);
					var newType = $select.val();
	
					if( 'string' === newType ) {
						if( typeof(objFrag[key]) === 'object' ) {
							objFrag[key] = '';
						} else {
							objFrag[key] = ''+objFrag[key];
						};
					} else if( 'array' === newType ) { 
						objFrag[key] = [ objFrag[key] ]; 
					} else if( 'object' === newType ) { 
						objFrag[key] = {}; 
					} else if( 'number' === newType ) { 
						objFrag[key] = 1 * objFrag[key];
						if( isNaN(objFrag[key]) ) {
							objFrag[key] = 0;
						};
					} else if( 'boolean' === newType ) { 
						objFrag[key] = false; 
					} else if( 'null' === newType ) { 
						objFrag[key] = null; 
					} else { 
						objFrag[key] = ''; 
					};
	
					$keyDiv.empty();
					addKeyValue(editor, $keyDiv, objFrag, key, isArray, isKeyEditingAllowed, isValueEditingAllowed, isKeyDeletionAllowed);
					editor._reportObjectChange();
				});
			} else {
				$select.attr('disabled','disabled');
			};
			
			if( requiresForwardButton ) {
				var $forwardButton = $('<span class="n2se_entry_forward"></span>');
				$keyDiv.append( $forwardButton );
				$forwardButton.click(function(e){
					editor._forwardClicked(key);
				});
			};

			if( requiresTextBox ) {
				var $textBox = $('<input class="n2se_entry_text" type="text"/>');
				$keyDiv.append( $textBox );
				$textBox.val(value);
				if( isValueEditingAllowed ) {
					$textBox.keyup(function(e){
						var $textBox = $(this);
						var newVal = $textBox.val();
						if( typeof(objFrag[key]) === 'number' ) {
							// force number
							newVal = 1 * newVal;
							if( isNaN(newVal) ) {
								// Error
								$textBox.val( objFrag[key] );
							} else {
								objFrag[key] = newVal;
								editor._reportObjectChange();
							};
						} else {
							objFrag[key] = newVal;
							editor._reportObjectChange();
						};
					});
				} else {
					$textBox.attr('disabled','disabled');
				};
				
			} else if( requiresCheckBox ) {
				var $checkBox = $('<input class="n2se_entry_cb" type="checkbox"/>');
				$keyDiv.append( $checkBox );
				if( value ) {
					$checkBox.attr('checked','checked');
				}
				if( isValueEditingAllowed ) {
					$checkBox.click(function(e){
						var $checkBox = $(this);
						var newVal = $checkBox.is(':checked');
						objFrag[key] = newVal;
						editor._reportObjectChange();
					});
				} else {
					$checkBox.attr('disabled','disabled');
				};
				
			};
		};
	}

	,_installEditors: function() {
		var editor = this;
		var $div = this.getDiv();
		if( $div ) {
			$div.empty();

			var $root = $('<div class="n2se_root"></div>');
			$div.append($root);
			
			var $history = $('<div class="n2se_history"></div>');
			$root.append($history);
			
			var $main = $('<div class="n2se_main"></div>');
			$root.append($main);
			
			var $back = $('<div class="n2se_back"></div>');
			$main.append($back);
			$back.click(function(e){ editor._backClicked(e); });
			
			var $display = $('<div class="n2se_display"></div>');
			$main.append($display);
			
			this._refresh();
		}; // if $div
	}
	
	,_removeEditors: function() {
		var $div = this.getDiv();
		if( $div ) {
			$div.empty();
			
			this.divId = null;
		};
	}
	
	,_backClicked: function(e) {
		if( this.currentSelectors.length > 0 ) {
			this.currentSelectors.pop();
			this._refresh({back:true});
		};
	}
	
	,_forwardClicked: function(key) {
		this.currentSelectors.push(key);
		this._refresh({forward:true});
	}
	
	,_historyClicked: function(selectorIndex) {

		var howManyRemoved = this.currentSelectors.length - selectorIndex;
		if( howManyRemoved > 0 ) {
			this.currentSelectors.splice(selectorIndex, howManyRemoved);
			this._refresh({back:true});
		};
	}
	
	,_reportObjectChange: function() {
		try {
			this.options.onObjectChanged(this.obj);
		} catch(e) {
			$n2.log('Error reported on object refresh',e);
		}
	}
	
	,_resortArray: function($display, objFrag) {
		var $keys = $display.find(".n2se_entry_key");
		$n2.log('$keys',$keys);
		
		var nextArray = [];
		$keys.each(function(i,elem){
			var key = 1 * $(elem).text();
			
			nextArray.push( objFrag[key] );
		});
		
		// Swap
		objFrag.splice(0, objFrag.length);
		for(var i=0,e=nextArray.length; i<e; ++i) {
			objFrag.push( nextArray[i] );
		};
		
		// Refresh display
		this._refresh();
		
		this._reportObjectChange();
	}
	
	,_resortObject: function($display, objFrag) {
		var $keys = $display.find(".n2se_entry_key");

		var orderArray = [];
		$keys.each(function(i,elem){
			var key = $(elem).val();
			orderArray.push( key );
		});
		
		// Save new order
		this.options.objectKeyOrderSave(objFrag, orderArray);
		
		// Refresh display
		this._refresh();
		
		this._reportObjectChange();
	}
});

$n2.slideEditor = {
	Editor: SlideEditor
	,support: {
		findDataFromObject: findDataFromObject
		,setObjectData: setObjectData
		,deleteObjectData: deleteObjectData
	}
};
	
})(jQuery,nunaliit2);
