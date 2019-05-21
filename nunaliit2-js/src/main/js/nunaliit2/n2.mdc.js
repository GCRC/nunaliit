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

var MDCDialogComponent, MDCDialogElement;
var _loc = function(str,args){
	return $n2.loc(str,'nunaliit2',args);
};

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
	docFragment: null,

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

		if (!this.mdcId) {
			this.mdcId = $n2.getUniqueId();
		}
	},

	getId: function(){
		return this.mdcId;
	}
});

// Class MDCButton
// Description: Creates a material design button component
// Options:
//  - btnLabel (String): Defines the text label on the button.
//  - btnFunction (Function): Defines the function which occurs when the button is clicked.
//  - btnRaised (Boolean): Defines if the button should be raised or not (default = false).
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

		if (!this.parentId) {
			throw new Error('Parent Id must be provided, to add a Material Design Button Component');
		}

		this._generateMDCButton();
	},

	_generateMDCButton: function(){
		var $btn, keys;
		var _this = this;

		this.mdcClasses.push('mdc-button');

		if (this.btnRaised) {
			this.mdcClasses.push('mdc-button--raised');
		}

		this.docFragment = $(document.createDocumentFragment());
		$btn = $('<button>')
			.attr('id',this.mdcId)
			.addClass(this.mdcClasses.join(' '))
			.text(_loc(this.btnLabel))
			.appendTo(this.docFragment);

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
		
		this.docFragment.appendTo($('#' + this.parentId));
	},

	_attachRippleToButton: function(btnId){
		var btn = this.docFragment[0].getElementById(btnId);
		if (btn) {
			$mdc.ripple.MDCRipple.attachTo(btn);
		}
	}
});

// Class MDCCheckbox
// Description: Creates a material design checkbox component
// Options:
//  - radioLabel (String): A string containing the radio button label.
//  - radioName (String): A string containing the radio button name.
//  - radioChecked (Boolean): If true, the radio button is checked (default = false).
//  - radioDisabled (Boolean): If true, the radio button is disabled (default = false). 
var MDCCheckbox = $n2.Class('MDCCheckbox', MDC, {

	chkboxLabel: null,
	chkboxName: null,
	chkboxChecked: null,
	chkboxDisabled: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			chkboxLabel: null,
			chkboxName: null,
			chkboxChecked: false,
			chkboxDisabled: false
		}, opts_);

		MDC.prototype.initialize.call(this, opts);

		this.chkboxLabel = opts.chkboxLabel;
		this.chkboxName = opts.chkboxName;
		this.chkboxChecked = opts.chkboxChecked;
		this.chkboxDisabled = opts.chkboxDisabled;

		if (!this.parentId) {
			throw new Error('Parent Id must be provided, to add a Material Design Check Box Component');
		}

		this._generateMDCCheckbox();
	},

	_generateMDCCheckbox: function(){
		var $chkbox, $chkboxInput, $chkboxBackground, keys;
		var _this = this;

		var chkboxInputId = $n2.getUniqueId();

		this.mdcClasses.push('mdc-checkbox');

		if (this.chkboxDisabled) {
			this.mdcClasses.push('mdc-checkbox--disabled');
		}

		this.docFragment = $(document.createDocumentFragment());
		$chkbox = $('<div>')
			.attr('id', this.mdcId)
			.addClass(this.mdcClasses.join(' '))
			.appendTo(this.docFragment);

		if (this.mdcAttributes) {
			keys = Object.keys(this.mdcAttributes);
			keys.forEach(function(key) {
				$chkbox.attr(key, _this.mdcAttributes[key]);
			});
		}

		$chkboxInput = $('<input>')
			.attr('id', chkboxInputId) 
			.attr('type', 'checkbox')
			.name('name', this.chkboxName)
			.addClass('mdc-checkbox__native-control')
			.appendTo($chkbox);

		if (this.chkboxChecked) {
			$chkboxInput.attr('checked', 'checked');
		}

		$chkboxBackground = $('<div>')
			.addClass('mdc-checkbox__background')
			.appendTo($chkbox);

		$('<svg class="mdc-checkbox__checkmark" viewBox="0 0 24 24"><path class="mdc-checkbox__checkmark-path" fill="none" d="M1.73,12.91 8.1,19.28 22.79,4.59" /></svg>')
			.appendTo($chkboxBackground);

		$('<div>')
			.addClass('mdc-checkbox__mixedmark')
			.appendTo($chkboxBackground);

		$('<label>')
			.attr('for', chkboxInputId)
			.text(this.chkboxLabel)
			.appendTo($('#' + this.parentId));

		this._attachCheckBox(this.mdcId);

		this.docFragment.appendTo($('#' + this.parentId));
	},

	_attachCheckBox: function(chkboxId){

		var chkbox = this.docFragment[0].getElementById(chkboxId);
		if (chkbox) {
			$mdc.checkbox.MDCCheckbox.attachTo(chkbox);
		}
	}
});


// Class MDCDialog
// Description: Creates a material design dialog component
// Options:
//  - dialogHtmlContent (String): Define text string of HTML content to place in the dialog message.
//  - dialogTextContent (String): Define text string to place in the dialog window.
//  - dialogTitle (String): Text defining the title of the dialog window.
//  - scrollable (Boolean): Make the dialog scrollable if true (default = false).
//  - closeBtn (Boolean): Add a close button to the dialog window (default = false).
//  - closeBtnText (String): Update the close button text (default = "Close").
var MDCDialog = $n2.Class('MDCDialog', MDC, {
	dialogHtmlContent: null,
	dialogTextContent: null,
	dialogTitle: null,
	scrollable: null,
	closeBtn: null,
	closeBtnText: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			dialogHtmlContent: null,
			dialogTextContent: null,
			dialogTitle: "",
			scrollable: false,
			closeBtn: false,
			closeBtnText: "Close",
		}, opts_);

		MDC.prototype.initialize.call(this,opts);

		this.dialogHtmlContent = opts.dialogHtmlContent;
		this.dialogTextContent = opts.dialogTextContent;
		this.dialogTitle = opts.dialogTitle;
		this.scrollable = opts.scrollable;
		this.closeBtn = opts.closeBtn;
		this.closeBtnText = opts.closeBtnText;

		this.contentId = $n2.getUniqueId();
		this.footerId = $n2.getUniqueId();

		this._generateMDCDialog();
	},

	_generateMDCDialog: function(){
		var $dialogContainer, $dialogSurface, $dialogMessage, $footer, keys;
		var _this = this;
		var content = "";

		this.mdcClasses.push('mdc-dialog');

		if (this.scrollable) {
			this.mdcClasses.push('mdc-dialog--scrollable');
		}

		this.docFragment = $(document.createDocumentFragment());
		MDCDialogElement = $('<div>')
			.attr('id',this.mdcId)
			.attr('role','alertdialog')
			.attr('aria-modal','true')
			.attr('aria-labelledby','my-dialog-title')
			.attr('aria-describedby','my-dialog-content')
			.addClass(this.mdcClasses.join(' '))
			.appendTo(this.docFragment);

		if (this.mdcAttributes) {
			keys = Object.keys(this.mdcAttributes);
			keys.forEach(function(key) {
				MDCDialogElement.attr(key, _this.mdcAttributes[key]);
			});
		}

		$dialogContainer = $('<div>')
			.addClass('mdc-dialog__container')
			.appendTo(MDCDialogElement);

		$dialogSurface = $('<div>')
			.addClass('mdc-dialog__surface')
			.appendTo($dialogContainer);

		$('<h2>')
			.addClass('mdc-dialog__title')
			.text(_loc(this.dialogTitle))
			.appendTo($dialogSurface);

		$dialogMessage = $('<div>')
			.attr('id', this.contentId)
			.addClass('mdc-dialog__content')
			.text(content)
			.appendTo($dialogSurface);

		if (this.dialogHtmlContent) {
			$dialogMessage.html(_loc(this.dialogHtmlContent));
		} else if (this.dialogTextContent) {
			$dialogMessage.text(_loc(this.dialogTextContent));
		}

		$footer = $('<footer>')
			.attr('id', this.footerId)
			.addClass('mdc-dialog__actions')
			.appendTo($dialogSurface);

		$('<div>')
			.addClass('mdc-dialog__scrim')
			.click(_this.closeDialog)
			.appendTo(MDCDialogElement);

		// Attach mdc component to dialog
		this._attachDialog(this.mdcId);

		this.docFragment.appendTo($('body'));

		if (this.closeBtn) {
			this.addCloseBtn();
		}
		
		this.openDialog();
	},

	_attachDialog: function(dialogId){
		var dialog = this.docFragment[0].getElementById(dialogId);
		if (dialog) {
			MDCDialogComponent = new $mdc.dialog.MDCDialog(dialog);
		}
	},

	getContentId: function() {
		return this.contentId;
	},

	getFooterId: function() {
		return this.footerId;
	},

	closeDialog: function(){
		if (MDCDialogComponent && MDCDialogComponent.isOpen) {
			MDCDialogComponent.close();
			MDCDialogElement.remove();
			return false;
		}
	},

	openDialog: function(){
		if (MDCDialogComponent && !MDCDialogComponent.isOpen) {
			MDCDialogComponent.open();
		}
	},

	addCloseBtn: function(){
		new MDCButton({
			parentId: this.footerId,
			btnLabel: this.closeBtnText,
			btnFunction: this.closeDialog
		});
	}, 

	addFooterBtn: function(btnOpts){
		new MDCButton(btnOpts);
	}
});


// Class MDCFormField
// Description: Create a material design form field component
var MDCFormField = $n2.Class('MDCFormField', MDC, {

	initialize: function(opts_){
		var opts = $n2.extend({

		}, opts_);

		MDC.prototype.initialize.call(this, opts);

		if (!this.parentId) {
			throw new Error('Parent Id must be provided, to add a Material Design Form Field Component');
		}
		this._generateMDCFormField();
	},

	_generateMDCFormField: function(){
		var $formField, keys;
		var _this = this;

		this.mdcClasses.push('mdc-form-field');

		this.docFragment = $(document.createDocumentFragment());
		$formField = $('<div>')
			.attr('id',this.mdcId)
			.addClass(this.mdcClasses.join(' '))
			.appendTo(this.docFragment);

		if (this.mdcAttributes) {
			keys = Object.keys(this.mdcAttributes);
			keys.forEach(function(key) {
				$formField.attr(key, _this.mdcAttributes[key]);
			});
		}

		this._attachFormField(this.mdcId);

		this.docFragment.appendTo($('#' + this.parentId));
	},

	_appendComponent: function(id){
		var formField = document.getElementById(this.mdcId);
		var component = document.getElementById(id);
		
		if (formField && component) {
			formField.appendChild(component);
		}
	},

	_attachFormField: function(formFieldId){
		var formField = this.docFragment[0].getElementById(formFieldId);

		if (formField) {
			$mdc.formField.MDCFormField.attachTo(formField);
		}
	}
});

// Class MDCRadio
// Description: Creates a material design radio button component
// Options:
//  - radioLabel (String): A string containing the radio button label.
//  - radioName (String): A string containing the radio button name.
//  - radioChecked (Boolean): If true, the radio button is checked (default = false).
//  - radioDisabled (Boolean): If true, the radio button is disabled (default = false). 
var MDCRadio = $n2.Class('MDCRadio', MDC, {

	radioLabel: null,
	radioName: null,
	radioChecked: null,
	radioDisabled: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			radioLabel: null,
			radioName: null,
			radioChecked: false,
			radioDisabled: false
		}, opts_);

		MDC.prototype.initialize.call(this, opts);

		this.radioLabel = opts.radioLabel;
		this.radioName = opts.radioName;
		this.radioChecked = opts.radioChecked;
		this.radioDisabled = opts.radioDisabled;

		if (!this.parentId) {
			throw new Error('Parent Id must be provided, to add a Material Design Radio Button Component');
		}

		this._generateMDCRadio();
	},

	_generateMDCRadio: function(){
		var $rbtn, $rbtnInput, $rbtnBackground, keys;
		var _this = this;

		var rbtnInputId = $n2.getUniqueId();

		this.mdcClasses.push('mdc-radio');

		if (this.radioDisabled) {
			this.mdcClasses.push('mdc-radio--disabled');
		}

		this.docFragment = $(document.createDocumentFragment());
		$rbtn = $('<div>')
			.attr('id',this.mdcId)
			.addClass(this.mdcClasses.join(' '))
			.appendTo(this.docFragment);

		if (this.mdcAttributes) {
			keys = Object.keys(this.mdcAttributes);
			keys.forEach(function(key) {
				$rbtn.attr(key, _this.mdcAttributes[key]);
			});
		}

		$rbtnInput = $('<input>')
			.attr('id', rbtnInputId) 
			.attr('type', 'radio')
			.attr('name', this.radioName)
			.addClass('mdc-radio__native-control')
			.appendTo($rbtn);

		if (this.radioChecked) {
			$rbtnInput.attr('checked', 'checked');
		}

		$rbtnBackground = $('<div>')
			.addClass('mdc-radio__background')
			.appendTo($rbtn);

		$('<div>')
			.addClass('mdc-radio__outer-circle')
			.appendTo($rbtnBackground);

		$('<div>')
			.addClass('mdc-radio__inner-circle')
			.appendTo($rbtnBackground);

		$('<label>')
			.attr('for', rbtnInputId)
			.text(this.radioLabel)
			.appendTo($('#' + this.parentId));

		this._attachRadioButton(this.mdcId);

		this.docFragment.appendTo($('#' + this.parentId));
	},

	_attachRadioButton: function(radioBtnId){
		
		var radioBtn = this.docFragment[0].getElementById(radioBtnId);
		if (radioBtn) {
			$mdc.radio.MDCRadio.attachTo(radioBtn);
		}
	}
});

// Class MDCSelect
// Description: Creates a material design select menu component
// Options:
//  - selectClasses (Array): Define an array of classes specific to select element.
//  - menuChgFunction (Function): Function to occur when 
//  - menuLabel (String): Defines the text label on the select menu.
//  - menuOpts (Array of Objects): Define an array of objects describing each option for the select menu.
//   - Expected option object keys:
//    - value - value when selected
//    - label - label shown to the user
//    - selected - initially selected
//    - disabled - not selectedable
//   - Example: [{"value":"1", "label":"One"}, {"value":"2", "label":"Two"}]
var MDCSelect = $n2.Class('MDCSelect', MDC, {

	menuChgFunction: null,
	menuLabel: null,
	menuOpts: null,
	select: null,
	selectClasses: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			menuChgFunction: null,
			menuLabel: null,
			menuOpts: [],
			selectClasses: []
		}, opts_);

		MDC.prototype.initialize.call(this,opts);

		this.menuChgFunction = opts.menuChgFunction;
		this.menuLabel = opts.menuLabel;
		this.menuOpts = opts.menuOpts;
		this.selectClasses = opts.selectClasses;

		if (!this.parentId) {
			throw new Error('Parent Id must be provided, to add a Material Design Select Menu Component');
		}

		this._generateMDCSelectMenu();
	},

	_generateMDCSelectMenu: function(){
		var $menu, $menuNotchedOutline, $menuNotchedOutlineNotch,  keys;
		var _this = this;

		this.mdcClasses.push('mdc-select');
		this.mdcClasses.push('mdc-select--outline');

		this.docFragment = $(document.createDocumentFragment());
		$menu = $('<div>')
			.attr('id',this.mdcId)
			.addClass(this.mdcClasses.join(' '))
			.text(_loc(this.menuLabel))
			.appendTo(this.docFragment);

		if (this.mdcAttributes) {
			keys = Object.keys(this.mdcAttributes);
			keys.forEach(function(key) {
				$menu.attr(key, _this.mdcAttributes[key]);
			});
		}

		$('<i>')
			.addClass('mdc-select__dropdown-icon')
			.appendTo($menu);
		
		this.selectClasses.push('mdc-select__native-control');

		this.select = $('<select>')
			.addClass(this.selectClasses.join(' '))
			.appendTo($menu)
			.change(this.menuChgFunction);

		$menuNotchedOutline = $('<div>')
			.addClass('mdc-notched-outline')
			.appendTo($menu);

		$('<div>')
			.addClass('mdc-notched-outline__leading')
			.appendTo($menuNotchedOutline);

		$menuNotchedOutlineNotch = $('<div>')
			.addClass('mdc-notched-outline__notch')
			.appendTo($menuNotchedOutline);

		$('<label>')
			.addClass('mdc-floating-label')
			.text(_loc(this.menuLabel))
			.appendTo($menuNotchedOutlineNotch);
	
		$('<div>')
			.addClass('mdc-notched-outline__trailing')
			.appendTo($menuNotchedOutline);	

		if (this.menuOpts 
			&& $n2.isArray(this.menuOpts) 
			&& this.menuOpts.length > 0) {
			
			this.menuOpts.forEach(function(menuOpt) {
				this._addOptionToSelectMenu(menuOpt);		
			});
		}

		this._attachSelectMenu(this.mdcId);

		this.docFragment.appendTo($('#' + this.parentId));
	},

	_attachSelectMenu: function(menuId){
		var menu = this.docFragment[0].getElementById(menuId);
		if (menu) {
			$mdc.select.MDCSelect.attachTo(menu);
		}
	},

	_addOptionToSelectMenu: function(menuOpt){
		var opt, value, label;
	
		if (menuOpt) {
			if (menuOpt.value) {
				value = menuOpt.value;
			} else {
				value = '';
			}
			
			if (menuOpt.label) {
				label = menuOpt.label;
			}

			if (label) {
				opt = $('<option>')
					.attr('value', value)
					.attr('label', label)
					.appendTo(this.select);

				if (menuOpt.selected) {
					opt.attr('selected', 'selected');
				}

				if (menuOpt.disabled) {
					opt.attr('disabled', 'disabled');
				}
			}
		}
	}
});

// Class MDCTextField
// Description: Creates a material design text-field component
// Options:
//  - txtFldLabel (String): Defines the text field label.
//  - txtFldOutline (Boolean): Defines if the text-field should be outlined (default = true).
//  - txtFldInputId (String): Defines the id of input or text-area element.
//  - txtFldInputClasses (Array): Defines a list of classes specific to the input field.
//  - txtFldArea (Boolean): Defines if the text-field input should be a text-field-area (default = false).
//  - inputRequired (Boolean): Defines if the text-field is required field or not (default = false).
var MDCTextField = $n2.Class('MDCTextField', MDC, {

	txtFldLabel: null,
	txtFldOutline: null,
	txtFldInputId: null,
	txtFldInputClasses: null,
	txtFldInputAttributes: null,
	txtFldArea: null,
	inputRequired: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			txtFldLabel: null,
			txtFldOutline: true,
			txtFldInputId: null,
			txtFldInputClasses: [],
			txtFldInputAttributes: null,
			txtFldArea: false,
			inputRequired: false,
		}, opts_);

		MDC.prototype.initialize.call(this,opts);

		this.txtFldLabel = opts.txtFldLabel;
		this.txtFldOutline = opts.txtFldOutline;
		this.txtFldInputId = opts.txtFldInputId;
		this.txtFldInputClasses = opts.txtFldInputClasses;
		this.txtFldInputAttributes = opts.txtFldInputAttributes;
		this.txtFldArea = opts.txtFldArea;
		this.inputRequired = opts.inputRequired;

		if (!this.parentId) {
			throw new Error('Parent Id must be provided, to add a Material Design Text Field Component');
		}

		this._generateMDCTextField();
	},
	_generateMDCTextField: function(){
		var $txtFld, $txtFldInput, $txtFldOutline, $txtFldOutlineNotch, keys;
		var _this = this;

		if (!this.txtFldInputId) {
			this.txtFldInputId = $n2.getUniqueId();
		}

		this.mdcClasses.push('mdc-text-field');
		this.txtFldInputClasses.push('mdc-text-field__input');	

		if (this.txtFldArea) {
			this.mdcClasses.push('mdc-text-field--textarea');
		} else if (this.txtFldOutline) {
			this.mdcClasses.push('mdc-text-field--outlined');
		}

		this.docFragment = $(document.createDocumentFragment());
		$txtFld = $('<div>')
			.attr('id', this.mdcId)
			.addClass(this.mdcClasses.join(' '))
			.appendTo(this.docFragment);

		if (this.mdcAttributes) {
			keys = Object.keys(this.mdcAttributes);
			keys.forEach(function(key) {
				$txtFld.attr(key, _this.mdcAttributes[key]);
			});
		}

		if (this.txtFldArea) {
			$txtFldInput = $('<textarea>')
				.addClass(this.txtFldInputClasses.join(' '))
				.attr('id', this.txtFldInputId)
				.attr('rows','8')
				.attr('cols','40');

		} else {
			$txtFldInput = $('<input>')
				.addClass(this.txtFldInputClasses.join(' '))
				.attr('id',this.txtFldInputId)
				.attr('type','text');
		}

		if (this.txtFldInputAttributes) {
			keys = Object.keys(this.txtFldInputAttributes);
			keys.forEach(function(key) {
				$txtFldInput.attr(key, _this.txtFldInputAttributes[key]);
			});
		}
		
		$txtFld.append($txtFldInput);

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

		this.docFragment.appendTo($('#' + this.parentId));
	},

	_attachTextField: function(txtFldId){
		var txtFld = this.docFragment[0].getElementById(txtFldId);
		if (txtFld) {
			$mdc.textField.MDCTextField.attachTo(txtFld);
		}
	}
});

// ===========================================================================
var attachMDCComponents = function(){
	var i, e;

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
	MDCCheckbox: MDCCheckbox,
	MDCDialog: MDCDialog,
	MDCFormField: MDCFormField,
	MDCRadio: MDCRadio,
	MDCSelect: MDCSelect,
	MDCTextField: MDCTextField,
	attachMDCComponents: attachMDCComponents
};

})(jQuery,nunaliit2);
