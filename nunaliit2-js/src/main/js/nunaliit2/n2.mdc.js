/*
Copyright (c) 2019, Geomatics and Cartographic Research Centre, Carleton
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

var _loc = function(str,args){
	return $n2.loc(str,'nunaliit2',args);
};

var DH = 'n2.mdc';

// Required library: material design components
var $mdc = window.mdc;
if (!$mdc) {
	return;
}

// Class: MDC
// Description: Generic Material design component which all other material deign components are based off of.
// Options:
//  - parentId (String): The parent element that the component is appended to (Required).
//  - mdcId (String): The id of the element. If none is provided, Nunaliit will generate a unique id.
//  - mdcClasses (Array): Specific classes to added to the component.
//  - mdcAttributes (Object): Unique attributes to be added to the component.
var MDC = $n2.Class('MDC',{

	mdcId: null,
	mdcClasses: null,
	mdcAttributes: null,
	parentId: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			mdcId: null,
			mdcClasses: [],
			mdcAttributes: null,
			parentId: null
		}, opts_);

		this.mdcId = opts.mdcId;
		this.mdcClasses = opts.mdcClasses;
		this.mdcAttributes = opts.mdcAttributes;
		this.parentId = opts.parentId;

		if (!this.parentId) {
			throw new Error('Parent Id must be provided, to add a Material Design Component');
		}

		if (!this.mdcId) {
			this.mdcId = $n2.getUniqueId();
		}
	}
});

// Class MDCButton
// Description: Creates a material design button component
// Options:
//  - btnLabel: Defines the text label on the button.
//  - btnFunction: Defines the function which occurs when the button is clicked.
//  - btnRaised: Defines if the button should be raised or not (default = false).
var MDCButton = $n2.Class('MDCButton', MDC, {

	btnLabel: null,
	btnFunction: null,
	btnRaised: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			btnLabel: null,
			btnFunction: null,
			btnRaised: false
		}, opts_);

		MDC.prototype.initialize.call(this,opts);

		this.btnLabel = opts.btnLabel;
		this.btnFunction = opts.btnFunction;
		this.btnRaised = opts.btnRaised;

		this._generateMDCButton();
	},

	_generateMDCButton: function(){
		var $btn, keys;
		var _this = this;

		this.mdcClasses.push('mdc-button');

		if (this.btnRaised) {
			this.mdcClasses.push('mdc-button--raised');
		}

		$btn = $('<button>')
			.attr('id',this.mdcId)
			.addClass(this.mdcClasses.join(' '))
			.text(_loc(this.btnLabel))
			.appendTo($('#' + this.parentId));

		if (this.btnFunction) {
			$btn.click(this.btnFunction);
		}

		if (this.mdcAttributes) {
			keys = Object.keys(this.mdcAttributes);
			keys.forEach(function(key) {
				$btn.attr(key, _this.mdcAttributes[key]);
			});
		}

		this._attachRippleToButton(this.mdcId);
	},

	_attachRippleToButton: function(btnId){
		var btn = document.getElementById(btnId);
		if (btn) {
			$mdc.ripple.MDCRipple.attachTo(btn);
		}
	}
});

// Class MDCTextField
// Description: Creates a material design text-field component
// Options:
//  - txtFldLabel: Defines the text field label (String).
//  - txtFldOutline: Defines if the text-field should be outlined (Boolean) (default = true).
//  - txtFldInputId: Defines the id of input or text-area element (String) (optional) 
//  - txtFldArea: Defines if the text-field input should be a text-field-area (Boolean) (default = false).
//  - inputRequired: Defines if the text-field is required field or not (Boolean) (default = false).
var MDCTextField = $n2.Class('MDCTextField', MDC, {

	txtFldLabel: null,
	txtFldOutline: null,
	txtFldInputId: null,
	txtFldArea: null,
	inputRequired: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			txtFldLabel: null,
			txtFldOutline: true,
			txtFldInputId: null,
			txtFldArea: false,
			inputRequired: false,
		}, opts_);

		MDC.prototype.initialize.call(this,opts);

		this.txtFldLabel = opts.txtFldLabel;
		this.txtFldOutline = opts.txtFldOutline;
		this.txtFldInputId = opts.txtFldInputId;
		this.txtFldArea = opts.txtFldArea;
		this.inputRequired = opts.inputRequired;

		this._generateMDCTextField();
	},
	_generateMDCTextField: function(){
		var $txtFld, $txtFldOutline, $txtFldOutlineNotch;

		if (!this.txtFldInputId) {
			this.txtFldInputId = $n2.getUniqueId();
		}

		this.mdcClasses.push('mdc-text-field');
	
		if (this.txtFldArea) {
			this.mdcClasses.push('mdc-text-field--textarea');
		} else if (this.txtFldOutline) {
			this.mdcClasses.push('mdc-text-field--outlined');
		}

		$txtFld = $('<div>')
			.attr('id', this.mdcId)
			.addClass(this.mdcClasses.join(' '))
			.appendTo($('#' + this.parentId));

		if (this.txtFldArea) {
			$('<textarea>')
				.addClass('mdc-text-field__input')
				.attr('id', this.txtFldInputId)
				.attr('rows','8')
				.attr('cols','40')
				.appendTo($txtFld);

		} else {
			$('<input>')
				.addClass('mdc-text-field__input')
				.attr('id',this.txtFldInputId)
				.attr('type','text')
				.appendTo($txtFld);
		}

		if (this.txtFldOutline || this.txtFldArea) {	
			$txtFldOutline = $('<div>')
				.addClass('mdc-notched-outline')
				.appendTo($txtFld);
		
			$('<div>')
				.addClass('mdc-notched-outline__leading')
				.appendTo($txtFldOutline);
		
			$txtFldOutlineNotch = $('<div>')
				.addClass('mdc-notched-outline__notch')
				.appendTo($txtFldOutline);
			
			$('<label>')
				.attr('for', this.txtFldInputId)
				.addClass('mdc-floating-label')
				.text(_loc(this.txtFldLabel))
				.appendTo($txtFldOutlineNotch);
		
			$('<div>')
				.addClass('mdc-notched-outline__trailing')
				.appendTo($txtFldOutline);

		} else {
			$('<label>')
				.attr('for', this.txtFldInputId)
				.addClass('mdc-floating-label')
				.text(_loc(this.txtFldLabel))
				.appendTo($txtFld);

			$('<div>')
				.addClass('mdc-line-ripple')
				.appendTo($txtFld);
		}

		this._attachTextField(this.mdcId);
	},

	_attachTextField: function(txtFldId){
		var txtFld = document.getElementById(txtFldId);
		if (txtFld) {
			$mdc.textField.MDCTextField.attachTo(txtFld);
		}
	}
});

// ===========================================================================
var attachMDCComponents = function(){
	var i, e;

	// attach ripple to floating action buttons
	var mdc_fabs = document.getElementsByClassName('mdc-fab');
	for (i = 0, e = mdc_fabs.length; i < e; i += 1) {
		try {
			$mdc.ripple.MDCRipple.attachTo(mdc_fabs[i]);
		} catch (error){
			$n2.log("Unable to attach material design component to floating action button ripple: " + error);
		}
	}

	// attach textFields
	var text_fields = document.getElementsByClassName('mdc-text-field');
	for (i = 0, e = text_fields.length; i < e; i += 1) {
		try {
			$mdc.textField.MDCTextField.attachTo(text_fields[i]);
		} catch (error) {
			$n2.log("Unable to attach text field material design component: " + error);
		}
	}

	// attach text field helper text
	var helper_text = document.getElementsByClassName('mdc-text-field-helper-text');
	for (i = 0, e = helper_text.length; i < e; i += 1) {
		try {
			$mdc.textField.MDCTextFieldHelperText.attachTo(helper_text[i]);
		} catch (error) {
			$n2.log("Unable to attach helper text material design component: " + error);
		}
	}

	// attach floating labels
	var floating_labels = document.getElementsByClassName('mdc-floating-label');
	for (i = 0, e = floating_labels.length; i < e; i += 1) {
		try {
		$mdc.floatingLabel.MDCFloatingLabel.attachTo(floating_labels[i]);
		} catch (error) {
			$n2.log("Unable to attach floating label material design component: " + error);
		}
	}

	// attach select menus
	var select_menus = document.getElementsByClassName('mdc-select');
	for (i = 0, e = select_menus.length; i < e; i += 1) {
		try {
			$mdc.select.MDCSelect.attachTo(select_menus[i]);
		} catch (error) {
			$n2.log("Unable to attach select menu material design component: " + error);
		}
	}

	// attach notched outlines
	var notched_outlines = document.getElementsByClassName('mdc-notched-outline');
	for (i = 0, e = notched_outlines.length; i < e; i += 1) {
		try {
			$mdc.notchedOutline.MDCNotchedOutline.attachTo(notched_outlines[i]);
		} catch (error) {
			$n2.log("Unable to attach notched outline material design component: " + error);
		}
	}

	// attach lists
	var lists = document.getElementsByClassName('mdc-list');
	for (i = 0, e = lists.length; i < e; i += 1) {
		try {
			$mdc.list.MDCList.attachTo(lists[i]);
		} catch (error) {
			$n2.log("Unable to attach list material design component: " + error);
		}
	}

	// attach form fields
	var formFields = document.getElementsByClassName('mdc-form-field');
	for (i = 0, e = formFields.length; i < e; i += 1) {
		try {
			$mdc.formField.MDCFormField.attachTo(formFields[i]);
		} catch (error) {
			$n2.log("Unable to attach form field material design component: " + error);
		}
	}

	// attach checkboxes
	var checkboxes = document.getElementsByClassName('mdc-checkbox');
	for (i = 0, e = checkboxes.length; i < e; i += 1) {
		try {
			$mdc.checkbox.MDCCheckbox.attachTo(checkboxes[i]);
		} catch (error) {
			$n2.log("Unable to attach checkbox material design component: " + error);
		}
	}
};

$n2.mdc = {
	MDC: MDC,
	MDCButton: MDCButton,
	MDCTextField: MDCTextField,
	attachMDCComponents: attachMDCComponents
};

})(jQuery,nunaliit2);