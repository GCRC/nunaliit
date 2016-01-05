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

	
// =====================================
// Object
	
function setDataFromObjectSelector(o, selectors, value) {
	if( typeof(selectors) === 'string' ) {
		selectors = selectors.split('.');
	}
	return setDataOnObject(o, selectors, 0, value);
};

function setDataOnObject(o, selectors, selectorIndex, value) {
	if( selectorIndex >= selectors.length ) {
		return false;
	};
	
	// This is an error. There are more
	// selectors in the array but we have
	// a scalar. Return an error.
	if( null == o
	 || typeof(o) === 'number' 
	 || typeof(o) === 'string'
	 || typeof(o) === 'undefined'
	 || typeof(o) === 'function' ) {
		return false;
	};

	if( selectorIndex == (selectors.length-1) ) {
		// Set
		if( $n2.isArray(o) ) {
			var index = 1 * selectors[selectorIndex];
			if( index >= o.length ) {
				return false;
			};
			o[index] = value;
			return true;
		}

		if( typeof(o) === 'object' ) {
			var key = selectors[selectorIndex];
			o[key] = value;
			return true;
		};
		
		// Should not get here
		return false;
	};
	
	if( $n2.isArray(o) ) {
		var index = 1 * selectors[selectorIndex];
		if( index >= o.length ) {
			return false;
		};
		return setDataOnObject(o[index], selectors, (selectorIndex+1), value);
	}

	if( typeof(o) === 'object' ) {
		var key = selectors[selectorIndex];
		var obj = o[key];
		if( obj === undefined ) {
			return false;
		};
		return setDataOnObject(obj, selectors, (selectorIndex+1), value);
	};
	
	// Should not get here. Error. Return null.
	return false;
};

function getDataFromObjectSelector(o, selectors) {
	if( typeof(selectors) === 'string' ) {
		selectors = selectors.split('.');
	}
	return findDataFromObject(o, selectors, 0);
};

function findDataFromObject(o, selectors, selectorIndex) {
	if( selectorIndex >= selectors.length ) {
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
		var index = 1 * selectors[selectorIndex];
		if( index >= o.length ) {
			return null;
		};
		return findDataFromObject(o[index], selectors, (selectorIndex+1));
	}

	if( typeof(o) === 'object' ) {
		var key = selectors[selectorIndex];
		var value = o[key];
		if( value === undefined ) {
			return null;
		};
		return findDataFromObject(value, selectors, (selectorIndex+1));
	};
	
	// Should not get here. Error. Return null.
	return null;
};
	
// =====================================
// Schema

var FormAttribute = $n2.Class({
	
	defaultValue: null
	
	,name: null

	,label: null
	
	,selector: null

	,type: 'text'
		
	,className: null
	
	,options: null
	
	,initialize: function(schema) {
		$.extend(this,schema);
		
		if( null == this.label ) {
			this.label = this.name;
		}
		
		if( null == this.selector ) {
			this.selector = this.name;
		}
	}
	
	,isHidden: function() {
		return (this.type === 'hidden');
	}
	
});

var FormButton = $n2.Class({
	
	name: null

	,label: null
	
	,initialize: function(name, label) {
		this.name = name;
		this.label = label;
	}
});

/*
Accepts a schema that looks like:
	{
		"title": "First Schema"
		,"attributes": [
			{
				"name" : "name"
				,"label": "Name"
				,"type" : "text"
				,"className": "inputClass"
				,"description": "The name of the entity"
			}
			,{
				"name" : "hideMe"
				,"type" : "hidden"
				,"description": "A hidden input"
			}
			,{
				"name" : "aSelection"
				,"type" : "select"
				,"options" : ["option1", "option2"]
				,"description": "An option selector"
			}
			,{
				"name" : "aDate"
				,"type" : "date"
				,"datePicker": {} // options for datePicker
				,"description": "A date selector"
			}
		]
		,"buttons": [
			{
				"name" : "testButton"
				,"label" : "Test"
			}
		]
	}
*/
var FormSchema = $n2.Class({
	
	attributes: []
	
	,title: ''
	
	,okButton: false

	,okButtonLabel: _loc('OK')
	
	,cancelButton: false
	
	,cancelButtonLabel: _loc('Cancel')
	
	,resetButton: false
	
	,resetButtonLabel: _loc('Reset')
	
	,buttons: null
	
	,initialize: function(schema) {
		if( schema.title ) this.title = schema.title;
		if( schema.okButton ) this.okButton = schema.okButton;
		if( schema.okButtonLabel ) this.okButtonLabel = schema.okButtonLabel;
		if( schema.cancelButton ) this.cancelButton = schema.cancelButton;
		if( schema.cancelButtonLabel ) this.cancelButtonLabel = schema.cancelButtonLabel;
		if( schema.resetButton ) this.resetButton = schema.resetButton;
		if( schema.resetButtonLabel ) this.resetButtonLabel = schema.resetButtonLabel;
		
		if( schema.attributes ) {
			this.attributes = [];
			for(var i=0, e=schema.attributes.length; i<e; ++i) {
				var a = schema.attributes[i];
				
				this.attributes.push( new FormAttribute(a) );
			};
		};
		
		if( schema.buttons ) {
			this.buttons = [];
			for(var i=0, e=schema.buttons.length; i<e; ++i) {
				var b = schema.buttons[i];
				
				this.buttons.push( new FormButton(b.name,b.label) );
			};
		};
	}

	,createForm: function(
		jQuerySet
		,data
		,options_
		) {
		return new Form(this, jQuerySet, data, options_);
	}
	
	,getTitle: function() {
		if( this.formSchema && this.formSchema.title ) {
			return this.formSchema.title;
		};
		
		return null;
	}
	
});

// =====================================
// Input Form

var FormInput = $n2.Class({
	
	uniqueId: null
	
	,attribute: null
	
	,jQuerySet: null
	
	,data: null
	
	,input: null
	
	,initialValue: null

	,onChanged: null
	
	,initialize: function(
		uniqueId
		,attribute
		,data
		,jQuerySet
		,onChanged
		) {
		this.uniqueId = uniqueId;
		this.attribute = attribute;
		this.data = data;
		this.jQuerySet = jQuerySet;
		this.onChanged = onChanged;
		
		this.render();
	}
	
	,render: function() {
		var attr = this.attribute;
		
		var inputHtml = [];
		if( 'select' == attr.type ) {
			inputHtml.push('<select id="');
			inputHtml.push(this.uniqueId);
			if( attr.name ) {
				inputHtml.push('" name="');
				inputHtml.push(attr.name);
			}
			if( attr.className ) {
				inputHtml.push('" class="');
				inputHtml.push(attr.className);
			}
			inputHtml.push('">');
			
			for(var i=0, e=attr.options.length; i<e; ++i) {
				var opt = attr.options[i];
				if( typeof(opt) === 'string' ) {
					opt = { value: opt };
				};
				var label = opt.label ? opt.label : opt.value;
				inputHtml.push('<option value="');
				inputHtml.push(opt.value);
				inputHtml.push('">');
				inputHtml.push(label);
				inputHtml.push('</option>');
			};

			inputHtml.push('</select>');
			
		} else if( 'date' == attr.type ) {
			inputHtml.push('<input id="');
			inputHtml.push(this.uniqueId);
			inputHtml.push('" type="text');
			if( attr.name ) {
				inputHtml.push('" name="');
				inputHtml.push(attr.name);
			}
			if( attr.className ) {
				inputHtml.push('" class="');
				inputHtml.push(attr.className);
			}
			inputHtml.push('"/>');
			
		} else if( 'file' == attr.type ) {
			inputHtml.push('<input id="');
			inputHtml.push(this.uniqueId);
			inputHtml.push('" type="file');
			if( attr.name ) {
				inputHtml.push('" name="');
				inputHtml.push(attr.name);
			}
			if( attr.className ) {
				inputHtml.push('" class="');
				inputHtml.push(attr.className);
			}
			inputHtml.push('"/>');
			
		} else if( 'textarea' == attr.type ) {
			inputHtml.push('<textarea id="');
			inputHtml.push(this.uniqueId);
			if( attr.name ) {
				inputHtml.push('" name="');
				inputHtml.push(attr.name);
			}
			if( attr.className ) {
				inputHtml.push('" class="');
				inputHtml.push(attr.className);
			}
			inputHtml.push('"></textarea>');
			
		} else if( 'array' == attr.type ) {
			inputHtml.push('<div id="');
			inputHtml.push(this.uniqueId);
			inputHtml.push('"/>');
			
		} else {
			inputHtml.push('<input id="');
			inputHtml.push(this.uniqueId);
			if( attr.type ) {
				inputHtml.push('" type="');
				inputHtml.push(attr.type);
			}
			if( attr.name ) {
				inputHtml.push('" name="');
				inputHtml.push(attr.name);
			}
			if( attr.className ) {
				inputHtml.push('" class="');
				inputHtml.push(attr.className);
			}
			inputHtml.push('"/>');
		};
		
		this.input = $(inputHtml.join(''));
		this.input.change(this.onChanged);

		var initialValue = null;
		if( this.data ) {
			initialValue = this.getData();
		};
		if( null == initialValue && this.attribute.defaultValue ) {
			initialValue = this.attribute.defaultValue;
		};
		if( null == initialValue ) {
			initialValue = '';
		};
		this.input.val(initialValue);
		this.initialValue = initialValue;

		this.jQuerySet.append(this.input);
		
		// Install datepicker, if available
		if( 'date' == attr.type && $.ui && $.ui.datepicker ) {
			var dpOptions = $.extend(
				{
					dateFormat: 'yy-mm-dd'
					,gotoCurrent: true
					,changeYear: true
				}
				,attr.datePicker
			);
			this.input.datepicker(dpOptions);
			
		} else if( 'array' == attr.type ) {
			// Install 
		};
	}
	
	,refreshFromData: function() {
		var v = this.getData();
		if( null == v ) {
			v = '';
		}
		this.setCurrentValue(v);
	}
	
	,getName: function() {
		return this.attribute.name;
	}
	
	,getCurrentValue: function() {
		return this.input.val();
	}
	
	,setCurrentValue: function(value) {
		this.input.val(value);
	}
	
	,resetValue: function() {
		this.input.val( this.initialValue );
	}
	
	,hasValueChanged: function() {
		var current = this.getCurrentValue();
		return ( current != this.initialValue );
	}
	
	,getInputElement: function() {
		return this.input;
	}
	
	,getData: function() {
		return getDataFromObjectSelector(this.data, this.attribute.selector);
	}
	
	,setData: function(value) {
		return setDataFromObjectSelector(this.data, this.attribute.selector, value);
	}
	
	,refreshObject: function() {
		var value = this.getCurrentValue();
		var set = this.setData(value);
	}
});

var stubFunction = function(form){return true;};

var defaultPreCancel = function(form) {
	if( form.hasAnyValueChanged() ) {
		if( !window.confirm('Form has changed. Are you sure you want to cancel?') ) {
			return false;
		}
	}
	
	return true;
};

var defaultPreReset = function(form) {
	if( form.hasAnyValueChanged() ) {
		if( !window.confirm('Form has changed. Are you sure you want to reset it?') ) {
			return false;
		}
	}
	
	return true;
};

var defaultFormOptions = {
	formClass: 'n2Form'
	,preCancel: defaultPreCancel
	,postCancel: stubFunction
	,preReset: defaultPreReset
	,postReset: stubFunction
	,preOK: stubFunction
	,postOK: stubFunction
	,buttonPressed: stubFunction
	,onChanged: stubFunction
	,action: null
	,enctype: null
	,method: null
	,target: null
	,title: null
	,titleClass: null
};

var Form = $n2.Class({
	
	schema: null
	
	,inputs: null
	
	,inputsById: null
	
	,inputsByName: null
	
	,elem: null
	
	,data: null
	
	,form: null
	
	,options: null
	
	,inputChangedCallback: null
	
	,initialize: function(
		schema
		,jQuerySet
		,data
		,options_
		) {
		
		this.options = $.extend(true, {}, defaultFormOptions, options_);
	
		this.schema = schema;
		this.data = data;
		
		// Render on first element of jQuerySet
		this.elem = $( jQuerySet[0] );
		
		this.inputs = [];
		this.inputsByName = {};
		this.inputsById = {};
		
		var _this = this;
		this.inputChangedCallback = function(evt) {
			var $input = $(this);
			var inputId = $input.attr('id');
			_this._inputChanged(inputId);
		};

		this.render();
	}
	
	,render: function() {
		this.elem.empty();
		
		var recv = this;
		
		// Create form element
		var formHtml = [];
		formHtml.push('<form');
		if( this.options.formClass ) {
			formHtml.push(' class="');
			formHtml.push(this.options.formClass);
			formHtml.push('"');
		};
		if( this.options.action ) {
			formHtml.push(' action="');
			formHtml.push(this.options.action);
			formHtml.push('"');
		};
		if( this.options.enctype ) {
			formHtml.push(' enctype="');
			formHtml.push(this.options.enctype);
			formHtml.push('"');
		};
		if( this.options.method ) {
			formHtml.push(' method="');
			formHtml.push(this.options.method);
			formHtml.push('"');
		};
		if( this.options.target ) {
			formHtml.push(' target="');
			formHtml.push(this.options.target);
			formHtml.push('"');
		};
		formHtml.push('></form>');
		var $f = $(formHtml.join(''));
		this.form = $f[0];
		
		if( this.options.title ) {
			var $title = $('<div>'+this.options.title+'</div>');
			if( this.options.titleClass ) {
				$title.addClass(this.options.titleClass);
			};
			$f.append($title);
		};
		
		var $t = $('<table></table>');
		$f.append($t);

		// Format visible inputs in a table
		var formSchema = this.schema;
		for(var i=0,e=formSchema.attributes.length; i<e; ++i) {
			var attr = formSchema.attributes[i];
			
			if( ! attr.isHidden() ) {
				var $r = $('<tr></tr>');
				$t.append($r);
			
				var $d = $('<td>'+attr.label+'</td>');
				$r.append($d);
				
				$d = $('<td></td>');
				$r.append($d);
				
				this._addInput(attr, $d);
			};
		};
		
		// Buttons
		var buttonsPresent = false;
		if( formSchema.resetButton
		 || formSchema.okButton 
		 || formSchema.cancelButton 
		  ) {
		  buttonsPresent = true;
		} else if( formSchema.buttons && formSchema.buttons.length > 0 ) {
		  buttonsPresent = true;
		};
		if( buttonsPresent ) {
			var $r = $('<tr></tr>');
			$t.append($r);
		
			var $d = $('<td></td>');
			$r.append($d);
			
			$d = $('<td></td>');
			$r.append($d);

			if( formSchema.okButton ) {
				var $b = $('<button>'+formSchema.okButtonLabel+'</button>');
				if( $b.button ) {
					$b.button({icons:{primary:'ui-icon-check'}});
				};
				$d.append($b);
				$b.click(function(){
					recv._ok();
					return false;
				});
			};

			if( formSchema.cancelButton ) {
				var $b = $('<button>'+formSchema.cancelButtonLabel+'</button>');
				if( $b.button ) {
					$b.button({icons:{primary:'ui-icon-cancel'}});
				};
				$d.append($b);
				$b.click(function(){
					recv._cancel();
					return false;
				});
			};
			
			if( formSchema.resetButton ) {
				var $rb = $('<button>'+formSchema.resetButtonLabel+'</button>');
				if( $rb.button ) {
					$rb.button({icons:{primary:'ui-icon-arrowrefresh-1-s'}});
				};
				$d.append($rb);
				$rb.click(function(){
					recv._reset();
					return false;
				});
			};
			
			if( formSchema.buttons ) {
				for(var i=0,e=formSchema.buttons.length; i<e; ++i) {
					var button = formSchema.buttons[i];
					var $b = $('<button>'+button.label+'</button>');
					if( $b.button ) {
						$b.button();
					};
					$d.append($b);
					$b.click(createButtonPressedCallback(this, button.name));
				};
			};
		};

		// Add hidden inputs at the end of form
		for(var i=0,e=formSchema.attributes.length; i<e; ++i) {
			var attr = formSchema.attributes[i];
			
			if( attr.isHidden() ) {
				this._addInput(attr, $f);
			};
		};

		this.elem.append($f);
		
		function createButtonPressedCallback(self, name) {
			return function() {
				self._buttonPressed(name);
				return false;
			};
		};
	}
	
	,refreshFromData: function() {
		for(var i=0,e=this.inputs.length; i<e; ++i) {
			this.inputs[i].refreshFromData();
		};
	}
	
	,getInputFromName: function(name) {
		return this.inputsByName[name];
	}
	
	,_addInput: function(attr, $parent) {
		
		var inputUniqueId = $n2.getUniqueId();
		var input = new FormInput(inputUniqueId, attr, this.data, $parent, this.inputChangedCallback);
		this.inputs.push(input);
		
		this.inputsByName[attr.name] = input;
		
		this.inputsById[inputUniqueId] = input;
	}
	
	,_ok: function() {
		var okToProceed = this.options.preOK(this);
		if( okToProceed ) {
			this.form.submit();
			
			this.options.postOK(this);
		};
	}
	
	,_cancel: function() {
		var okToProceed = this.options.preCancel(this);
		if( okToProceed ) {
			this.elem.empty();
			this.form = null;
			this.inputs = [];
			this.inputsbyName = {};
			
			this.options.postCancel(this);
		};
	}
	
	,_reset: function() {
		var okToProceed = this.options.preReset(this);
		if( okToProceed ) {
			for(var i=0,e=this.inputs.length; i<e; ++i) {
				this.inputs[i].resetValue();
			};
			
			this.options.postReset(this);
		};
	}
	
	,_buttonPressed: function(name) {
		this.options.buttonPressed(this, name);
	}
	
	,_inputChanged: function(inputUniqueId) {
		//$n2.log('input changed', inputUniqueId);
		var input = this.inputsById[inputUniqueId];
		input.refreshObject();
		this.options.onChanged();
	}
	
	,getFormElement: function() {
		return this.form;
	}
	
	,getInputElements: function() {
		var result = [];
		for(var i=0,e=this.inputs.length; i<e; ++i) {
			result.push(this.inputs[i].getInputElement());
		};
		return result;
	}
	
	,hasAnyValueChanged: function() {
		for(var i=0,e=this.inputs.length; i<e; ++i) {
			if( this.inputs[i].hasValueChanged() ) return true;
		};
		return false;
	}
});

$n2.form = {
	Schema: FormSchema
	,Form: Form
};

})(jQuery,nunaliit2);