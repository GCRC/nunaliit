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

*/

;(function($,$n2){
"use strict";

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };
	
/*

This portion of the script deals with basic trees. A tree is a HTML structure
that contains nested UL and LI tags.

<ul class="tree">
	<li>
		<span>1</span>
	</li>
	<li>
		<span>2</span>
		<ul>
			<li>
				<span>2.1</span>
			</li>
			<li>
				<span>2.2</span>
			</li>
		</ul>
	</li>
</ul>

The top ul tag is called the "root" of the tree.

During initialization, the tree is modified to look like this:

<ul id="tree5" class="tree">
	<li class="treeHideChildren treeNoChildren">
		<div class="treeExpand"></div>
		<span class="treeKey">1</span>
	</li>
	<li class="treeHideChildren">
		<div class="treeExpand"></div>
		<span class="treeKey">2</span>
		<ul class="treeChildren">
			<li class="treeHideChildren">
				<div class="treeExpand"></div>
				<span class="treeKey">2.1</span>
			</li>
			<li class="treeHideChildren">
				<div class="treeExpand"></div>
				<span class="treeKey">2.2</span>
			</li>
		</ul>
	</li>
</ul>

Here is the meaning of the classes:
- tree : Assign to ul element which is the tree root. Assigned externally.
- treeKey : Assigned to first span element in li elements. This is the key shown.
- treeChildren : Assigned to ul elements in li elements. Represents that the element
                 contains the children of the node.
- treeExpand : Assigned to first div element in li element. This div should display
               the icon for expanding/collapsing the tree node.
- treeNoChildren : Assigned to li element when it contains no children
- treeShowChildren : Assigned when the user has decided to show children from node.
- treeHideChildren : Assigned when the user has decided to hide the children.
- treeClickInstalled : Assigned to all elements that have a 'click' event bound by
                       the tree script

Usage:

	var tree = new $n2.tree.Tree($('#tree5'), options);

 */	
	
var treeUuid = 1;

/**
 * Given any element from a tree, this function returns
 * the top-most ul tag in a jQuery set.
 * @param {Object} $elem A DOM node of a jQuery set containing a DOM node.
 * @return {Object} A jQuery set containing the root element of the tree. Null
 *                  if not found.
 */
function findTreeRoot($elem) {
	if( !$elem.jquery ) {
		$elem = $(elem);
	};
	if( $elem.length > 1 ) {
		$elem = $(elem).first();
	};
	if( $elem.hasClass('tree') ) {
		return $elem;
	};
	var parent = $elem.parent();
	if( parent.length > 0 ) {
		return findTreeRoot(parent);
	}
	return null;
};

/**
 * Returns the unique identifier assigned to a tree. This number
 * should not change throughout the life of the tree.
 * @param {Object} elem A DOM node or a jQuery set containing a DOM node which is 
 *                      located within the tree.
 * @return {Integer} The unique identifier. -1 if the tree root is not found.
 */
function getTreeUuid(elem) {
	var $tree = findTreeRoot(elem);
	if( !$tree ) {
		return -1;
	}
	return $tree[0]['treeUuid'];
};

/**
 * Returns the 'id' attribute of the tree root.
 * @param {Object} elem A DOM node or a jQuery set containing a DOM node which is 
 *                      located within the tree.
 * @return {Integer} The DOM identifier. Null if the tree root is not found.
 */
function getTreeId(elem) {
	var $tree = findTreeRoot(elem);
	if( !$tree ) {
		$n2.log('tree getTreeId(): can not find tree root');
		return null;
	}
	return $tree.attr('id');
};

/**
 * Returns the 'li' element where the given node is located. This function
 * travels up the DOM tree until it finds the 'li' element managed by the tree
 * and returns it.
 * @param {Object} elem A DOM node or a jQuery set containing a DOM node which is 
 *                      located within the tree.
 * @return {Object} A jQuery set containing the 'li' element. Null if the 
 *                  'li' element can not be found.
 */
function findLiFromElement(elem) {
	if( !elem.jquery ) {
		elem = $(elem);
	};
	
	if( elem.length < 1 ) {
		return null;
	};
	
	if( elem[0].nodeName.toLowerCase() === 'li' ) {
		return elem;
	};

	return findLiFromElement(elem.parent());
}


/**
	This function adjusts the following classes:
	treeHideChildren, treeShowChildren.
	
	If treeHideChildren is set, it removes treeHideChildren and add
	treeShowChildren. If treeShowChildren is set, it removes 
	treeShowChildren and add treeHideChildren. This way, it toggles
	the visibility of the children.
	
	@name toggleHideChildren
	@function
	@memberOf nunaliit2.tree
*/
function toggleHideChildren($li) {
	var isHidden = $li.hasClass('treeHideChildren');
	if( isHidden ) {
		$li.removeClass('treeHideChildren');
		$li.addClass('treeShowChildren');
	} else {
		$li.addClass('treeHideChildren');
		$li.removeClass('treeShowChildren');
	};
};

/**
	This function is called when a plus/minus sign is clicked
	on the tree. It toggles the children visibility.
	@name liOpenClose
	@function
	@memberOf nunaliit2.tree
*/
function liOpenClose() {
	// "this" is the element that was clicked
	var $li = findLiFromElement(this);
	toggleHideChildren($li);
};

/**
	This function is called when a tree key is clicked.
	The callback specified in the options (onKeyClick) is 
	executed. If the callback returns true, the node is
	toggle (expanding/collapsing).
	
	@name keyClicked
	@function
	@memberOf nunaliit2.tree
*/
function keyClicked(span, opt) {
	var $li = findLiFromElement(span);
	
	var toggle = opt.onKeyClick($li);
	if( toggle ) {
		toggleHideChildren($li);
	};
};

var treeDefaultOptions = {
	allClosed: true
	,onKeyClick: function($li){ return true; }
};

/**
	Takes a jQuery object containing a tree root
	(<ul class="tree">) and
	installs the appropriate classes and functions to
	make it behave like a tree structure. An identifier is
	assigned, if one does not already exist. It also
	assigns to the tree root element a unique identifier (uuid)
	saved under the attribute called 'treeUuid'. After this is done,
	it calls tree_refresh().
	@name tree.init
	@function
	@memberOf nunaliit2
	@param {Object} $tree A jQuery object that contains the head of
	                the tree.
	@param {Object} opt Options for generating the tree
*/
function tree_init($tree, opt) {
	//var opt = $.extend({},treeDefaultOptions,opt_);

	$tree.each(function(){
		var uuid = this['treeUuid'];
		if( !uuid ) {
			uuid = treeUuid;
			++treeUuid;
			this['treeUuid'] = uuid;
		};
		
		var $this = $(this);
		var id = $this.attr('id');
		if( !id 
		 || typeof(id) === 'undefined' ) {
			id = 'tree_'+uuid;
			$this.attr('id',id);
		};
	});
	
	tree_refresh($tree,opt);
};

/**
	Takes a jQuery object containing a tree root
	(<ul class="tree">) and adds the appropriate elements
	to make it work as a tree. It also binds appropriate callbacks
	for expanding/collapsing the tree nodes.
	This function should be called whenever the tree is modified
	by an external entity.
	@name tree_refresh
	@function
	@memberOf nunaliit2.tree
	@param {Object} $tree A jQuery object that contains the root of
	                the tree.
	@param {Object} opt Options for generating the tree
*/
function tree_refresh($tree, opt) {
	//var opt = $.extend({},treeDefaultOptions,opt_);

	$tree.find('li').each(function(j,li){
		var $li = $(li);
		
		// li.treeEditAdd are not real leaves
		if( false == $li.hasClass('treeEditAdd') ) {
			var divSymbol = $li.children('div.treeExpand');
			if( divSymbol.length < 1 ) {
				divSymbol = $('<div class="treeExpand"></div>');
				$li.prepend(divSymbol);
			};
			if( false == divSymbol.hasClass('treeClickInstalled') ) {
				divSymbol.click(liOpenClose);
				divSymbol.addClass('treeClickInstalled');
			};
			
			var firstSpan = $li.children('span').first();
			if( false == firstSpan.hasClass('treeKey') ) {
				firstSpan.addClass('treeKey');
			};
			if( false == firstSpan.hasClass('treeClickInstalled') ) {
				firstSpan.click(function(){
					keyClicked(this,opt);
				});
				firstSpan.addClass('treeClickInstalled');
			};
			
			$li.children('ul').addClass('treeChildren');
			
			// Redo the query, because object code might add other children
			if( $li.children('.treeChildren').length > 0 ) {
				$li.removeClass('treeNoChildren');
			} else {
				$li.addClass('treeNoChildren');
			};
			
			if( false == $li.hasClass('treeHideChildren')
			 && false == $li.hasClass('treeShowChildren') ) {
				// This li element has never been visited. Give
				// it a state according to options
				if( opt.allClosed ) {
					$li.addClass('treeHideChildren');
				} else {
					$li.addClass('treeShowChildren');
				};
			};
		};
	});
};

var Tree = $n2.Class({
	treeId: null
	
	,options: null
	
	,initialize: function($tree, opt_){
		this.options = $.extend(
			{}
			,treeDefaultOptions
			,opt_
			);
		
		tree_init($tree, this.options);
		
		this.treeId = getTreeId($tree);
	}

	,getRoot: function() {
		var $tree = $('#'+this.treeId);
		
		if( $tree.length != 1 ) {
			$n2.log('Tree.getRoot(): id not found: '+this.treeId);
			return null;
		};
		
		return $tree;
	}

	,getId: function() {
		return this.treeId;
	}
	
	,refresh: function() {
		var $tree = this.getRoot();
		if( $tree ) {
			tree_refresh($tree, this.options);
		};
	}
});

/*
 OBJECT SUPPORT
 
 This portion of the script deals with making trees based on
 the structure of javascript objects.
 
 This code is based on the basic trees (as shown above) but it adds
 elements and bread crumbs (attributes to the elements) to synchronize
 the tree and the memory object.

 A tree created based on a javascript object as a structure like this:

 <ul id="tree5" class="tree">
	<li id="tree5_a" class="treeHideChildren treeNoChildren">
		<div class="treeExpand"></div>
		<span class="treeKey">a</span>
		<span class="treeValue">b</span>
	</li>
	<li id="tree5_arr" class="treeShowChildren">
		<div class="treeExpand"></div>
		<span class="treeKey">arr</span>
		<span class="treeValue">[1,2]</span>
		<ul class="treeChildren">
			<li id="tree5_arr_0" class="treeHideChildren treeNoChildren">
				<div class="treeExpand"></div>
				<span class="treeKey">0</span>
				<span class="treeValue">1</span>
			</li>
			<li id="tree5_arr_1" class="treeHideChildren treeNoChildren">
				<div class="treeExpand"></div>
				<span class="treeKey">1</span>
				<span class="treeValue">2</span>
			</li>
		</ul>
	</li>
	<li id="tree5_obj" class="treeShowChildren">
		<div class="treeExpand"></div>
		<span class="treeKey">obj</span>
		<span class="treeValue">{"desc":"A very long descri...</span>
		<ul class="treeChildren">
			<li id="tree5_obj_desc" class="treeHideChildren treeNoChildren">
				<div class="treeExpand"></div>
				<span class="treeKey">desc</span>
				<span class="treeValue">"A very long description..."</span>
				<div class="treeChildren">"A very long description might be truncated in the value field."</div>
			</li>
		</ul>
	</li>
</ul>

the tree above was generated from the following object:

{
	"a":"b"
	,"arr": [1,2]
	,"obj": {
		"desc":"A description"
	}
}

This tree differs from the basic tree as follows:
- 'id' attributes are added to each li element. The 'id' attribute
  represents the location of the associated data in the object structure.
  It is a concatenation of the data selector and all selectors of the parent
  data structures. Finally, the id is concatenated with the tree uuid to ensure
  a unique identifier. Given a tree uuid and a set of selectors, it is possible
  to retrieve the li element which is the node for the associated data.
- An element <span class="treeValue"/> is added to each node. This contains the
  value of the data if the node is scalar (null, number, string). This element contains
  a preview of the children data in other cases. The size of this value is limited,
  so if a scalar data prints too long, it is truncated.
- An element <div class="treeChildren"/> is added to a node if a scalar is too long to
  be displayed in a value field (span.treeValue).
- An attribute called 'treeArrayIndex' is added to li elements that represent data
  structures within an array. This attribute is an integer and is the index within
  the array where the data structure is located.
- An attribute called 'treeObjectKey' is added to li elements that represent data
  structures within an object. This attribute is a string and is the key within
  the object where the data structure is located.

An object selector is an array of strings and numbers. Each element of the array
represent a key from an object or an index from an array. The order in the array
represents the selections required from the top of the object to access a given
data structure within the object. For example, take the following javascript object:

 {
 	"a": "b"
 	,"arr": [
 		0
 		,1
 		,{
 			"desc": "A description"
 		}
 	]
 }
 
 The string "A description" would be access with the following selector:
 	["arr",2,"desc"]

Usage:

	<div id="container"></div>
	
	var obj = {...};
	
	var objectTree = new $n2.tree.ObjectTree($('#container'), obj, options);

 */

/**
 * Given a li element, find the object selector it represents.
 * @param $li {Object} A jQuery set containing the li element for
 *                     which the selectors are seeked.
 * @return {Array} An array of strings and numbers that are the appropriate
 *                 selectors. 
 */
function computeSelectors($li) {

	if( $li.length != 1 ) return null;
	
	// Walk up tree
	var selectors = [];
	if( false == innerCompute($li, selectors) ) {
		return null;
	};
	return selectors;
	
	function innerCompute($li, selectors) {
		var $ul = $li.parent();
		if( $ul.length > 0 && false == $ul.hasClass('tree') ) {
			// First, insert parent's selector
			var $parentLi = $ul.parent();
			if( false == innerCompute($parentLi, selectors) ) {
				return false;
			};
		};
		
		// Add this selector
		var liElem = $li[0];
		if( typeof(liElem['treeArrayIndex']) !== 'undefined' ) {
			selectors.push( 1 * liElem['treeArrayIndex'] );
			return true;
			
		} else if( typeof(liElem['treeObjectKey']) !== 'undefined' ) {
			selectors.push( liElem['treeObjectKey'] );
			return true;
			
		} else {
			// Error
			return false;
		};
	};
};

/**
 * Given a string, converts it so that it is acceptable as an HTML
 * identifier or class.
 * @param s {String} String to be converted.
 * @return {String} Version of the string that is acceptable as a
 *                   HTML identifier or class.
 */
function stringToHtmlId(s){
	if( typeof(s) === 'string' ) {
		var res = [];
		for(var i=0,e=s.length; i<e; ++i) {
			var c = s[i];
			if( c >= 'a' && c <= 'z' ) { res.push(c); }
			else if( c >= 'A' && c <= 'Z' ) { res.push(c); }
			else if( c >= '0' && c <= '9' ) { res.push(c); }
			else {
				var code = c.charCodeAt(0);
				var o0 = (code & 0x07) + 0x30;
				var o1 = ((code >> 3) & 0x07) + 0x30;
				var o2 = ((code >> 6) & 0x07) + 0x30;
				res.push('_');
				res.push( String.fromCharCode(o2) );
				res.push( String.fromCharCode(o1) );
				res.push( String.fromCharCode(o0) );
			};
		};
		return res.join('');
		
	} else if( typeof(s) === 'number' ){
		return ''+s;
		
	} else {
		return '';
	};
};

/**
 * Computes a valid id for a given set of selectors.
 * @param uuid {Integer} Unique identifier of the tree where the 
 *                       id is computed.
 * @param selectors {Array} Object selector
 * @return {String} Identifier that should be used to uniquely identify
 *                  the selected object within a tree.
 */
function computeId(uuid, selectors) {
	var escapedSelectors = [];
	for(var i=0,e=selectors.length;i<e;++i){
		escapedSelectors.push( stringToHtmlId(selectors[i]) );
	};
	var id = 'tree'+uuid+'_'+escapedSelectors.join('_');
	return id;
};

/**
 * Computes a valid class for a given set of selectors.
 * @param selectors {Array} Object selector
 * @return {String} Class name that should be used to uniquely identify
 *                  the selected object within a tree.
 */
function computeClass(selectors) {
	var escapedSelectors = [];
	for(var i=0,e=selectors.length;i<e;++i){
		escapedSelectors.push( stringToHtmlId(selectors[i]) );
	};
	var cName = 'tree_sel_'+escapedSelectors.join('_');
	return cName;
};

/**
 * Generates ids for each li elements given in argument, and sets them
 * accordingly. This functions assumes that all li elements are from the
 * same tree structure.
 * @param $allLis {Object} A jQuery set containing all li elements where
 *                         ids should be generated.
 */
function fixIds($allLis) {
	var uuid = null;
	
	$allLis.each(function(){
		var $li = $(this);
		var selectors = computeSelectors($li);
		if( !uuid ) {
			uuid = getTreeUuid($li);
		};
		
		var id = computeId(uuid, selectors);
		$li.attr('id',id);
	});
}

/**
 * Finds and returns the li elements that is associated with
 * an object selector.
 * @param $tree {Object} A jQuery set that contains the tree root
 * @param selectors {Array} An object selector
 * @return {Object} A jQuery set that contains 0 or 1 element. If an element
 *                  is returned, it is the element associated with the
 *                  given selector.
 */
function findLiFromSelectors($tree, selectors) {
	var uuid = getTreeUuid($tree);
	var id = computeId(uuid, selectors);
	var $li = $tree.find('#'+id);
	return $li;
}

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

/**
 * This functions performs a pretty print of the a given
 * data structure, to a maximum length. It attempts to
 * print in JSON format, however is meant for human consumption.
 * @param data {Object} The data structure to be printed
 * @param maxLen {Integer} The maximum size of the desired string
 * @return {String} A pretty print of the given data structure.
 */
function print(data, maxLen) {
	
	var arr = [];
	innerPrint(data, arr, 0, maxLen);
	return arr.join('');
	
	function innerPrint(data, arr, len, max) {
		if( data === null ) {
			var value = 'null';
			arr.push(value);
			return value.length;
			
		} else if( typeof(data) === 'number' ) {
			var value = ''+data;
			arr.push(value);
			return value.length;

		} else if( typeof(data) === 'string' ) {
			var value = '"'+data+'"';
			arr.push(value);
			return value.length;

		} else if( typeof(data) === 'boolean' ) {
			var value = ''+data;
			arr.push(value);
			return value.length;

		} else if( $n2.isArray(data) ) {
			var myLen = 1;
			arr.push('[');
			for(var i=0,e=data.length; i<e; ++i) {
				if( 0 != i ) {
					arr.push(',');
					++myLen;
				};
				var obj = data[i];
				var innerLen = innerPrint(obj, arr, len+myLen, max);
				myLen += innerLen;
				if( myLen + len >= maxLen ) return myLen;
			}
			arr.push(']');
			++myLen;
			return myLen;
			
		} else if( typeof(data) === 'object' ) {
			var myLen = 1;
			arr.push('{');
			var keys = [];
			for(var key in data) {
				keys.push(key);
			}
			keys.sort();
			for(var i=0,e=keys.length; i<e; ++i) {
				if( 0 != i ) {
					arr.push(',');
					++myLen;
				};
				
				var key = keys[i];
				arr.push(key);
				arr.push(':');
				myLen += key.length + 1;
				
				var obj = data[key];
				var innerLen = innerPrint(obj, arr, len+myLen, max);
				myLen += innerLen;
				if( myLen + len >= maxLen ) return myLen;
			}
			arr.push('}');
			++myLen;
			return myLen;
		}
		
		return 0;
	}
}

/**
 * Creates a pretty print string of the given data
 * according to the options. The returned string is limited
 * to the maximum length specified in the options. If the
 * maximum length is exceeded, the string is truncated and
 * ellipsis are added.
 * @param data {Object} Data structure to be pretty printed
 * @param opt {Object} Options to be used
 * @return {String} String that can be used in <span.treeValue>
 */
function createDisplayFromData(data, opt) {
	var result = {truncated:false};
	var frags = [];
	
	if( opt.valueSeparator ) {
		frags.push(opt.valueSeparator);
	};
	
	var maxLen = opt.valueMaxLen - opt.valueEllipsis.length;
	
	var value = print(data, maxLen);
	if( value.length > maxLen ) {
		value = value.substr(0,maxLen) + opt.valueEllipsis;
		result.truncated = true;
	};
		
	frags.push(value);
	
	result.str = frags.join('');
	
	return result;
};

/**
 * Updates a ul element based on an object.
 * @param o {Object} Data structure used to update the ul element
 * @param selectors {Array} Object selector to identify the data structure
 * @param $ul {Object} A jQuery set that holds the ul element
 * @param opt {Object} Options in use
 * @param ancestors {Array} Objects that are ancestors of the current data structure.
 * This is used to detect cyclic strctures.
 */
function refreshUlFromObject(o, selectors, $ul, opt, ancestors) {
	//$n2.log('refreshUlFromObject',o, selectors, $ul, opt, ancestors);

	var uuid = getTreeUuid($ul);

	// Remove all elements that are no longer in object (in case object has shrunk)
	$ul.children('li').each(function(i,elem){
		if( $(this).hasClass('treeEditAdd') ) {
			// Skip li added by editor
		} else {
			var key = this['treeObjectKey'];
			if( null == key ) {
				$(this).remove();
			} else if( typeof(o[key]) === 'undefined' ) {
				$(this).remove();
			};
		};
	});
	
	var keys = [];
	for(var key in o) {
		keys.push(key);
	};
	keys.sort();

	for(var i=0,e=keys.length; i<e; ++i) {
		var key = keys[i];
		var value = o[key];
		
		if( ancestors.indexOf(value) >= 0 ){
			// This value is cyclic. Skip
		} else {
			selectors.push(key);
			ancestors.push(value);
			
			var id = computeId(uuid, selectors);
			var cName = computeClass(selectors);
			
			// Find li corresponding to key
			var $li = $ul.children('#'+id);
			if( $li.length < 1 ) {
				$li = $('<li>')
					.attr('id',id)
					.addClass('tree_sel '+cName);
				$('<span>')
					.addClass('treeKey')
					.text(key)
					.appendTo($li);
				$li[0]['treeObjectKey'] = key;
				$ul.append($li);
			};
			
			refreshLiFromData(value, selectors, $li, opt, ancestors);
			
			ancestors.pop();
			selectors.pop();
		};
	};
};

/**
 * Updates a ul element based on an array.
 * @param arr {Array} Array used to update the ul element
 * @param selectors {Array} Object selector to identify the array
 * @param $ul {Object} A jQuery set that holds the ul element
 * @param opt {Object} Options in use
 * 
 */
function refreshUlFromArray(arr, selectors, $ul, opt, ancestors) {
	//$n2.log('refreshUlFromArray',arr, selectors, $ul, opt, ancestors);	

	var uuid = getTreeUuid($ul);

	// Remove all elements that are no longer in array (in case array has shrunk)
	$ul.children('li').each(function(i,elem){
		if( $(this).hasClass('treeEditAdd') ) {
			// Skip li added by editor
		} else {
			var index = this['treeArrayIndex'];
			if( typeof(index) != 'number' ) {
				$(this).remove();
			} else if( index >= arr.length || index < 0 ) {
				$(this).remove();
			};
		};
	});

	for(var key=0,e=arr.length; key<e; ++key) {
		var value = arr[key];
		
		if( ancestors.indexOf(value) >= 0 ){
			// Cyclic structure detected. Skip
		} else {
			selectors.push(key);
			ancestors.push(value);
			
			var id = computeId(uuid, selectors);
			var cName = computeClass(selectors);
			
			// Find li based on id
			var $li = $ul.children('#'+id);
			if( $li.length < 1 ) {
				// Must create
				$li = $('<li>')
					.attr('id',id)
					.addClass('tree_sel '+cName);
				$('<span>')
					.addClass('treeKey')
					.text(key)
					.appendTo($li);
				$li[0]['treeArrayIndex'] = key;
				$ul.append($li);
			};

			refreshLiFromData(value, selectors, $li, opt, ancestors);
			
			ancestors.pop();
			selectors.pop();
		};
	};
};


/**
 * Updates a li element based on an object it represents.
 * @param data {Object} Object represented by li element. This could
 *                      be a scalar (null, string, number) or a
 *                      structure (object, array).
 * @param selectors {Array} Object selector to identify the object
 * @param $li {Object} A jQuery set that holds the li element
 * @param opt {Object} Options in use
 * @param ancestors {Array} Objects that are ancestors of the current data structure.
 * This is used to detect cyclic strctures.
 */
function refreshLiFromData(data, selectors, $li, opt, ancestors) {
	//$n2.log('refreshLiFromData',data, selectors, $li, opt, ancestors);	
	
	// Figure out if we should display a value
	var disp = null;
	if( opt.valueDisplayFn ) {
		disp = opt.valueDisplayFn(data, opt);
	};

	// Show value, if desired
	var $valueSpan = $li.children('span.treeValue');
	if( disp ) {
		if( $valueSpan.length > 0 ) {
			$valueSpan.text(disp.str);
		} else {
			$valueSpan = $('<span class="treeValue"></span>');
			$valueSpan.text(disp.str);
			var $keySpan = $li.children('.treeKey');
			$valueSpan.insertAfter($keySpan);
		};
	} else {
		// Values should not be displayed. If one is
		// already there (not likely), remove it.
		$valueSpan.remove();
	};
	
	// Select what to do based on type of data
	if( data === null ) {
		var $childrenElem = $li.children('.treeChildren');
		$childrenElem.remove();
		
	} else if( typeof(data) === 'string' ) {
		$li.children('.treeChildren').remove();
		if( disp ) {
			if( disp.truncated ) {
				// Display truncated in span.treeValue. Add child to see whole content
				var ul = $('<div class="treeChildren"></div>');
				ul.text(data);
				$li.append(ul);
			};
		};
		
	} else if( typeof(data) === 'number'
	 || typeof(data) === 'boolean' ) {
		$li.children('.treeChildren').remove();
		if( disp ) {
			if( disp.truncated ) {
				// Display truncated in span.treeValue. Add child to see whole content
				var ul = $('<div class="treeChildren">'+data+'</div>');
				$li.append(ul);
			};
		};

	} else if( $n2.isArray(data) ) {
		// Find ul that holds children
		var $ul = $li.children('.treeChildren');
		if( $ul.length > 0 ) {
			// Check that it is a ul tag
			if( $ul[0].nodeName.toLowerCase() !== 'ul' ) {
				$ul.remove();
				$ul = null;
			};
		};
		if( !$ul || $ul.length < 1 ) {
			// Add one
			$ul = $('<ul class="treeChildren"></ul>');
			$li.append($ul);
		};
		
		refreshUlFromArray(data, selectors, $ul, opt, ancestors);

	} else if( typeof(data) === 'object' ) {
		// object
		// Find ul that holds children
		var $ul = $li.children('.treeChildren');
		if( $ul.length > 0 ) {
			// Check that it is a ul tag
			if( $ul[0].nodeName.toLowerCase() !== 'ul' ) {
				$ul.remove();
				$ul = null;
			};
		};
		if( !$ul || $ul.length < 1 ) {
			// Add one
			$ul = $('<ul class="treeChildren"></ul>');
			$li.append($ul);
		};

		refreshUlFromObject(data, selectors, $ul, opt, ancestors);
		
	} else {
		// This is not a handled type (function?). Remove children,
		// if any
		$li.children('.treeChildren').remove();
	};
};

var createFromObjDefaultOptions = {
	valueDisplayFn: createDisplayFromData
	,valueSeparator: ' : '
	,valueEllipsis: '...'
	,valueMaxLen: 30
};

/**
	Creates a tree from the structure of an object. The
	generated tree reflects the keys and values found
	in the object.
	@name createTreeFromObject
	@function
	@memberOf nunaliit2.tree
	@param {Object} $treeContainer A jQuery object that contains
		the element that should receive the tree.
	@param {Object} o The javascript object which is source to the
		tree.
	@param {Object} opt Options for generating the tree
*/
function createTreeFromObject($treeContainer, o, opt) {

	$treeContainer.empty();
	var $tree = $('<ul class="tree"></ul>')
		.appendTo($treeContainer);
	
	tree_init($tree,opt);
	
	var selectors = [];

	refreshUlFromObject(o,selectors,$tree,opt,[]);
	tree_refresh($tree,opt);
	
	return $tree;
	
};

/**
 * Given an existing object tree and its associated
 * object, updates the tree to reflect changes that
 * occurred in the object.
 * @param $tree {Object} A jQuery set that holds the root
 *                       of the tree.
 * @param o {Object} Javascript object that should be used
 *                   to update the tree structure
 * @param opt {Object} Options to be used
 */
function refreshTreeFromObject($tree, o, opt) {

	var selectors = [];

	refreshUlFromObject(o,selectors,$tree,opt,[]);
	tree_refresh($tree,opt);
	
	return $tree;
};

var ObjectTree = $n2.Class({
	treeId: null
	
	,options: null
	
	,obj: null
	
	,initialize: function($treeContainer, obj, opt_){
		this.options = $.extend(
			{}
			,treeDefaultOptions
			,createFromObjDefaultOptions
			,opt_
			);
		
		this.obj = obj;

		if( this.obj ) {
			var $tree = createTreeFromObject($treeContainer, this.obj, this.options);
	
			// Do not hold on to the tree directly
			this.treeId = getTreeId($tree);
		} else {
			// This is the case when an instance of ObjectTree is built based
			// on an existing DOM strucure, not from an object.
			this.treeId = $treeContainer.find('ul.tree').attr('id');
		};
	}

	,getRoot: function() {
		var $tree = $('#'+this.treeId);
		
		if( $tree.length != 1 ) {
			$n2.log('ObjectTree.getRoot(): id not found: '+this.treeId);
			return null;
		};
		
		return $tree;
	}

	,getId: function() {
		return this.treeId;
	}

	,getObject: function() {
		return this.obj;
	}
	
	,refresh: function() {
		var $tree = this.getRoot();
		if( $tree ) {
			refreshTreeFromObject($tree, this.obj, this.options);
		};
	}
	
	,findLiFromSelectors: function(selectors){
		var $tree = this.getRoot();
		if( $tree ) {
			return findLiFromSelectors($tree, selectors);
		} else {
			return null;
		};
	}
});

/*
 * 
OBJECT EDITOR

This portion of the script deals with an object editor based on
an object tree. The concept is to reuse the navigation provided by an
object tree, augmenting it with the proper tools to perform editing.

An editor holds on to a pointer to the DOM structure, therefore it must
be destroyed prior to being released. (see destroy())

The modifications to the object tree made by an object editor are as follows:
- binds 'click' event to span.treeValue and div.treeChildren to initiate
  the editing of a value
- binds 'click' event to span.treeKey to initiate the editing of an object key.
  This overrides the click installed by the basic tree.
- adds a <div class="treeEditDelete"/> to each li. Binds a 'click' event to
  it to initiate a key deletion
- adds <div class="treeEditUp"/> and <div class="treeEditDown"/> at each li element
  that represent an index inside an array. Binds 'click' event to them to
  initiate moving indices up and down the array.
- installs a <li class="treeEditAdd"><div></div></li> at the end of each ul. Binds
  a 'click' event to the div element to initiate adding a key to an object or
  growing an array.
  
Classes added by editor:
- treeEditingValue : Assigned to li element where the a value is being edited.
- treeEditingKey : Assigned to li element where a key is being edited.
- treeKeyEditor : Class assigned to portion of the tree used to edit a key.
- treeValueEditor : Class assigned to portion of the tree used to edit a value.
- treeEditorClickInstalled : Class assigned to all elements that have received 
                             a 'click' event from the editor
                             
- treeEditUp : Assigned to div elements that are buttons to initiate an index swap with previouss
- treeEditDown : Assigned to div elements that are buttons to initiate an index swap with next
- treeEditAdd : Assigned to li element that contains a <div/> to add a key to an object 
                or array
- treeEditDelete : Assigned to div elements that are buttons to delete a key from an
                   object or array.
- treeEditOk : Assigned to div elements that are buttons to accept an edit
- treeEditCancel : Assigned to div elements that are buttons to reject an edit


Usage:

	<div id="container"></div>
	
	var obj = {...};
	
	var objectTree = new $n2.tree.ObjectTree($('#container'), obj, options);

	... when ready to edit
	
	var editor = new $n2.tree.ObjectTreeEditor(objectTree, obj, options);
	
	... when done editing
	
	editor.destroy();
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
	cbAddKeyToObject(selectors, key, null);
}

function defaultGetDeleteConfirmation(cbDeleteKey, obj, selectors) {
	if( confirm( _loc('Do you wish to delete this element?') ) ) {
		cbDeleteKey(); // yes
	};
}

function defaultGetAbortConfirmation(actionFn) {
	if( confirm( _loc('This object is being modified. Do you wish to continue and revert current changes?') ) ) {
		actionFn();
	};
}

var createEditorDefaultOptions = {
	onObjectChanged: function(obj){}
	,beforeValueChanged: function(obj, selectors, data){}
	,afterValueChanged: function(obj, selectors, data){}
	,beforeKeyChanged: function(obj, selectors, fromKey, toKey){}
	,afterKeyChanged: function(obj, selectors, fromKey, toKey){}
	,beforeKeyAdded: function(obj, selectors, key){}
	,afterKeyAdded: function(obj, selectors, key){}
	,beforeKeyDeleted: function(obj, selectors){}
	,afterKeyDeleted: function(obj, selectors){}
	,beforeIndexSwap: function(obj, selectors, index){}
	,afterIndexSwap: function(obj, selectors, index){}
	,createNewKey: defaultCreateNewKey
	,getDeleteConfirmation: defaultGetDeleteConfirmation
	,getAbortConfirmation: defaultGetAbortConfirmation
	,isKeyEditingAllowed: function(obj, selectors, data){ return true; }
	,isValueEditingAllowed: function(obj, selectors, data){ return true; }
	,isKeyDeletionAllowed: function(obj, selectors, data){ return true; }
};

var ObjectTreeEditor = $n2.Class({
	
	$tree: null
	
	,obj: null
	
	,options: null
	
	,initialize: function($tree, obj, opt_) {
		if( !$tree ) {
			$n2.log('ObjectTreeEditor.initialize(): null tree');
		};
		if( $tree.getRoot ) {
			$tree = $tree.getRoot();
			if( !$tree ) {
				$n2.log('ObjectTreeEditor.initialize(): null root');
			};
		};
		
		this.options = $.extend(
				{}
				,treeDefaultOptions
				,createFromObjDefaultOptions
				,createEditorDefaultOptions
				,opt_
			);

		this.$tree = $tree;

		this.obj = obj;
		
		this._installEditors();
	}

	/**
	 * This function must be called before an editor can be disposed of.
	 */
	,destroy: function() {
		this._removeEditors();

		this.$tree = null;
		this.obj = null;
		this.options = null;
	}
	
	,getRoot: function() {
		return this.$tree;
	}

	,getId: function() {
		return getTreeId(this.$tree);
	}
	
	,getObject: function() {
		return this.obj;
	}

	,refresh: function(selectors) {
		if( null == selectors || selectors.length < 1 ) {
			// Refresh everything
			refreshUlFromObject(this.obj, [], this.$tree, this.options, []);
			
		} else {
			var data = findDataFromObject(this.obj, selectors);
			var $li = findLiFromSelectors(this.$tree, selectors);
			
			refreshLiFromData(data, selectors, $li, this.options, []);
		};
		
		this._installEditors();
		tree_refresh(this.$tree,this.options);
	}
	
	,isEditing: function() {
		if( this.$tree.find('.treeEditingValue').length > 0 ) {
			return true;
		};
		if( this.$tree.find('.treeEditingKey').length > 0 ) {
			return true;
		};
		return false;
	}
	
	,cancelEditing: function() {
		this.$tree.find('.treeEditingValue').removeClass('treeEditingValue');
		this.$tree.find('.treeEditingKey').removeClass('treeEditingKey');
		this.$tree.find('.treeValueEditor').remove();
		this.$tree.find('.treeKeyEditor').remove();
	}
	
	,_installEditors: function() {
		var editor = this;

		var $allLiElems = this.$tree.find('li');
		$allLiElems.each(function(i,liElem){
			var $li = $(this);
			
			// Skipped li nodes that are to edit tree
			if( false == $li.hasClass('treeEditAdd') ) {
				var selectors = computeSelectors($li);
				var data = findDataFromObject(editor.obj, selectors);
				var isKeyEditingPermitted = editor.options.isKeyEditingAllowed(editor.obj, selectors, data);
				var isValueEditingPermitted = editor.options.isValueEditingAllowed(editor.obj, selectors, data);
				var isKeyDeletionPermitted = editor.options.isKeyDeletionAllowed(editor.obj, selectors, data);
				
				// In case a scalar is truncated, install editing from
				// div child
				var $divChild = $li.children('div.treeChildren');
				if( $divChild.length > 0
				 && isValueEditingPermitted
				 && false == $divChild.hasClass('treeEditorClickInstalled') ) {
					$divChild.click(function(){editor._initiateValueEdit(this);});
					$divChild.addClass('treeEditorClickInstalled');
				};
	
				// Add edit click to object keys
				if( liElem['treeObjectKey'] ) {
					var $key = $li.children('span.treeKey');
					if( $key.length > 0
					 && isKeyEditingPermitted
					 && false == $key.hasClass('treeEditorClickInstalled') ) {
						$key.unbind('click');
						$key.click(function(){editor._initiateKeyEdit(this);});
						$key.addClass('treeEditorClickInstalled');
					};
				};
	
				// Add edit click to value area
				var $value = $li.children('span.treeValue');
				if( $value.length > 0 
				 && isValueEditingPermitted
				 && false == $value.hasClass('treeEditorClickInstalled') ) {
					$value.click(function(){editor._initiateValueEdit(this);});
					$value.addClass('treeEditorClickInstalled');
				};
				
				// Delete button
				var $delBtn = $li.children('.treeEditDelete');
				if( $delBtn.length < 1 
				 && isKeyDeletionPermitted ) {
					$delBtn = $('<div class="treeEditDelete treeEditorClickInstalled"></div>');
					$value.after($delBtn);
					$delBtn.click(function(){editor._initiateDeleteKey(this);});
				};
	
				// Add edit up/down to array keys
				if( typeof(liElem['treeArrayIndex']) === 'number' ) {
					var $dnBtn = $li.children('.treeEditDown');
					if( $dnBtn.length < 1 ) {
						$dnBtn = $('<div class="treeEditDown treeEditorClickInstalled"></div>');
						$value.after($dnBtn);
						$dnBtn.click(function(){editor._initiateSwapKeys(this,1);});
					};
	
					var $upBtn = $li.children('.treeEditUp');
					if( $upBtn.length < 1 ) {
						$upBtn = $('<div class="treeEditUp treeEditorClickInstalled"></div>');
						$value.after($upBtn);
						$upBtn.click(function(){editor._initiateSwapKeys(this,-1);});
					};
				};
			};
		});
		
		// Add key button
		this.$tree.each(installAddButton);
		this.$tree.find('ul').each(installAddButton);
		
		function installAddButton() {
			var $ul = $(this);
			
			var $li = $ul.children('li.treeEditAdd');
			$li.remove();

			// Reinstall
			$li = $('<li class="treeEditAdd"></li>');
			var $addBtn = $('<div><div/>');
			$addBtn.click(function(){ editor._initiateAddKey(this); });
			$li.append($addBtn);
			
			$ul.append($li);
		};
	}
	
	,_removeEditors: function() {
		this.cancelEditing();

		this.$tree.find('li.treeEditAdd').remove();
		this.$tree.find('.treeEditorClickInstalled')
			.unbind('click')
			.removeClass('treeEditorClickInstalled')
			.removeClass('treeClickInstalled') // allow tree to reinstall click events
			;
		this.$tree.find('.treeEditDelete').remove();
		this.$tree.find('.treeEditUp').remove();
		this.$tree.find('.treeEditDown').remove();

		// Reinstall binding on object keys
		tree_refresh(this.$tree,this.options);
	}
	
	/**
	 * Verifies if editing is being performed. If so, ask the
	 * user if it is OK to cancel editing before continuing.
	 * Perform action if it is OK to continue editing. Simply
	 * return if editing operation should be aborted.
	 */
	,_continueWithEditing: function(actionFn) {
		if( false == this.isEditing() ) {
			actionFn();
		} else {
			var editor = this;
			this.options.getAbortConfirmation(function(){
				editor.cancelEditing();
				actionFn();
			});
		};
	}
	
	,_initiateValueEdit: function(spanValueElem) {
		var editor = this;
		this._continueWithEditing(function(){
			editor._startValueEdit(spanValueElem);
		});
	}
	
	,_startValueEdit: function(spanValueElem) {
		var editor = this;
		
		var $li = findLiFromElement(spanValueElem);
		$li.addClass('treeEditingValue');
		var selectors = computeSelectors($li);
		var data = findDataFromObject(this.obj, selectors);
		var json = JSON.stringify(data);

		// Add editDiv
		var $editDiv = $li.children('div.treeValueEditor');
		if( $editDiv.length < 1 ) {
			$editDiv = $('<div class="treeValueEditor"><br/></div>');

			// Position after delete button
			var $delBtn = $li.children('.treeEditDelete');
			$delBtn.after($editDiv);
			
			var $textArea = $('<textarea></textarea>');
			$editDiv.prepend($textArea);
			
			$textArea.keydown(function(evt){editor._valueEditKeyDown(evt,this);});
			
			var $okButton = $('<input type="button" value="OK"/>');
			$editDiv.append($okButton);
			$okButton.click(function(){editor._acceptValueEdit(this);});
			
			var $cancelButton = $('<input type="button" value="Cancel"/>');
			$editDiv.append($cancelButton);
			$cancelButton.click(function(){editor.cancelEditing();});
		};

		// Set data
		$li.children('.treeValueEditor').find('textarea').val(json).focus();
	}

	,_acceptValueEdit: function(okButton) {
		var $li = findLiFromElement(okButton);
		var selectors = computeSelectors($li);
		var json = $li.children('.treeValueEditor').find('textarea').val();
		
		try {
			var data = JSON.parse(json);
		} catch( e ) {
			$n2.log('JSON error',e);
			alert( _loc('Unable to parse JSON string: ')+e);
			return;
		}
		
		$li.removeClass('treeEditingValue');
		this._beforeValueChanged(selectors, data);
		setObjectData(this.obj, selectors, data);
		this._afterValueChanged(selectors, data);
		
		this.cancelEditing();
		this.refresh();
	}
	
	,_valueEditKeyDown: function(evt, textarea) {
		//$n2.log('_valueEditKeyDown', evt, textarea);
		
		if( evt && evt.keyCode == 13 ) {
			// Enter was pressed
			this._acceptValueEdit(textarea);
		} else if( evt && evt.keyCode == 27 ) {
			// Escape was pressed
			this.cancelEditing();
		};
	}

	,_initiateAddKey: function(addButton) {
		var editor = this;
		this._continueWithEditing(function(){
			editor._startAddKey(addButton);
		});
	}

	,_startAddKey: function(addButton) {
		var editor = this;
		
		var $ul = $(addButton).parents('ul').first();
		if( $ul.length != 1 ) return;
		
		if( $ul[0].treeUuid ) {
			// Root
			var data = this.obj;
			var selectors = [];
		} else {
			var $li = findLiFromElement($ul);
			var selectors = computeSelectors($li);
			var data = findDataFromObject(this.obj, selectors);
		};

		// Add a key
		if( null == data ) {
			// Nothing to do. The object was probably modified
			// and we have lost the opportunity to add a key
			this.refresh();
			
		} else if( $n2.isArray(data) ) {
			var index = data.length;
			this._beforeKeyAdded(selectors, index);
			data.push(null);
			this._afterKeyAdded(selectors, index);
			this.refresh();
			
		} else if( typeof(data) === 'object' ) {
			this.options.createNewKey(cbAddKeyToObject, this.obj, selectors, data);
		};

		function cbAddKeyToObject(selectors, newKey, newData) {
			editor._acceptNewObjectKey(selectors, newKey, newData);
		};
	}
	
	,_acceptNewObjectKey: function(selectors, newKey, newData) {
		var data = findDataFromObject(this.obj, selectors);
		if( data ) {
			this._beforeKeyAdded(selectors, newKey);
			data[newKey] = newData;
			this._afterKeyAdded(selectors, newKey);
			this.refresh();
		};
	}

	,_initiateDeleteKey: function(deleteButton) {
		var editor = this;
		this._continueWithEditing(function(){
			editor._startDeleteKey(deleteButton);
		});
	}

	,_startDeleteKey: function(deleteButton) {
		var $li = findLiFromElement(deleteButton);

		var editor = this;
		var selectors = computeSelectors($li);
		function cbDeleteKey() {
			editor._acceptDeleteKey(selectors);
		};
		this.options.getDeleteConfirmation(cbDeleteKey, this.obj, selectors);
	}

	,_acceptDeleteKey: function(selectors) {
		this._beforeKeyDeleted(selectors);
		deleteObjectData(this.obj, selectors);			
		this._afterKeyDeleted(selectors);
		this.refresh();
	}

	,_initiateSwapKeys: function(btn,direction) {
		var editor = this;
		this._continueWithEditing(function(){
			editor._acceptSwapKeys(btn,direction);
		});
	}
	
	,_acceptSwapKeys: function(btn,direction) {
		var editor = this;
		
		var $li = findLiFromElement(btn);
		var selectors = computeSelectors($li);
		var key = 1 * selectors.pop();
		var arr = findDataFromObject(this.obj, selectors);
		
		var swapKey = key + direction;
		if( swapKey < 0 ) {
			// Nothing to do
			return;
		} else if( swapKey >= arr.length ) {
			// Nothing to do
			return;
		};
		
		var uuid = getTreeUuid($li);
		
		// Callback before
		if( direction < 0 ) {
			this._beforeIndexSwap(selectors, swapKey);
		} else {
			this._beforeIndexSwap(selectors, key);
		};

		// Swap with previous entry
		var $swapLi = $('#tree'+uuid+'_'+selectors.join('_')+'_'+swapKey);
		if( $swapLi.length == 1 ) {
			// Change the elements around
			if( direction < 0 ) {
				$li.after($swapLi);
			} else {
				$swapLi.after($li);
			};
			
			// Fix keys
			$li.children('span.treeKey').empty().text(swapKey);
			$swapLi.children('span.treeKey').empty().text(key);
			
			// Fix indices
			$li[0]['treeArrayIndex'] = swapKey;
			$swapLi[0]['treeArrayIndex'] = key;
			
			// Fix ids...
			var $swapElems = $swapLi.find('span.treeKey').parent();
			$swapElems.removeAttr('id');
			fixIds( $li.find('span.treeKey').parent() );
			fixIds( $swapElems );
			
			// Change array
			var tmp = arr[key];
			arr[key] = arr[swapKey];
			arr[swapKey] = tmp;
		};
		
		// Callback after
		if( direction < 0 ) {
			this._afterIndexSwap(selectors, swapKey);
		} else {
			this._afterIndexSwap(selectors, key);
		};
	}

	,_initiateKeyEdit: function(spanKeyElem) {
		var editor = this;
		this._continueWithEditing(function(){
			editor._startKeyEdit(spanKeyElem);
		});
	}

	,_startKeyEdit: function(spanKeyElem) {
		var editor = this;
		
		var $li = findLiFromElement(spanKeyElem);
		$li.addClass('treeEditingKey');
		var selectors = computeSelectors($li);
		var key = selectors.pop();
		var data = findDataFromObject(this.obj, selectors);
		$n2.log('Key editing',key,data,selectors);
		
		var $keySpan = $li.children('span.treeKey');

		var $keyEditor = $('<span class="treeKeyEditor"></span>');
		var $textInput = $('<input class="treeEditorKeyInput" type="text"/>');
		$textInput.val(key);
		$keyEditor.append($textInput);
		
		$textInput.keydown(function(evt){editor._keyEditKeyDown(evt, this);});
		
		var $ok = $('<div class="treeEditOk"></div>');
		$keyEditor.append($ok);
		$ok.click(function(){editor._acceptKeyEdit(this);});
		
		var $cancel = $('<div class="treeEditCancel"></div>');
		$keyEditor.append($cancel);
		$cancel.click(function(){editor.cancelEditing();});
		
		$keySpan.after($keyEditor);
		
		$textInput.focus();
	}

	,_acceptKeyEdit: function(okButton) {
		var $li = findLiFromElement(okButton);
		var selectors = computeSelectors($li);

		var currentKey = selectors.pop();
		var data = findDataFromObject(this.obj, selectors);
		
		var modifiedKey = $li.children('.treeKeyEditor').find('input').val();
		
		// Verify key
		try {
			JSON.parse('{"'+modifiedKey+'":0}');
		} catch( e ) {
			$n2.log('parsing error',e);
			alert( _loc('Unable to parse key: ')+e);
			return;
		}
		
		// If same key, then nothing to do
		if( modifiedKey === currentKey ) {
			this.cancelEditing();
			return;
		};
		
		// Verify that key is not already in use
		if( data[modifiedKey] !== undefined ) {
			alert( _loc('Key already in use: ')+modifiedKey);
			return;
		};
		
		// At this point, we accept the key modification.
		this._beforeKeyChanged(selectors, currentKey, modifiedKey);
		data[modifiedKey] = data[currentKey];
		delete data[currentKey];
		this._afterKeyChanged(selectors, currentKey, modifiedKey);
		
		// Fix $li
		selectors.push(modifiedKey);
		$li.children('span.treeKey').empty().text(modifiedKey);
		$li[0]['treeObjectKey'] = modifiedKey;
		
		// Fix all ids, including children elements
		fixIds($li.find('span.treeKey').parent());
		
		this.cancelEditing();
		this.refresh();
	}
	
	,_keyEditKeyDown: function(evt, input) {
		//$n2.log('_valueEditKeyDown', evt, textarea);
		
		if( evt && evt.keyCode == 13 ) {
			// Enter was pressed
			this._acceptKeyEdit(input);
		} else if( evt && evt.keyCode == 27 ) {
			// Escape was pressed
			this.cancelEditing();
		};
	}
	
	,_beforeValueChanged: function(selectors, data) {
		this.options.beforeValueChanged(this.obj, selectors, data);
	}
	
	,_afterValueChanged: function(selectors, data) {
		this.options.afterValueChanged(this.obj, selectors, data);
		this.options.onObjectChanged(this.obj);
	}
	
	,_beforeKeyChanged: function(selectors, fromKey, toKey) {
		this.options.beforeKeyChanged(this.obj, selectors, fromKey, toKey);
	}
	
	,_afterKeyChanged: function(selectors, fromKey, toKey) {
		this.options.afterKeyChanged(this.obj, selectors, fromKey, toKey);
		this.options.onObjectChanged(this.obj);
	}
	
	,_beforeKeyAdded: function(selectors, key) {
		this.options.beforeKeyAdded(this.obj, selectors, key);
	}
	
	,_afterKeyAdded: function(selectors, key) {
		this.options.afterKeyAdded(this.obj, selectors, key);
		this.options.onObjectChanged(this.obj);
	}
	
	,_beforeKeyDeleted: function(selectors) {
		this.options.beforeKeyDeleted(this.obj, selectors);
	}
	
	,_afterKeyDeleted: function(selectors) {
		this.options.afterKeyDeleted(this.obj, selectors);
		this.options.onObjectChanged(this.obj);
	}
	
	,_beforeIndexSwap: function(selectors, index) {
		this.options.beforeIndexSwap(this.obj, selectors, index);
	}
	
	,_afterIndexSwap: function(selectors, index) {
		this.options.afterIndexSwap(this.obj, selectors, index);
		this.options.onObjectChanged(this.obj);
	}
});

$n2.tree = {
	Tree: Tree
	,ObjectTree: ObjectTree
	,ObjectTreeEditor: ObjectTreeEditor
	,support: {
		findDataFromObject: findDataFromObject
		,setObjectData: setObjectData
		,deleteObjectData: deleteObjectData
	}
};
	
})(jQuery,nunaliit2);
