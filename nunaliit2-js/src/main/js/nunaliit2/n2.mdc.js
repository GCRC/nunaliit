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

var MDCDialogComponent, MDCDialogElement, showService;
var _loc = function(str,args){
	return $n2.loc(str,'nunaliit2',args);
};

// Required library: material design components
var $mdc = window.mdc;
if (!$mdc) {
	return;
}

var Service = $n2.Class({

	initialize: function(opts_){
		var opts = $n2.extend({
			showService: null
		}, opts_);

		showService = opts.showService;
	}
});

// Class: MDC
// Description: Generic Material design component which all other material design components are based off of.
// Options:
//  - parentElem: A reference to the parent element that the component is appended to.
//  - mdcId (String): The id of the element. If none is provided, Nunaliit will generate a unique id.
//  - mdcClasses (Array): Specific classes to added to the component.
//  - mdcAttributes (Object): Unique attributes to be added to the component.
var MDC = $n2.Class('MDC',{

	parentElem: null,
	mdcId: null,
	mdcClasses: null,
	mdcAttributes: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			parentElem: null,
			mdcId: null,
			mdcClasses: [],
			mdcAttributes: null
		}, opts_);

		this.parentElem = opts.parentElem;
		this.mdcId = opts.mdcId;
		this.mdcClasses = opts.mdcClasses;
		this.mdcAttributes = opts.mdcAttributes;

		if (!this.mdcId) {
			this.mdcId = $n2.getUniqueId();
		}
	},

	getId: function(){
		return this.mdcId;
	},

	getElem: function(){
		return $('#' + this.mdcId);
	}
});

// Class MDCButton
// Description: Creates a material design button component
// Options:
//  - btnLabel (String): Defines the text label on the button.
//  - btnRaised (Boolean): Defines if the button should be raised or not (default = false).
//  - onBtnClick (Function): Defines the function which occurs when the button is clicked.
var MDCButton = $n2.Class('MDCButton', MDC, {

	btnLabel: null,
	btnRaised: null,
	onBtnClick: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			btnLabel: null,
			btnRaised: false,
			onBtnClick: null
		}, opts_);

		MDC.prototype.initialize.call(this,opts);

		this.btnLabel = opts.btnLabel;
		this.btnRaised = opts.btnRaised;
		this.onBtnClick = opts.onBtnClick;
		
		if (!this.parentElem) {
			throw new Error('parentElem must be provided, to add a Material Design Button Component');
		}

		this._generateMDCButton();
	},

	_generateMDCButton: function(){
		var $btn, $label, keys;
		var _this = this;

		this.mdcClasses.push('mdc-button', 'n2s_attachMDCButton');

		if (this.btnRaised) {
			this.mdcClasses.push('mdc-button--raised');
		}
		
		$btn = $('<button>')
			.attr('id', this.mdcId)
			.addClass(this.mdcClasses.join(' '));
	
		$label = $('<span>')
			.addClass('mdc-button__label')
			.text(this.btnLabel)
			.appendTo($btn);

		if (this.onBtnClick) {
			$btn.click(this.onBtnClick);
		}

		if (this.mdcAttributes) {
			keys = Object.keys(this.mdcAttributes);
			keys.forEach(function(key) {
				$btn.attr(key, _this.mdcAttributes[key]);
			});
		}
		
		// Add button to parent DOM element
		$btn.appendTo(this.parentElem);

		if (showService) {
			showService.fixElementAndChildren($('#' + this.mdcId));
		}
	}
});

// Class MDCCheckbox
// Description: Creates a material design checkbox component
// Options:
//  - chkboxLabel (String): A string containing the checkbox button label.
//  - chkboxName (String): A string containing the checkbox button name.
//  - chkboxChecked (Boolean): If true, the checkbox button is checked (default = false).
//  - chkboxDisabled (Boolean): If true, the checkbox button is disabled (default = false). 
//  - chkboxChgFunc (Function): A function which handles the functionality when the checkbox changes.
var MDCCheckbox = $n2.Class('MDCCheckbox', MDC, {

	chkboxLabel: null,
	chkboxName: null,
	chkboxChecked: null,
	chkboxDisabled: null,
	chkboxChgFunc: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			chkboxLabel: null,
			chkboxName: null,
			chkboxChecked: false,
			chkboxDisabled: false,
			chkboxChgFunc: null
		}, opts_);

		MDC.prototype.initialize.call(this, opts);

		this.chkboxLabel = opts.chkboxLabel;
		this.chkboxName = opts.chkboxName;
		this.chkboxChecked = opts.chkboxChecked;
		this.chkboxDisabled = opts.chkboxDisabled;
		this.chkboxChgFunc = opts.chkboxChgFunc;
		this.chkboxInputId = $n2.getUniqueId();
		
		if (!this.parentElem) {
			throw new Error('parentElem must be provided, to add a Material Design Check Box Component');
		}

		this._generateMDCCheckbox();
	},

	_generateMDCCheckbox: function(){
		var $chkbox, $chkboxInput, $chkboxBackground, $chkboxLabel, keys;
		var _this = this;

		this.mdcClasses.push('mdc-checkbox', 'n2s_attachMDCCheckbox');

		if (this.chkboxDisabled) {
			this.mdcClasses.push('mdc-checkbox--disabled');
		}

		$chkbox = $('<div>')
			.attr('id', this.mdcId)
			.addClass(this.mdcClasses.join(' '));

		if (this.mdcAttributes) {
			keys = Object.keys(this.mdcAttributes);
			keys.forEach(function(key) {
				$chkbox.attr(key, _this.mdcAttributes[key]);
			});
		}

		$chkboxInput = $('<input>')
			.attr('id', this.chkboxInputId)
			.attr('type', 'checkbox')
			.attr('name', this.chkboxName)
			.addClass('mdc-checkbox__native-control')
			.appendTo($chkbox);

		if (this.chkboxChgFunc) {
			$chkboxInput.change(this.chkboxChgFunc);
		}

		if (this.chkboxChecked) {
			$chkboxInput.attr('checked', 'checked');
		}

		$chkboxBackground = $('<div>')
			.addClass('mdc-checkbox__background')
			.appendTo($chkbox);

		$('<svg class="mdc-checkbox__checkmark" viewBox="0 0 24 24"><path class="mdc-checkbox__checkmark-path" fill="none" d="M1.73,12.91 8.1,19.28 22.79,4.59" /></svg>').appendTo($chkboxBackground);

		$('<div>').addClass('mdc-checkbox__mixedmark')
			.appendTo($chkboxBackground);

		$chkboxLabel = $('<label>')
			.attr('for', this.chkboxInputId)
			.text(_loc(this.chkboxLabel));
		
		$chkbox.appendTo(this.parentElem);
		$chkboxLabel.appendTo(this.parentElem);

		if (showService) {
			showService.fixElementAndChildren($('#' + this.mdcId));
		}
	},

	getInputId: function() {
		return this.chkboxInputId;
	}
});

// Class MDCChipSet
// Description: Creates a material design chips component
// Options:
//  - chips (Array): A collection of strings
//  - choiceChips (Boolean): If true, the chip set is given the choice chips class.
//  - filterChips (Boolean): If true, the chip set is given the filter chips class.
//  - inputChips (Boolean): If true, the chip set is given the input chips class.
//  - inputId (String): Id of the input field
var MDCChipSet = $n2.Class('MDCChipSet', MDC, {
	
	chips: null,
	choiceChips: null,
	filterChips: null,
	inputChips: null,
	inputId: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			chips: [],
			choiceChips: false,
			filterChips: false,
			inputChips: false,
			inputId: null
		}, opts_);

		this.chips = opts.chips;
		this.choiceChips = opts.choiceChips;
		this.filterChips = opts.filterChips;
		this.inputChips = opts.inputChips;
		this.inputId = opts.inputId;

		MDC.prototype.initialize.call(this, opts);

		if (!this.parentElem) {
			throw new Error('parentElem must be provided, to add a Material Design Check Box Component');
		}

		this._generateMDCChips();
	},

	_generateMDCChips: function(){
		var $chipSet, $chip, keys;
		var _this = this;

		this.mdcClasses.push('mdc-chip-set', 'n2s_attachMDCChipSet');

		if (this.choiceChips) {
			this.mdcClasses.push('mdc-chip-set--choice');
		}

		if (this.filterChips) {
			this.mdcClasses.push('mdc-chip-set--filter');
		}

		if (this.inputChips) {
			this.mdcClasses.push('mdc-chip-set--input');
		}

		$chipSet = $('<div>')
			.attr('id', this.mdcId)
			.addClass(this.mdcClasses.join(' '));

		if (this.inputId) {
			$chipSet.attr('n2associatedmdc', this.inputId);
		}

		if (this.mdcAttributes) {
			keys = Object.keys(this.mdcAttributes);
			keys.forEach(function(key) {
				$chipSet.attr(key, _this.mdcAttributes[key]);
			});
		}

		if (this.chips) {	
			this.chips.forEach(function(chip){
				$chip = _this._generateChip(chip);
				$chip.appendTo($chipSet);
			});
		}

		$chipSet.appendTo(this.parentElem);

		if (showService) {
			showService.fixElementAndChildren($('#' + this.mdcId));
		}
	},

	_generateChip: function(chipText){
		var $chip;
		var chipId = $n2.getUniqueId();

		$chip = $('<div>').addClass('mdc-chip')
			.attr('id', chipId)
			.attr('tabindex','0');

		if (chipText) {
			$('<div>').addClass('mdc-chip__text')
				.text(chipText)
				.appendTo($chip);
		}

		$('<i>')
			.addClass('material-icons mdc-chip__icon mdc-chip__icon--trailing')
			.attr('tabindex','0')
			.attr('role','button')
			.text('x')
			.appendTo($chip);

		return $chip;
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
		var $dialogContainer, $dialogSurface, $dialogMessage, keys;
		var _this = this;
		var content = "";

		this.mdcClasses.push('mdc-dialog');

		if (this.scrollable) {
			this.mdcClasses.push('mdc-dialog--scrollable');
		}

		MDCDialogElement = $('<div>')
			.attr('id', this.mdcId)
			.attr('role', 'alertdialog')
			.attr('aria-modal', 'true')
			.attr('aria-labelledby', 'my-dialog-title')
			.attr('aria-describedby', 'my-dialog-content')
			.addClass(this.mdcClasses.join(' '));

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

		$('<footer>').attr('id', this.footerId)
			.addClass('mdc-dialog__actions')
			.appendTo($dialogSurface);

		$('<div>').addClass('mdc-dialog__scrim')
			.click(_this.closeDialog)
			.appendTo(MDCDialogElement);

		// Attach mdc component to dialog
		this._attachDialog(this.mdcId);

		MDCDialogElement.appendTo($('body'));

		if (this.closeBtn) {
			this.addCloseBtn();
		}
		
		this.openDialog();
	},

	_attachDialog: function(dialogId){
		var dialog = MDCDialogElement[0];
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
			parentElem: $('#' + this.footerId),
			btnLabel: this.closeBtnText,
			onBtnClick: this.closeDialog
		});
	}, 

	addFooterBtn: function(btnOpts){
		new MDCButton(btnOpts);
	}
});

// Class MDCDrawer
// Description: Create a material design drawer component
// Options:
//  - anchorBtnId (String): Button Id associated with drawer
//  - navHeaderTitle (String): Nav-Bar Header Title
//  - navHeaderSubTitle (String): Nav-Bar Sub-Header Title
//  - navItems (Array): An array of objects containing link text, href URL, and activated status
//   - navItems Example: 
//   [
//   	{"href":"https://gcrc.carleton.ca", "text":"GCRC", "activated":true}, 
//   	{"href":"https://nunaliit.org", "text":"Nunaliit"}
//   ]
var MDCDrawer = $n2.Class('MDCDrawer', MDC, {

	anchorBtnId: null,
	navHeaderTitle: null,
	navHeaderSubTitle: null,
	navItems: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			anchorBtnId: null,
			navHeaderTitle: null,
			navHeaderSubTitle: null,
			navItems: null
		}, opts_);

		MDC.prototype.initialize.call(this, opts);

		this.anchorBtnId = opts.anchorBtnId;
		this.navHeaderTitle = opts.navHeaderTitle;
		this.navHeaderSubTitle = opts.navHeaderSubTitle;
		this.navItems = opts.navItems;
		this.navId = $n2.getUniqueId();
		this.navContentId = $n2.getUniqueId();

		this._generateMDCDrawer();
	},

	_generateMDCDrawer: function(){
		var $drawer, $drawerContent, $drawerHeader, $drawerScrim, keys;
		var _this = this;

		this.mdcClasses.push('mdc-drawer', 'mdc-drawer--modal', 'n2s_attachMDCDrawer');
		
		$drawer = $('<aside>')
			.attr('id', this.mdcId)
			.addClass(this.mdcClasses.join(' '));

		if (this.anchorBtnId) {
			$drawer.attr('n2associatedmdc', this.anchorBtnId);
		}

		if (this.mdcAttributes) {
			keys = Object.keys(this.mdcAttributes);
			keys.forEach(function(key) {
				$drawer.attr(key, _this.mdcAttributes[key]);
			});
		}

		if (this.navHeaderTitle || this.navHeaderSubTitle) {
			$drawerHeader = $('<div>')
				.addClass('mdc-drawer__header')
				.appendTo($drawer);

			if (this.navHeaderTitle) {
				$('<h3>').addClass('mdc-drawer__title')
					.text(this.navHeaderTitle)
					.appendTo($drawerHeader);
			}

			if (this.navHeaderSubTitle) {
				$('<h6>').addClass('mdc-drawer__subtitle')
					.text(this.navHeaderSubTitle)
					.appendTo($drawerHeader);
			}
		}

		$drawerContent = $('<div>')
			.attr('id', this.navContentId)
			.addClass('mdc-drawer__content')
			.appendTo($drawer);

		$drawerScrim = $('<div>').addClass('mdc-drawer-scrim')
			.prependTo($('body'));

		// drawer needs to be prepend to body.
		$drawer.prependTo($('body'));

		// Added nav items to list
		new $n2.mdc.MDCList({
			parentElem: $drawerContent,
			navList: true,
			listItems: this.navItems
		});
		
		if (showService) {
			showService.fixElementAndChildren($('#' + this.mdcId));
		}
	},

	getContentId: function(){
		return this.navContentId;
	},

	getNavId: function(){
		return this.navId;
	}
});

// Class MDCFormField
// Description: Create a material design form field component
var MDCFormField = $n2.Class('MDCFormField', MDC, {

	initialize: function(opts_){
		var opts = $n2.extend({

		}, opts_);

		MDC.prototype.initialize.call(this, opts);
		
		if (!this.parentElem) {
			throw new Error('parentElem must be provided, to add a Material Design Form Field Component');
		}

		this._generateMDCFormField();
	},

	_generateMDCFormField: function(){
		var $formField, keys;
		var _this = this;

		this.mdcClasses.push('mdc-form-field', 'n2s_attachMDCFormField');

		$formField = $('<div>')
			.attr('id', this.mdcId)
			.addClass(this.mdcClasses.join(' '));

		if (this.mdcAttributes) {
			keys = Object.keys(this.mdcAttributes);
			keys.forEach(function(key) {
				$formField.attr(key, _this.mdcAttributes[key]);
			});
		}

		$formField.appendTo(this.parentElem);

		if (showService) {
			showService.fixElementAndChildren($('#' + this.mdcId));
		}
	}
}); 

// Class MDCList
// Description: Create a material design list component
// Options:
//  - listItems (array): An array of object specifying list item details
//   - list item attributes: text (string), href (string), activated (boolean), onItemClick (function) 
//   - Example: [
//   	{'text': 'foo', 'onItemClick': bar},
//   	{"href":"https://gcrc.carleton.ca", "text":"GCRC", "activated":true}
//   	]
var MDCList = $n2.Class('MDCList', MDC, {

	listItems: null,

	navList: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			listItems: null,
			navList: false,
		}, opts_);

		MDC.prototype.initialize.call(this, opts);

		this.listItems = opts.listItems;
		this.navList = opts.navList;
		
		if (!this.parentElem) {
			throw new Error('parentElem  must be provided, to add a Material Design List Component');
		}

		this._generateMDCList();
	},

	_generateMDCList: function(){
		var $list, $item, keys;
		var _this = this;

		this.mdcClasses.push('mdc-list', 'n2s_attachMDCList');

		if (this.navList) {
			$list = $('<nav>');
		} else {
			$list = $('<ul>');
		}

		$list.attr('id', this.mdcId)
			.attr('role', 'menu')
			.attr('aria-hidden', 'true')
			.attr('aria-orientation', 'vertical')
			.attr('tab-index', '-1')
			.addClass(this.mdcClasses.join(' '));

		if (this.mdcAttributes) {
			keys = Object.keys(this.mdcAttributes);
			keys.forEach(function(key) {
				$list.attr(key, _this.mdcAttributes[key]);
			});
		}

		if (this.listItems && $n2.isArray(this.listItems)){
			this.listItems.forEach(function(listItem){
				$item = _this._generateMDCListItem(listItem);
				$item.appendTo($list);
			});
		}

		$list.appendTo(this.parentElem);

		if (showService) {
			showService.fixElementAndChildren($('#' + this.mdcId));
		}
	},

	_generateMDCListItem: function(item){
		var $listItem, $listItemText;
		
		if (this.navList) {
			$listItem = $('<a>');
		} else {
			$listItem = $('<li>');
		}

		$listItem.attr('role', 'menuitem')
			.attr('tabindex', '-1')
			.addClass('mdc-list-item');
			

		if (item.activated) {
			$listItem.attr('tabIndex', '0')
				.attr('aria-selected', true)
				.addClass('mdc-list-item--activated');
		}

		if (item.href && typeof item.href === 'string') {
			$listItem.attr('href', item.href);
		}

		if (item.text && typeof item.text === 'string') {
			$listItemText = $('<span>')
				.addClass('mdc-list-item__text')
				.text(item.text);

			if (item.onItemClick) {
				$listItemText.click(item.onItemClick);
			}

			$listItemText.appendTo($listItem);
		}

		return $listItem;
	}
}); 

// Class MDCMenu
// Description: Create a material design menu component
// Options:
//  - anchorBtnId (string): The id of the button associated with the menu
var MDCMenu = $n2.Class('MDCMenu', MDC, {
	
	anchorBtnId: null,
	anchorBtnText: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			anchorBtnId: null,
		}, opts_);

		MDC.prototype.initialize.call(this, opts);

		this.anchorBtnText = opts.anchorBtnText;
		this.anchorBtnId = $n2.getUniqueId();
		this.menuId = $n2.getUniqueId();
		this.$menuSurfaceAnchor = null; 

		if (!this.parentElem) {
			throw new Error('parentElem must be provided, to add a Material Design Menu Component');
		}

		this._generateMDCMenu();
	},

	_generateMDCMenu: function(){
		var $menu, keys;
		var _this = this;

		this.mdcClasses.push('mdc-menu-surface--anchor');

		this.$menuSurfaceAnchor = $('<div>')
			.attr('id', this.mdcId)
			.addClass(this.mdcClasses.join(' '));
		

		$menu = $('<div>').attr('id', this.menuId)
			.attr('n2associatedmdc', this.anchorBtnId)
			.addClass('mdc-menu mdc-menu-surface n2s_attachMDCMenu')
			.appendTo(this.$menuSurfaceAnchor);

		if (this.mdcAttributes) {
			keys = Object.keys(this.mdcAttributes);
			keys.forEach(function(key) {
				$menu.attr(key, _this.mdcAttributes[key]);
			});
		}

		this.$menuSurfaceAnchor.appendTo(this.parentElem);

		this._addAnchorBtn();

		if (showService) {
			showService.fixElementAndChildren($('#' + this.mdcId));
		}
	},

	_addAnchorBtn: function(){
		new MDCButton({
			parentElem: this.parentElem.find('#' + this.mdcId),
			mdcId: this.anchorBtnId,
			btnLabel: this.anchorBtnText
		});
	},

	getMenuId: function(){
		return this.menuId;
	},

	getAnchorBtnId: function(){
		return this.anchorBtnId;
	}
}); 

// Class MDCRadio
// Description: Creates a material design radio button component
// Options:
//  - radioLabel (String): A string containing the radio button label.
//  - radioName (String): A string containing the radio button name.
//  - radioChecked (Boolean): If true, the radio button is checked (default = false).
//  - radioDisabled (Boolean): If true, the radio button is disabled (default = false). 
//  - onRadioClicked (Function): A function which is called when the radio is clicked.
var MDCRadio = $n2.Class('MDCRadio', MDC, {

	radioLabel: null,
	radioName: null,
	radioChecked: null,
	radioDisabled: null,
	onRadioClick: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			radioLabel: null,
			radioName: null,
			radioChecked: false,
			radioDisabled: false,
			onRadioClick: null
		}, opts_);

		MDC.prototype.initialize.call(this, opts);

		this.radioLabel = opts.radioLabel;
		this.radioName = opts.radioName;
		this.radioChecked = opts.radioChecked;
		this.radioDisabled = opts.radioDisabled;
		this.onRadioClick = opts.onRadioClick;
		this.rbtnInputId = $n2.getUniqueId();

		if (!this.parentElem) {
			throw new Error('parentElem must be provided, to add a Material Design Radio Component');
		}

		this._generateMDCRadio();
	},

	_generateMDCRadio: function(){
		var $rbtn, $rbtnInput, $rbtnBackground, keys;
		var _this = this;

		this.mdcClasses.push('mdc-radio', 'n2s_attachMDCRadio');

		if (this.radioDisabled) {
			this.mdcClasses.push('mdc-radio--disabled');
		}

		$rbtn = $('<div>')
			.attr('id', this.mdcId)
			.addClass(this.mdcClasses.join(' '));

		if (this.mdcAttributes) {
			keys = Object.keys(this.mdcAttributes);
			keys.forEach(function(key) {
				$rbtn.attr(key, _this.mdcAttributes[key]);
			});
		}

		$rbtnInput = $('<input>')
			.attr('id', this.rbtnInputId) 
			.attr('type', 'radio')
			.attr('name', this.radioName)
			.addClass('mdc-radio__native-control')
			.appendTo($rbtn);

		if (this.onRadioClick) {
			$rbtnInput.click(this.onRadioClick);
		}

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
			.attr('for', this.rbtnInputId)
			.text(this.radioLabel)
			.appendTo(this.parentElem);

		$rbtn.appendTo(this.parentElem);

		if (showService) {
			showService.fixElementAndChildren($('#' + this.mdcId));
		}
	},

	getInputId: function(){
		return this.rbtnInputId;
	}
});

// Class MDCSelect
// Description: Creates a material design select menu component
// Options:
//  - preSelected (Boolean): Define a select menu as pre-selected (default = false)
//  - menuChgFunction (Function): Function to occur when 
//  - menuLabel (String): Defines the text label on the select menu.
//  - menuOpts (Array of Objects): Define an array of objects describing each option for the select menu.
//   - Expected option object keys:
//    - value - value when selected
//    - label - label shown to the user
//    - selected - initially selected
//    - disabled - not selected-able
//   - Example: [{"value":"1", "label":"One", "selected":"selected"}, {"value":"2", "label":"Two"}]
var MDCSelect = $n2.Class('MDCSelect', MDC, {

	menuChgFunction: null,
	menuLabel: null,
	menuOpts: null,
	preSelected: null,
	select: null,
	selectId: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			menuChgFunction: null,
			menuLabel: null,
			menuOpts: [],
			preSelected: false
		}, opts_);

		MDC.prototype.initialize.call(this,opts);

		this.menuChgFunction = opts.menuChgFunction;
		this.menuLabel = opts.menuLabel;
		this.menuOpts = opts.menuOpts;
		this.preSelected = opts.preSelected;
		this.selectId = $n2.getUniqueId();
		
		if (!this.parentElem) {
			throw new Error('parentElem must be provided, to add a Material Design Select Component');
		}

		this._generateMDCSelectMenu();
	},

	_generateMDCSelectMenu: function(){
		var $menu, $menuNotchedOutline, $menuNotchedOutlineNotch,  keys;
		var _this = this;

		this.mdcClasses.push('mdc-select', 'mdc-select--outlined', 'n2s_attachMDCSelect');

		$menu = $('<div>')
			.attr('id', this.mdcId)
			.addClass(this.mdcClasses.join(' '));

		if (this.mdcAttributes) {
			keys = Object.keys(this.mdcAttributes);
			keys.forEach(function(key) {
				$menu.attr(key, _this.mdcAttributes[key]);
			});
		}

		$('<i>').addClass('mdc-select__dropdown-icon')
			.appendTo($menu);

		this.select = $('<select>')
			.attr('id', this.selectId)
			.addClass('mdc-select__native-control')
			.appendTo($menu)
			.change(this.menuChgFunction);

		$menuNotchedOutline = $('<div>')
			.addClass('mdc-notched-outline')
			.appendTo($menu);

		$('<div>').addClass('mdc-notched-outline__leading')
			.appendTo($menuNotchedOutline);

		$menuNotchedOutlineNotch = $('<div>')
			.addClass('mdc-notched-outline__notch')
			.appendTo($menuNotchedOutline);

		var label = $('<label>')
			.attr('for', this.selectId)
			.addClass('mdc-floating-label')
			.text(_loc(this.menuLabel))
			.appendTo($menuNotchedOutlineNotch);

		if (this.preSelected) {
			label.addClass('mdc-floating-label--float-above');
		}
	
		$('<div>').addClass('mdc-notched-outline__trailing')
			.appendTo($menuNotchedOutline);	

		if (this.menuOpts 
			&& $n2.isArray(this.menuOpts) 
			&& this.menuOpts.length > 0) {
			this.menuOpts.forEach(function(menuOpt) {
				_this._addOptionToSelectMenu(menuOpt);
			});
		}
		
		$menu.appendTo(this.parentElem);

		if (showService) {
			showService.fixElementAndChildren($('#' + this.mdcId));
		}
	},

	_addOptionToSelectMenu: function(menuOpt){
		var $opt, value, label;
	
		if (menuOpt) {
			if (menuOpt.value) {
				value = menuOpt.value;
			} else {
				value = '';
			}
			
			if (menuOpt.label) {
				label = menuOpt.label;
			}

			if (value || value === '') {
				$opt = $('<option>')
					.attr('value', value)
					.text(label)
					.appendTo(this.select);

				if (menuOpt.selected) {
					$opt.attr('selected', 'selected');
				}

				if (menuOpt.disabled) {
					$opt.attr('disabled', 'disabled');
				}
			}
		}
	},

	getSelectId: function(){
		return this.selectId;
	}
});

// Class MDCTabBar
// Description: Create a material design tab bar component
// Options:
//  - tabs (Array): An array of objects containing tabs labels and onTabClick function, and active.
//   - Example:
//   [{label:"tab 1", onTabClick:tab1ClickFn, active: true},{"label":"tab 2", "onTabClick":tab2ClickFn}]
var MDCTabBar = $n2.Class('MDCTabBar', MDC, {

	tabs: null,

	tabIndex: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			tabs: []
		}, opts_);

		MDC.prototype.initialize.call(this, opts);

		this.tabs = opts.tabs;
		this.tabIndex = 0;

		if (!this.parentElem) {
			throw new Error('parentElem must be provided, to add a Material Design Tab Bar Component');
		}

		this._generateMDCTabBar();
	},

	_generateMDCTabBar: function(){
		var $tabBar, $tabScroller, $tabScrollArea, $tabScrollAreaContent, keys;
		var _this = this;

		this.mdcClasses.push('mdc-tab-bar', 'n2s_attachMDCTabBar');

		$tabBar = $('<div>')
			.attr('id', this.mdcId)
			.attr('role', 'tablist')
			.addClass(this.mdcClasses.join(' '));

		if (this.mdcAttributes) {
			keys = Object.keys(this.mdcAttributes);
			keys.forEach(function(key) {
				$tabBar.attr(key, _this.mdcAttributes[key]);
			});
		}

		$tabScroller = $('<div>')
			.addClass('mdc-tab-scroller')
			.appendTo($tabBar);

		$tabScrollArea = $('<div>')
			.addClass('mdc-tab-scroller__scroll-area')
			.appendTo($tabScroller);

		$tabScrollAreaContent = $('<div>')
			.addClass('mdc-tab-scroller__scroll-content')
			.appendTo($tabScrollArea);

		this.tabs.forEach(function(tab){
			var tabBtn = _this._generateMDCTabButton(tab, _this.tabIndex);
			tabBtn.appendTo($tabScrollAreaContent);
		});

		$tabBar.appendTo(this.parentElem);

		if (showService) {
			showService.fixElementAndChildren($('#' + this.mdcId));
		}
	},

	_generateMDCTabButton: function(tab, index){
		var $tab, $tabContent, $tabIndicator;
		var btnLabel = "";

		if (tab.label) {
			btnLabel = tab.label;
		}

		$tab = $('<button>')
			.addClass('mdc-tab')
			.attr('role', 'tab')
			.attr('aria-selected', false)
			.attr('tabindex', tab.index)
			.click(tab.onTabClick);

		if (tab.active) {
			$tab.attr('aria-selected', true);
			$tab.addClass('mdc-tab--active');
		}

		$tabContent = $('<span>')
			.addClass('mdc-tab__content')
			.appendTo($tab);

		$('<span>')
			.addClass('mdc-tab__text-label')
			.text(btnLabel)
			.appendTo($tabContent);

		$tabIndicator = $('<span>')
			.addClass('mdc-tab-indicator')
			.appendTo($tab);

		if (tab.active) {
			$tabIndicator.addClass('mdc-tab-indicator--active');
		}

		$('<span>')
			.addClass('mdc-tab-indicator__content')
			.addClass('mdc-tab-indicator__content--underline')
			.appendTo($tabIndicator);

		$('<span>')
			.addClass('mdc-tab__ripple')
			.appendTo($tab);

		this.tabIndex += 1;

		return $tab;
	}
}); 

// Class MDCTagBox
// Description: Creates a material design tag box component
// Options:
//  - chips (Array): A collection of strings 
//  - label (String): A label used for the outline of the tag box
var MDCTagBox = $n2.Class('MDCTagBox', MDC, {

	$chipInput: null,
	chips: null,
	label: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			chips: [],
			label: '',
		}, opts_);

		this.chips = opts.chips;
		this.label = opts.label;
		this.inputId = $n2.getUniqueId();

		MDC.prototype.initialize.call(this, opts);

		if (!this.parentElem) {
			throw new Error('parentElem must be provided, to add a Material Design Tag Box Component');
		}

		this._generateMDCTagBox();
	},

	_generateMDCTagBox: function(){
		var $chipSet;

		this.$chipInput = new $n2.mdc.MDCTextField({
			parentElem: this.parentElem,
			mdcClasses: ['n2-tag-box'],
			txtFldInputId: this.inputId,
			txtFldLabel: this.label
		});

		this.parentElem.find('#' + this.$chipInput.getId())
			.find('label')
			.addClass('mdc-floating-label--float-above');

		$chipSet = new $n2.mdc.MDCChipSet({
			parentElem: this.parentElem.find('#' + this.$chipInput.getId()),
			inputChips: true,
			inputId: this.$chipInput.getInputId(),
			chips: this.chips
		});

		// Move input form field into chipset component
		this.parentElem.find('#' + this.$chipInput.getInputId())
			.appendTo(this.parentElem.find('#' + $chipSet.getId()));

		if (showService) {
			showService.fixElementAndChildren($('#' + this.mdcId));
		}
	},

	getInputId: function() {
		return this.inputId;
	}
});

// Class MDCTextField
// Description: Creates a material design text-field component
// Options:
//  - txtFldLabel (String): Defines the text field label.
//  - txtFldOutline (Boolean): Defines if the text-field should be outlined (default = true).
//  - txtFldInputId (String): Defines the id of input or text-area element.
//  - txtFldArea (Boolean): Defines if the text-field input should be a text-field-area (default = false).
//  - passwordFld (Boolean): Sets the text-field type as password if true (default = false).
//  - prefilled (String): Sets a prefilled value for the text field.
//  - inputRequired (Boolean): Defines if the text-field is required field or not (default = false).
var MDCTextField = $n2.Class('MDCTextField', MDC, {

	txtFldLabel: null,
	txtFldOutline: null,
	txtFldArea: null,
	txtFldFullWidth: null,
	txtFldInputId: null,
	passwordFld: null,
	prefilled: null,
	inputRequired: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			txtFldLabel: null,
			txtFldOutline: true,
			txtFldInputId: null,
			txtFldArea: false,
			txtFldFullWidth: null,
			passwordFld: false,
			prefilled: null,
			inputRequired: false,
		}, opts_);

		MDC.prototype.initialize.call(this,opts);

		this.txtFldLabel = opts.txtFldLabel;
		this.txtFldOutline = opts.txtFldOutline;
		this.txtFldInputId = opts.txtFldInputId;
		this.txtFldArea = opts.txtFldArea;
		this.txtFldFullWidth = opts.txtFldFullWidth;
		this.passwordFld = opts.passwordFld;
		this.prefilled = opts.prefilled;
		this.inputRequired = opts.inputRequired;
		
		if (!this.parentElem) {
			throw new Error('parentElem must be provided, to add a Material Design Text Field Component');
		}

		this._generateMDCTextField();
	},
	_generateMDCTextField: function(){
		var $txtFld, $txtFldInput, $txtFldLabel, $txtFldOutline, $txtFldOutlineNotch, keys;
		var _this = this;

		if (!this.txtFldInputId) {
			this.txtFldInputId = $n2.getUniqueId();
		}

		this.mdcClasses.push('mdc-text-field', 'n2s_attachMDCTextField');

		if (this.txtFldArea) {
			this.mdcClasses.push('mdc-text-field--textarea');
		} else if (this.txtFldFullWidth) {
			this.mdcClasses.push('mdc-text-field--fullwidth');
			this.txtFldOutline = false;

		} else if (this.txtFldOutline) {
			this.mdcClasses.push('mdc-text-field--outlined');
		}

		$txtFld = $('<div>')
			.attr('id', this.mdcId)
			.addClass(this.mdcClasses.join(' '));

		if (this.mdcAttributes) {
			keys = Object.keys(this.mdcAttributes);
			keys.forEach(function(key) {
				$txtFld.attr(key, _this.mdcAttributes[key]);
			});
		}

		if (this.txtFldArea) {
			$txtFldInput = $('<textarea>')
				.addClass('mdc-text-field__input')
				.attr('id', this.txtFldInputId)
				.attr('rows', '8')
				.attr('cols', '40');

		} else {
			$txtFldInput = $('<input>')
				.addClass('mdc-text-field__input')
				.attr('id', this.txtFldInputId)
				.attr('type', 'text');
		}

		if (this.passwordFld) {
			$txtFldInput.attr('type', 'password');
		}

		if (this.prefilled) {
			$txtFldInput.val(this.prefilled);
		}
		
		$txtFld.append($txtFldInput);

		if (this.txtFldOutline || this.txtFldArea) {	
			$txtFldOutline = $('<div>')
				.addClass('mdc-notched-outline')
				.appendTo($txtFld);
		
			$('<div>').addClass('mdc-notched-outline__leading')
				.appendTo($txtFldOutline);
		
			$txtFldOutlineNotch = $('<div>')
				.addClass('mdc-notched-outline__notch')
				.appendTo($txtFldOutline);
			
			$txtFldLabel = $('<label>')
				.attr('for', this.txtFldInputId)
				.addClass('mdc-floating-label')
				.text(_loc(this.txtFldLabel))
				.appendTo($txtFldOutlineNotch);

			if (this.prefilled) {
				$txtFldLabel.addClass('mdc-floating-label--float-above');	
			}
		
			$('<div>')
				.addClass('mdc-notched-outline__trailing')
				.appendTo($txtFldOutline);

		} else if (this.txtFldFullWidth) {
			// do nothing

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

		$txtFld.appendTo(this.parentElem);

		if (showService) {
			showService.fixElementAndChildren($('#' + this.mdcId));
		}
	},

	getInputId: function(){
		return this.txtFldInputId;
	}
});

// Class MDCTopAppBar
// Description: Create a material design top app bar component
var MDCTopAppBar = $n2.Class('MDCTopAppBar', MDC, {

	barTitle: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			barTitle: null
		}, opts_);

		MDC.prototype.initialize.call(this, opts);
		
		this.barTitle = opts.barTitle;
		this._generateMDCTopAppBar();
	},

	_generateMDCTopAppBar: function(){
		var $topAppBar, $topAppBarRow, $topAppBarRSection, $topAppBarLSection,keys;
		var _this = this;

		this.mdcClasses.push('mdc-top-app-bar', 'n2s_attachMDCTopAppBar');

		$topAppBar = $('<header>')
			.attr('id', this.mdcId)
			.addClass(this.mdcClasses.join(' '));

		if (this.mdcAttributes) {
			keys = Object.keys(this.mdcAttributes);
			keys.forEach(function(key) {
				$topAppBar.attr(key, _this.mdcAttributes[key]);
			});
		}

		$topAppBarRow = $('<div>')
			.addClass('mdc-top-app-bar__row')
			.appendTo($topAppBar);

		$topAppBarLSection = $('<section>')
			.addClass('mdc-top-app-bar__section mdc-top-app-bar__section--align-start')
			.appendTo($topAppBarRow);

		$('<a>').attr('href', '#')
			.attr('id', 'hamburger_menu_btn')
			.addClass('material-icons mdc-top-app-bar__navigation-icon')
			.css('text-decoration', 'none')
			.text('☰')
			.appendTo($topAppBarLSection);

		$('<span>').addClass('mdc-top-app-bar__title')
			.text(this.barTitle)
			.appendTo($topAppBarLSection);

		$topAppBarRSection = $('<section>')
			.addClass('mdc-top-app-bar__section mdc-top-app-bar__section--align-end')
			.appendTo($topAppBarRow);

		$('<a>').attr('id', 'login')
			.addClass('nunaliit_login mdc-top-app-bar__action-item')
			.appendTo($topAppBarRSection);

		$topAppBar.prependTo($('body'));

		if (showService) {
			showService.fixElementAndChildren($('#' + this.mdcId));
		}
	}
});

$n2.mdc = {
	Service: Service,
	MDC: MDC,
	MDCButton: MDCButton,
	MDCCheckbox: MDCCheckbox,
	MDCChipSet: MDCChipSet,
	MDCDialog: MDCDialog,
	MDCDrawer: MDCDrawer,
	MDCFormField: MDCFormField,
	MDCList: MDCList,
	MDCMenu: MDCMenu,
	MDCRadio: MDCRadio,
	MDCSelect: MDCSelect,
	MDCTabBar: MDCTabBar,
	MDCTagBox: MDCTagBox, 
	MDCTextField: MDCTextField,
	MDCTopAppBar: MDCTopAppBar
};

})(jQuery,nunaliit2);
