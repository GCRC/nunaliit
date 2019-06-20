/*
Copyright (c) 2015, Geomatics and Cartographic Research Centre, Carleton 
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

var 
	_loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); }
	,DH = 'n2.couchNavigation'
	;

//=========================================================================
function setNavElementAsCurrentModule($elem){
	$elem.addClass('n2_nav_currentModule mdc-list-item--activated');
	$elem.parents('.n2nav_setChildModuleCurrent').addClass('n2_nav_childModuleCurrent');
};
	
//=========================================================================	
var NavigationDisplay = $n2.Class({
	
	dispatchService: null,
	
	showService: null,
	
	navigationDoc: null,
	
	elemId: null,

	hamburgerMenu: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null
			,showService: null
			,navigationDoc: null
			,elem: null
			,hamburgerMenu: false
		},opts_);
		
		this.dispatchService = opts.dispatchService;
		this.showService = opts.showService;
		this.navigationDoc = opts.navigationDoc;
		this.hamburgerMenu = opts.hamburgerMenu;
		
		var $elem = $(opts.elem);
		this.elemId = $n2.utils.getElementIdentifier($elem);
		
		this._display();
	},
	
	_display: function(){
		var _this = this;
		var $nav = $('#'+this.elemId);
		var doc = this.navigationDoc;
		
		if( doc && doc.nunaliit_navigation && $nav.length > 0 ){
			// Get current module identifier
			var msg = {
				type: 'moduleGetCurrent'
			};
			this.dispatchService.synchronousCall(DH,msg);
			var currentModuleId = msg.moduleId;

			// Navigation menu
			$nav.empty();
			
			if( doc.nunaliit_navigation.items 
			 && doc.nunaliit_navigation.items.length > 0 ) {
				var $list = $('<ul>')
					.addClass('n2nav_setChildModuleCurrent')
					.appendTo($nav);
				
				insertItems($list, doc.nunaliit_navigation.items, currentModuleId);
			}
			
			if( this.showService ){
				this.showService.fixElementAndChildren($nav);
			}
		}
		
		function insertItems($list, items, currentModuleId){
			for(var i=0,e=items.length; i<e; ++i){
				var item = items[i];
				var $listItem, $listItemText;
				
				$listItem = $('<li>')
					.addClass('n2nav_setChildModuleCurrent')
					.appendTo($list);
				
				if( item.key ){
					$listItem.attr('n2nav-key',item.key);
				}

				if( item.title && item.href ) {
					// Compute module class
					var moduleId = null;
					var url = new $n2.url.Url({
						url: item.href
					});
					
					if( url ){
						moduleId = url.getParamValue('module',null);
					}

					if( moduleId ){
						$listItem.attr('n2nav-module',moduleId);
						$listItem.addClass('n2nav_setModuleCurrent');
					}
					
					if( moduleId && moduleId === currentModuleId ){
						setNavElementAsCurrentModule($listItem);
					}
					
					var title = _loc(item.title);

					if ( _this.hamburgerMenu ){
						$listItemText = $('<span>')
							.text(title)
							.addClass('mdc-list-item__text')
							.appendTo($listItem);

					} else {
						$listItemText = $('<a>')
						.attr('href',item.href)
						.text(title)
						.appendTo($listItem);
					}
					
				} else if( item.module ) {
					// Compute URL based on current one
					var currentUrl = $n2.url.getCurrentLocation();
					var moduleUrl = currentUrl
						.clone()
						.setHash(null)
						.setParamValue('module',item.module);
				
					// Install module class
					$listItem.attr('n2nav-module',item.module);
					$listItem.addClass('n2nav_setModuleCurrent');
					
					if( item.module === currentModuleId ){
						setNavElementAsCurrentModule($listItem);
					}
					
					$listItemText = $('<a>')
						.attr('href',moduleUrl.getUrl())
						.appendTo($listItem);

					if( item.title ){
						var title = _loc(item.title);
						$listItemText.text(title);
					} else {
						// Obtain title from show service
						$listItemText.attr('nunaliit-document',item.module);
						$listItemText.addClass('n2s_insertModuleName');
						$listItemText.text(item.module);
					}
						
				} else if( item.title ) {
					$('<span>')
						.text(_loc(item.title))
						.appendTo($listItem);
				}
				
				if( item.items && item.items.length > 0 ){
					var $innerList;
					
					$innerList = $('<ul>')
						.addClass('n2nav_setChildModuleCurrent')
						.appendTo($listItem);

					insertItems($innerList, item.items, currentModuleId);
				}
			}
		};
	}
});
	
//=========================================================================	
var NavigationService = $n2.Class({
	
	dispatchService: null,
	
	showService: null,
	
	documentSource: null,
	
	currentNavigationDoc: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null
			,showService: null
			,documentSource: null
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.showService = opts.showService;
		this.documentSource = opts.documentSource;

		// dispatcher
		var d = this.dispatchService;
		if( d ){
			var f = function(m, addr, d){
				_this._handle(m, addr, d);
			};
			
			d.register(DH,'reportModuleDocument',f);
			d.register(DH,'navigationGetCurrent',f);
			d.register(DH,'showPreprocessElement',f);
		};
	},
	
	setCurrentNavigation: function(opts_){
		var opts = $n2.extend({
			docId: null
			,doc: null
		},opts_);
		
		var _this = this;
		
		if( opts.doc 
		 && opts.doc.nunaliit_navigation ){
			this.navigationDoc = opts.doc;
			
			this._fixElements($('body'), this.navigationDoc);
			
			if( this.dispatchService ){
				this.dispatchService.send(DH, {
					type: 'navigationReportCurrent'
					,navigationId: this.navigationDoc._id
					,navigationDoc: this.navigationDoc
				});
			};
			
		} else if( opts.docId ){
			if( this.documentSource ){
				this.documentSource.getDocument({
					docId: opts.docId
					,onSuccess: function(doc){
						_this.setCurrentNavigation({
							doc: doc
						});
					}
				});
			};
		};
	},
	
	printTitle: function(opts_){
		var opts = $n2.extend({
			elem: null
		},opts_);
		
		var $elem = $(opts.elem).addClass('n2nav_insertTitle');
		
		this._fixElements($elem, this.navigationDoc);
	},
	
	printMenu: function(opts_){
		var opts = $n2.extend({
			elem: null
		},opts_);
		
		var $elem = $(opts.elem).addClass('n2nav_insertMenu');
		
		this._fixElements($elem, this.navigationDoc);
	},
	
	_fixElements: function($root, navigationDoc){
		if( !navigationDoc ) return;

		var _this = this;
		
		var $set = $root.find('*').addBack();
		var $drawer = $('#nunaliit_hamburgermenu');
		
		// Title
		$set.filter('.n2nav_insertTitle').each(function(){
			// Add title to Nav-Bar
			var $elem = $(this);
			$elem.removeClass('n2nav_insertTitle').addClass('n2nav_insertedTitle');
			_this._insertTitle($elem, navigationDoc);

			// Add title to Hamburger Menu
			$drawer.empty();
			var $drawerMenuHeader = $('<div>')
				.addClass('mdc-drawer__header')
				.prependTo($drawer);
	
			var $drawerMenuHeaderTitle = $('<h3>')
				.addClass('mdc-drawer__title')
				.appendTo($drawerMenuHeader);

			_this._insertTitle($drawerMenuHeaderTitle, navigationDoc);
		});
		
		// Menu
		$set.filter('.n2nav_insertMenu').each(function(){
			// Add menu items to Nav-Bar Menu
			var $elem = $(this);
			$elem.removeClass('n2nav_insertMenu').addClass('n2nav_insertedMenu');
			_this._insertMenu($elem, navigationDoc, false);

			// Add Hamburger Menu
			_this._insertHamburgerMenu(navigationDoc);
		});
	},
	
	_insertTitle: function($elem, doc){

		var docId = this._associateDocumentToElement(doc, $elem);
		
		if( doc && docId === doc._id ){
			var title = undefined;
			if( doc.nunaliit_navigation ) {
				title = doc.nunaliit_navigation.title;
			};
			if( title ){
				$elem.text( _loc(title) );
			} else {
				$elem.empty();
			};
		};
	},
	
	_insertMenu: function($elem, doc, hamburgerMenu){

		var docId = this._associateDocumentToElement(doc, $elem);
		
		if( doc && docId === doc._id ){
			new NavigationDisplay({
				dispatchService: this.dispatchService
				,showService: this.showService
				,navigationDoc: doc
				,hamburgerMenu: hamburgerMenu
				,elem: $elem
			});
		};
	},

	_drawerHasActiveItem: function(listItems){
		var foundStatus = false;
		listItems.forEach(function(item){
			if (item.activated) {
				foundStatus = true;
			}
		});
		return foundStatus;
	},

	_insertHamburgerMenu: function(navDoc){
		var doc, list;
		var listItems = [{'text': _loc('Home Page'), 'href':'./', "activated":true}];

		if (navDoc && navDoc.nunaliit_navigation) {
			doc = navDoc.nunaliit_navigation; 
			list = this._insertHamburgerMenuList(doc.items);

			// Ensure that a drawer list contains at least one active item
			if (!this._drawerHasActiveItem(list)) {
				if (list.length > 1) {
					// Set first item as active
					list[0].activated = true;
				
				} else {
					// Set default drawer list if none provided.
					list = listItems;
				}
			}

			new $n2.mdc.MDCDrawer({
				navHeaderTitle: _loc(doc.title),
				navItems: list,
				anchorBtnId: 'hamburger_menu_btn'
			});
		}
	},

	_insertHamburgerMenuList: function(items){
		var _this = this;
		var menuList = [];

		items.forEach(function(item){
			var text, href, nestedList;
			var activated = false;

			if (item.title) {
				text = _loc(item.title);
			}

			if (item.href) {
				href = item.href;

				if (!item.title) {
					text = item.href;
				}
			}

			if (item.module) {
				var currentUrl = $n2.url.getCurrentLocation();
				var getUrl = $n2.url.getUrlWithoutParams();
				var urlModule = $n2.url.getParamValue('module', null);

				href = getUrl + '?module=' + item.module;

				if (currentUrl === href || item.module === urlModule) {
					activated = true;
				}

				if (!item.title) {
					text = item.module;
				}
			}

			menuList.push({'text':text, 'href':href, 'activated':activated});

			if (item.items) {
				nestedList = _this._insertHamburgerMenuList(item.items);
				menuList = menuList.concat(nestedList);
			}
		});

		return menuList;
	},

	_associateDocumentToElement: function(doc, $elem){
		var docId = $elem.attr('nunaliit-document');

		if( !docId 
		 && doc ) {
			if( doc.nunaliit_navigation ){
				docId = doc._id;
			} else {
				docId = this.navigationDoc._id;
			};
		} else if( !docId && !doc ) {
			 docId = this.navigationDoc._id;
		};

		var associated = $elem.hasClass('n2show_documentAssociated');
		
		if( docId && !associated ){
			$elem.attr('nunaliit-document', docId);
			$elem.addClass('n2show_documentAssociated');

			// Ready to receive updates
			var updateClass = 'n2show_documentUpdate_' + $n2.utils.stringToHtmlId(docId);
			$elem.addClass(updateClass);
			
			if( doc && doc._id === docId ){
				// Already have document
			} else {
				// Ready to receive content
				var contentClass = 'n2show_documentContent_' + $n2.utils.stringToHtmlId(docId);
				$elem.addClass(contentClass);

				// Request this document
				this.dispatchService.send(DH,{
					type: 'requestDocument'
					,docId: docId
				});
			};
		};
		
		return docId;
	},
	
	_handle: function(m, addr, d){
		if( 'reportModuleDocument' === m.type ){
			var currentModuleId = m.moduleId;
			$('.n2nav_setModuleCurrent').removeClass('n2_nav_currentModule mdc-list-item--activated');
			$('.n2nav_setChildModuleCurrent').removeClass('n2_nav_childModuleCurrent');
			$('.n2nav_setModuleCurrent').each(function(){
				var $elem = $(this);
				var moduleId = $elem.attr('n2nav-module');
				if( moduleId && moduleId === currentModuleId ){
					setNavElementAsCurrentModule($elem);
				};
			});

		} else if( 'navigationGetCurrent' === m.type ){
			// Synchronous call
			if( this.navigationDoc ){
				m.navigationId = this.navigationDoc._id;
				m.navigationDoc = this.navigationDoc;
			};

		} else if( 'showPreprocessElement' === m.type ){
			var $elem = m.elem;
			var doc = m.doc;
			this._fixElements($elem, doc);
		};
	}
});

$n2.couchNavigation = {
	NavigationService: NavigationService
	,NavigationDisplay: NavigationDisplay
};

})(jQuery,nunaliit2);
