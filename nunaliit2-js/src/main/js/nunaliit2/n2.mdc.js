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
//  - parentId (String): The parent element that the component is appended to (Optional). If no parentId is provided, the document fragment is returned. Note: If the document fragment is returned, the fragment will need to be attached through the show service using fixElementAndChildren.
//  - mdcId (String): The id of the element. If none is provided, Nunaliit will generate a unique id.
//  - mdcClasses (Array): Specific classes to added to the component.
//  - mdcAttributes (Object): Unique attributes to be added to the component.
var MDC = $n2.Class('MDC',{

	parentId: null,
	mdcId: null,
	mdcClasses: null,
	mdcAttributes: null,
	docFragment: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			parentId: null,
			mdcId: null,
			mdcClasses: [],
			mdcAttributes: null
		}, opts_);

		this.parentId = opts.parentId;
		this.mdcId = opts.mdcId;
		this.mdcClasses = opts.mdcClasses;
		this.mdcAttributes = opts.mdcAttributes;

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

		this._generateMDCButton();
	},

	_generateMDCButton: function(){
		var btn, label, keys;
		var _this = this;

		this.mdcClasses.push('mdc-button', 'n2s_attachMDCButton');

		if (this.btnRaised) {
			this.mdcClasses.push('mdc-button--raised');
		}

		this.docFragment = document.createDocumentFragment();

		btn = document.createElement('button');
		btn.setAttribute('id', this.mdcId);
		this.mdcClasses.forEach(function(className){
			btn.classList.add(className);
		});
		this.docFragment.appendChild(btn);
	
		label = document.createElement('span');
		label.classList.add('mdc-button__label');
		label.textContent = this.btnLabel;
		btn.appendChild(label);

		if (this.onBtnClick) {
			btn.addEventListener('click', this.onBtnClick);
		}

		if (this.mdcAttributes) {
			keys = Object.keys(this.mdcAttributes);
			keys.forEach(function(key) {
				btn.setAttribute(key, _this.mdcAttributes[key]);
			});
		}
		
		if (this.docFragment){	
			if (!this.parentId) {
				return this.docFragment;
			} else {
					document.getElementById(this.parentId).appendChild(this.docFragment);
			}
		}

		if (showService) {
			showService.fixElementAndChildren($('#' + this.mdcId));
		}
	}
});

// Class MDCCheckbox
// Description: Creates a material design checkbox component
// Options:
//  - chkboxLabel (String): A string containing the radio button label.
//  - chkboxName (String): A string containing the radio button name.
//  - chkboxChecked (Boolean): If true, the radio button is checked (default = false).
//  - chkboxDisabled (Boolean): If true, the radio button is disabled (default = false). 
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

		this._generateMDCCheckbox();
	},

	_generateMDCCheckbox: function(){
		var chkbox, chkboxInput, chkboxBackground, chkboxMixedMark, chkboxLabel, keys;
		var _this = this;

		this.mdcClasses.push('mdc-checkbox', 'n2s_attachMDCCheckbox');

		if (this.chkboxDisabled) {
			this.mdcClasses.push('mdc-checkbox--disabled');
		}

		this.docFragment = document.createDocumentFragment();
		chkbox = document.createElement('div');
		chkbox.setAttribute('id', this.mdcId);
		this.mdcClasses.forEach(function(className){
			chkbox.classList.add(className);
		});
		this.docFragment.appendChild(chkbox);

		if (this.mdcAttributes) {
			keys = Object.keys(this.mdcAttributes);
			keys.forEach(function(key) {
				chkbox.setAttribute(key, _this.mdcAttributes[key]);
			});
		}

		chkboxInput = document.createElement('input');
		chkboxInput.setAttribute('id', this.chkboxInputId);
		chkboxInput.setAttribute('type', 'checkbox');
		chkboxInput.setAttribute('name', this.chkboxName);
		chkboxInput.classList.add('mdc-checkbox__native-control');
		chkbox.appendChild(chkboxInput);

		if (this.chkboxChgFunc) {
			chkboxInput.addEventListener('change', this.chkboxChgFunc);
		}

		if (this.chkboxChecked) {
			chkboxInput.setAttribute('checked', 'checked');
		}

		chkboxBackground = document.createElement('div');
		chkboxBackground.classList.add('mdc-checkbox__background');
		chkbox.appendChild(chkboxBackground);

		chkboxBackground.insertAdjacentHTML('afterbegin', '<svg class="mdc-checkbox__checkmark" viewBox="0 0 24 24"><path class="mdc-checkbox__checkmark-path" fill="none" d="M1.73,12.91 8.1,19.28 22.79,4.59" /></svg>');

		chkboxMixedMark = document.createElement('div');
		chkboxMixedMark.classList.add('mdc-checkbox__mixedmark');
		chkboxBackground.appendChild(chkboxMixedMark);

		chkboxLabel = document.createElement('label');
		chkboxLabel.setAttribute('for', this.chkboxInputId);
		chkboxLabel.textContent = _loc(this.chkboxLabel);
		this.docFragment.appendChild(chkboxLabel);

		if (this.docFragment){	
			if (!this.parentId) {
				return this.docFragment;
			} else {
				document.getElementById(this.parentId).appendChild(this.docFragment);
			}
		}

		if (showService) {
			showService.fixElementAndChildren($('#' + this.mdcId));
		}
	},

	getInputId: function() {
		return this.chkboxInputId;
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
		var dialogContainer, dialogSurface, dialogTitle, dialogMessage, dialogScrim, footer, keys;
		var _this = this;
		var content = "";

		this.mdcClasses.push('mdc-dialog');

		if (this.scrollable) {
			this.mdcClasses.push('mdc-dialog--scrollable');
		}

		this.docFragment = document.createDocumentFragment();
		MDCDialogElement = document.createElement('div');
		MDCDialogElement.setAttribute('id', this.mdcId);
		MDCDialogElement.setAttribute('role', 'alertdialog');
		MDCDialogElement.setAttribute('aria-modal', 'true');
		MDCDialogElement.setAttribute('aria-labelledby', 'my-dialog-title');
		MDCDialogElement.setAttribute('aria-describedby', 'my-dialog-content');
		this.mdcClasses.forEach(function(className){
			MDCDialogElement.classList.add(className);
		});
		this.docFragment.appendChild(MDCDialogElement);

		if (this.mdcAttributes) {
			keys = Object.keys(this.mdcAttributes);
			keys.forEach(function(key) {
				MDCDialogElement.setAttribute(key, _this.mdcAttributes[key]);
			});
		}

		dialogContainer = document.createElement('div');
		dialogContainer.classList.add('mdc-dialog__container');
		MDCDialogElement.appendChild(dialogContainer);

		dialogSurface = document.createElement('div');
		dialogSurface.classList.add('mdc-dialog__surface');
		dialogContainer.appendChild(dialogSurface);

		dialogTitle = document.createElement('h2');
		dialogTitle.classList.add('mdc-dialog__title');
		dialogTitle.textContent = _loc(this.dialogTitle);
		dialogSurface.appendChild(dialogTitle);

		dialogMessage = document.createElement('div');
		dialogMessage.setAttribute('id', this.contentId);
		dialogMessage.classList.add('mdc-dialog__content');
		dialogMessage.textContent = content;
		dialogSurface.appendChild(dialogMessage);

		if (this.dialogHtmlContent) {
			dialogMessage.insertAdjacentHTML('afterbegin', _loc(this.dialogHtmlContent));
		} else if (this.dialogTextContent) {
			dialogMessage.textContent = _loc(this.dialogTextContent);
		}

		footer = document.createElement('footer');
		footer.setAttribute('id', this.footerId);
		footer.classList.add('mdc-dialog__actions');
		dialogSurface.appendChild(footer);

		dialogScrim = document.createElement('div');
		dialogScrim.classList.add('mdc-dialog__scrim');
		dialogScrim.addEventListener('click', _this.closeDialog);
		MDCDialogElement.appendChild(dialogScrim);

		// Attach mdc component to dialog
		this._attachDialog(this.mdcId);

		document.body.appendChild(this.docFragment);

		if (this.closeBtn) {
			this.addCloseBtn();
		}
		
		this.openDialog();
	},

	_attachDialog: function(dialogId){
		var dialog = this.docFragment.getElementById(dialogId);
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
//  - navHeaderTitle (String): Nav-Bar Header Title
//  - navHeaderSubTitle (String): Nav-Bar Sub-Header Title
//  - navItems (Array): An array of objects containing link text, href URL, and activated status
//   - navItems Example: 
//   [
//   	{"href":"https://gcrc.carleton.ca", "text":"GCRC", "activated":true}, 
//   	{"href":"https://nunaliit.org", "text":"Nunaliit"}
//   ]
var MDCDrawer = $n2.Class('MDCDrawer', MDC, {

	hamburgerDrawer: null,
	navHeaderTitle: null,
	navHeaderSubTitle: null,
	navItems: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			hamburgerDrawer: false,
			navHeaderTitle: null,
			navHeaderSubTitle: null,
			navItems: null
		}, opts_);

		MDC.prototype.initialize.call(this, opts);

		this.hamburgerDrawer = opts.hamburgerDrawer;
		this.navHeaderTitle = opts.navHeaderTitle;
		this.navHeaderSubTitle = opts.navHeaderSubTitle;
		this.navItems = opts.navItems;
		this.navId = $n2.getUniqueId();
		this.navContentId = $n2.getUniqueId();

		this._generateMDCDrawer();
	},

	_generateMDCDrawer: function(){
		var drawer, drawerContent, drawerHeader, drawerHeaderTitle, drawerHeaderSubTitle, drawerNav, drawerScrim, keys;
		var _this = this;

		this.mdcClasses.push('mdc-drawer', 'mdc-drawer--modal', 'n2s_attachMDCDrawer');

		if (this.hamburgerDrawer) {
			this.mdcClasses.push('nunaliit_hamburger_drawer');
		}
	
		this.docFragment = document.createDocumentFragment();
		
		drawer = document.createElement('aside');
		drawer.setAttribute('id', this.mdcId);
		this.mdcClasses.forEach(function(className){
			drawer.classList.add(className);
		});

		if (this.mdcAttributes) {
			keys = Object.keys(this.mdcAttributes);
			keys.forEach(function(key) {
				drawer.setAttribute(key, _this.mdcAttributes[key]);
			});
		}
		this.docFragment.appendChild(drawer);

		if (this.navHeaderTitle || this.navHeaderSubTitle) {
			drawerHeader = document.createElement('div');
			drawerHeader.classList.add('mdc-drawer__header');
			drawer.appendChild(drawerHeader);

			if (this.navHeaderTitle) {
				drawerHeaderTitle = document.createElement('h3');
				drawerHeaderTitle.classList.add('mdc-drawer__title');
				drawerHeaderTitle.textContent = this.navHeaderTitle;
				drawerHeader.appendChild(drawerHeaderTitle);
			}

			if (this.navHeaderSubTitle) {
				drawerHeaderSubTitle = document.createElement('h6');
				drawerHeaderSubTitle.classList.add('mdc-drawer__subtitle');
				drawerHeaderSubTitle.textContent = this.navHeaderSubTitle;
				drawerHeader.appendChild(drawerHeaderSubTitle);
			}
		}

		drawerContent = document.createElement('div');
		drawerContent.setAttribute('id', this.navContentId);
		drawerContent.classList.add('mdc-drawer__content');
		drawer.appendChild(drawerContent);

		drawerNav = new $n2.mdc.MDCList({
			navList: true,
			listItems: this.navItems
		});
		drawerContent.appendChild(drawerNav.docFragment);		
		
		drawerScrim = document.createElement('div');
		drawerScrim.classList.add('mdc-drawer-scrim');
		this.docFragment.appendChild(drawerScrim);

		// doc fragment needs to be prepended to body.
		document.body.insertBefore(this.docFragment, document.body.firstChild);

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

		this._generateMDCFormField();
	},

	_generateMDCFormField: function(){
		var formField, keys;
		var _this = this;

		this.mdcClasses.push('mdc-form-field', 'n2s_attachMDCFormField');

		this.docFragment = document.createDocumentFragment();
		formField = document.createElement('div');
		formField.setAttribute('id', this.mdcId);
		this.mdcClasses.forEach(function(className){
			formField.classList.add(className);
		});
		this.docFragment.appendChild(formField);

		if (this.mdcAttributes) {
			keys = Object.keys(this.mdcAttributes);
			keys.forEach(function(key) {
				formField.setAttribute(key, _this.mdcAttributes[key]);
			});
		}

		if (this.docFragment){	
			if (!this.parentId) {
				return this.docFragment;
			} else {
				document.getElementById(this.parentId).appendChild(this.docFragment);
			}
		}

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

		this._generateMDCList();
	},

	_generateMDCList: function(){
		var list, item, keys;
		var _this = this;

		this.mdcClasses.push('mdc-list', 'n2s_attachMDCList');

		this.docFragment = document.createDocumentFragment();

		if (this.navList) {
			list = document.createElement('nav');
		} else {
			list = document.createElement('ul');
		}

		list.setAttribute('id', this.mdcId);
		list.setAttribute('role', 'menu');
		list.setAttribute('aria-hidden', 'true');
		list.setAttribute('aria-orientation', 'vertical');
		list.setAttribute('tab-index', '-1');
		this.mdcClasses.forEach(function(className){
			list.classList.add(className);
		});
		this.docFragment.appendChild(list);

		if (this.mdcAttributes) {
			keys = Object.keys(this.mdcAttributes);
			keys.forEach(function(key) {
				list.setAttribute(key, _this.mdcAttributes[key]);
			});
		}

		if (this.listItems && $n2.isArray(this.listItems)){
			this.listItems.forEach(function(listItem){
				item = _this._generateMDCListItem(listItem);
				list.appendChild(item);
			});
		}

		if (this.docFragment){	
			if (!this.parentId) {
				return this.docFragment;
			} else {
				document.getElementById(this.parentId).appendChild(this.docFragment);
			}
		}

		if (showService) {
			showService.fixElementAndChildren($('#' + this.mdcId));
		}
	},

	_generateMDCListItem: function(item){
		var listItem, listItemText;
		
		if (this.navList) {
			listItem = document.createElement('a');
		} else {
			listItem = document.createElement('li');
		}

		listItem.setAttribute('role', 'menuitem');
		listItem.setAttribute('tabindex', '-1');
		listItem.classList.add('mdc-list-item');
			

		if (item.activated) {
			listItem.setAttribute('tabIndex', '0');
			listItem.setAttribute('aria-selected', true);
			listItem.classList.add('mdc-list-item--activated');
		}

		if (item.href && typeof item.href === 'string') {
			listItem.setAttribute('href', item.href);
		}

		if (item.text && typeof item.text === 'string') {
			listItemText = document.createElement('span');
			listItemText.classList.add('mdc-list-item__text');
			listItemText.textContent = item.text;

			if (item.onItemClick) {
				listItemText.addEventListener('click', item.onItemClick);
			}

			listItem.appendChild(listItemText);
		}

		return listItem;
	}
}); 

// Class MDCMenu
// Description: Create a material design menu component
// Options:
//  - anchorBtnId (string): The id of the button associated with the menu
var MDCMenu = $n2.Class('MDCMenu', MDC, {
	
	anchorBtnId: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			anchorBtnId: null,
		}, opts_);

		MDC.prototype.initialize.call(this, opts);

		this.anchorBtnId = opts.anchorBtnId;
		this.menuId = $n2.getUniqueId();

		if (!this.anchorBtnId) {
					throw new Error('Anchor Btn Id required for creation of a MDCMenu Object');
		}

		this._generateMDCMenu();
	},

	_generateMDCMenu: function(){
		var menu, menuSurfaceAnchor, keys;
		var _this = this;

		this.mdcClasses.push('mdc-menu-surface--anchor');

		this.docFragment = document.createDocumentFragment();

		menuSurfaceAnchor = document.createElement('div');
		menuSurfaceAnchor.setAttribute('id', this.mdcId);
		this.mdcClasses.forEach(function(className){
			menuSurfaceAnchor.classList.add(className);
		});
		this.docFragment.appendChild(menuSurfaceAnchor);
		
		menu = document.createElement('div');
		menu.setAttribute('id', this.menuId);
		menu.setAttribute('n2associatedmdc', this.anchorBtnId);
		menu.classList.add('mdc-menu', 'mdc-menu-surface', 'n2s_attachMDCMenu');
		menuSurfaceAnchor.appendChild(menu);

		if (this.mdcAttributes) {
			keys = Object.keys(this.mdcAttributes);
			keys.forEach(function(key) {
				menu.setAttribute(key, _this.mdcAttributes[key]);
			});
		}

		if (this.docFragment){	
			if (!this.parentId) {
				return this.docFragment;
			} else {
				document.getElementById(this.parentId).appendChild(this.docFragment);
			}
		}

		if (showService) {
			showService.fixElementAndChildren($('#' + this.mdcId));
		}
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

		this._generateMDCRadio();
	},

	_generateMDCRadio: function(){
		var $rbtn, $rbtnInput, $rbtnBackground, keys;
		var _this = this;

		this.mdcClasses.push('mdc-radio', 'n2s_attachMDCRadio');

		if (this.radioDisabled) {
			this.mdcClasses.push('mdc-radio--disabled');
		}

		this.docFragment = $(document.createDocumentFragment());
		$rbtn = $('<div>')
			.attr('id', this.mdcId)
			.addClass(this.mdcClasses.join(' '))
			.appendTo(this.docFragment);

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
			.appendTo($('#' + this.parentId));

		if (this.docFragment){	
			if (!this.parentId) {
				return this.docFragment;
			} else {
				this.docFragment.appendTo($('#' + this.parentId));
			}
		}

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

		this._generateMDCSelectMenu();
	},

	_generateMDCSelectMenu: function(){
		var $menu, $menuNotchedOutline, $menuNotchedOutlineNotch,  keys;
		var _this = this;

		this.mdcClasses.push('mdc-select', 'mdc-select--outlined', 'n2s_attachMDCSelect');

		this.docFragment = $(document.createDocumentFragment());
		$menu = $('<div>')
			.attr('id', this.mdcId)
			.addClass(this.mdcClasses.join(' '))
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

		this.select = $('<select>')
			.attr('id', this.selectId)
			.addClass('mdc-select__native-control')
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

		var label = $('<label>')
			.attr('for', this.selectId)
			.addClass('mdc-floating-label')
			.text(_loc(this.menuLabel))
			.appendTo($menuNotchedOutlineNotch);

		if (this.preSelected) {
			label.addClass('mdc-floating-label--float-above');
		}
	
		$('<div>')
			.addClass('mdc-notched-outline__trailing')
			.appendTo($menuNotchedOutline);	

		if (this.menuOpts 
			&& $n2.isArray(this.menuOpts) 
			&& this.menuOpts.length > 0) {
			this.menuOpts.forEach(function(menuOpt) {
				_this._addOptionToSelectMenu(menuOpt);
			});
		}
		
		if (this.docFragment){	
			if (!this.parentId) {
				return this.docFragment;
			} else {
				this.docFragment.appendTo($('#' + this.parentId));
			}
		}

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
					.attr('label', label)
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
	txtFldInputId: null,
	txtFldArea: null,
	passwordFld: null,
	prefilled: null,
	inputRequired: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			txtFldLabel: null,
			txtFldOutline: true,
			txtFldInputId: null,
			txtFldArea: false,
			passwordFld: false,
			prefilled: null,
			inputRequired: false,
		}, opts_);

		MDC.prototype.initialize.call(this,opts);

		this.txtFldLabel = opts.txtFldLabel;
		this.txtFldOutline = opts.txtFldOutline;
		this.txtFldInputId = opts.txtFldInputId;
		this.txtFldArea = opts.txtFldArea;
		this.passwordFld = opts.passwordFld;
		this.prefilled = opts.prefilled;
		this.inputRequired = opts.inputRequired;

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
		
			$('<div>')
				.addClass('mdc-notched-outline__leading')
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

		if (this.docFragment){	
			if (!this.parentId) {
				return this.docFragment;
			} else {
				this.docFragment.appendTo($('#' + this.parentId));
			}
		}

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

		this.docFragment = $(document.createDocumentFragment());
		$topAppBar = $('<header>')
			.attr('id', this.mdcId)
			.addClass(this.mdcClasses.join(' '))
			.appendTo(this.docFragment);

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

		this.docFragment.prependTo($('body'));

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
	MDCDialog: MDCDialog,
	MDCDrawer: MDCDrawer,
	MDCFormField: MDCFormField,
	MDCList: MDCList,
	MDCMenu: MDCMenu,
	MDCRadio: MDCRadio,
	MDCSelect: MDCSelect,
	MDCTextField: MDCTextField,
	MDCTopAppBar: MDCTopAppBar
};

})(jQuery,nunaliit2);
