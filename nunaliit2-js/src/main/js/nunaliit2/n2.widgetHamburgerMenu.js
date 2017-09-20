/*
Copyright (c) 2017, Geomatics and Cartographic Research Centre, Carleton 
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
 _loc = function(str,args){ return $n2.loc(str,"nunaliit2",args); }
 ,DH = "n2.widgetHamburgerMenu"
 ;

 /*
  *  Hamburger Menu Widget Options
  * -------------------------------
  *  menuTitle: String representing the menu title (default is the atlas title)
  *  moduleName: String representing the module name (default is the module name)
  *  containerClass: Name of the container class for the hamburger menu widget
  *  
  */
 
//--------------------------------------------------------------------------
var HamburgerMenuWidget = new $n2.Class("HamburgerMenuWidget",{

	dispatchService: null,
	navigationService: null,
	showService: null,
	menuId: null,
	menuTitle: null,
	moduleName: null,
	containerClass: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null
			,navigationService: null
			,showService: null
			,menuTitle: null
			,moduleName: null
			,containerClass: null
		},opts_);

		this.dispatchService = opts.dispatchService;
		this.navigationService = opts.navigationService;
		this.showService = opts.showService;
		this.menuId = $n2.getUniqueId();

		if (opts.containerClass) {
			this.containerClass = opts.containerClass;
		};

		// Set Menu Title
		if (opts.menuTitle) {
			this.menuTitle = opts.menuTitle;

		} else {
			this.menuTitle = undefined;
		};

		// Set Module Title
		if (opts.moduleName) {
			this.moduleName = opts.moduleName;
		} else {
			this.moduleName = undefined;
		};

		this._addMenu();

		$n2.log(this._classname,this);
	},

	_addMenu: function(){
		
		var _this = this;

		// Create a Hamburger Menu container template
		// Includes a menu title, module name and close button
		var $hamburgerMenu = $("<div>")
			.addClass("n2widget_hamburger n2widget_createDocumentFromSchema")
			.appendTo("." + this.containerClass);

		var $menuHeader = $("<div>")
			.addClass("n2widget_hamburger_header")
			.appendTo($hamburgerMenu);

		var $menuTitle = $("<div>")
			.addClass("n2widget_hamburger_header_menu_title")
			.appendTo($menuHeader);

		var $menuTitleSpan = $("<span>")
			.addClass("n2widget_hamburger_header_menu_title_text")
			.appendTo($menuTitle);

		var $menuModuleName = $("<div>")
			.addClass("n2widget_hamburger_header_module_name")
			.appendTo($menuHeader);

		var $moduleNameSpan = $("<span>")
			.addClass("n2widget_hamburger_header_module_name_text")
			.appendTo($menuModuleName);

		// Add Menu Title
		_this._addMenuTitle();

		// Add Module Name
		_this._addModuleName();

		// Add existing navigation items to empty hamburger menu
		_this._addNavigationItems();

		if (this.showService) {
			this.showService.fixElementAndChildren($hamburgerMenu, {});
		};
	},
	_addMenuTitle: function(){

		var $menuTitleSpan = $(".n2widget_hamburger_header_menu_title_text");

		if ($menuTitleSpan) {
			if (this.menuTitle) {
				$menuTitleSpan.text( _loc(this.menuTitle))
			} else if (this.navigationService) {
				this.navigationService.printTitle({
					elem: $menuTitleSpan
				});
			};
		} else {
			$n2.log("Can't add menu title, .n2widget_hamburger_header_menu_title_text is missing");
		};
	},
	_addModuleName: function(){

		var $moduleNameSpan = $(".n2widget_hamburger_header_module_name_text");		

		if ($moduleNameSpan) {
			if (this.moduleName) {
				$moduleNameSpan.text( _loc(this.moduleName));
			} else if (this.showService && this.dispatchService) {
				var currentModuleMsg = {
					type: "moduleGetCurrent"
				};
				this.dispatchService.synchronousCall(DH,currentModuleMsg);
				var moduleId = currentModuleMsg.moduleId;
				if (moduleId) {
					$moduleNameSpan.addClass("n2s_insertModuleName");
					$moduleNameSpan.attr("nunaliit-document",moduleId);
				};
			};
		} else {
			$n2.log("Can't add module name, .n2widget_hamburger_header_module_name_text is missing");
		};
	},
	_addNavigationItems: function(){

		var $hamburgerMenu = $(".n2widget_hamburger");		

		if ($hamburgerMenu) {
			// Insert navigation items to hamburger drawer menu
			if (this.navigationService) {	
				var $menuContent = $("<div>")
					.addClass("n2widget_hamburger_menu")
					.appendTo($hamburgerMenu);
				this.navigationService.printMenu({
					elem: $menuContent
				});
			};			
		} else {
			$n2.log("Can't add navigation items, .n2widget_hamburger_menu is missing");
		};	
	}
});

//--------------------------------------------------------------------------
function HandleWidgetAvailableRequests(m){
	if( m.widgetType === 'hamburgerMenuWidget' ){
		m.isAvailable = true;
    }
};

//--------------------------------------------------------------------------
function HandleWidgetDisplayRequests(m){
	if( m.widgetType === 'hamburgerMenuWidget' ){
		var widgetOptions = m.widgetOptions;
		var config = m.config;
		
		var options = {};
		
		if( widgetOptions ){
			for(var key in widgetOptions){
				var value = widgetOptions[key];
				options[key] = value;
			};
		};
		
		if( config ){
			options.config = config;

			if( config.directory ){
				options.dispatchService = config.directory.dispatchService;
				options.showService = config.directory.showService;
				options.navigationService = config.directory.navigationService;
			};
		};
		
		new HamburgerMenuWidget(options);
    };
};

//--------------------------------------------------------------------------
$n2.widgetHamburgerMenu = {
	HamburgerMenuWidget: HamburgerMenuWidget
	,HandleWidgetAvailableRequests: HandleWidgetAvailableRequests
	,HandleWidgetDisplayRequests: HandleWidgetDisplayRequests
};

})(jQuery,nunaliit2);

