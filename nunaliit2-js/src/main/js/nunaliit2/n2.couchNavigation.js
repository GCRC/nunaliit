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

const SUBMENU_CLICKED_CLASS = 'n2nav_submenu_clicked'

//=========================================================================
function setNavElementAsCurrentModule($elem){
	$elem.addClass('n2_nav_currentModule');
	$elem.parents('.n2nav_setChildModuleCurrent').addClass('n2_nav_childModuleCurrent');
};
	
//=========================================================================	
var NavigationDisplay = $n2.Class({
	
	dispatchService: null,
	
	showService: null,
	
	navigationDoc: null,
	
	elemId: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null
			,showService: null
			,navigationDoc: null
			,elem: null
		},opts_);
		
		this.dispatchService = opts.dispatchService;
		this.showService = opts.showService;
		this.navigationDoc = opts.navigationDoc;
		
		var $elem = $(opts.elem);
		this.elemId = $n2.utils.getElementIdentifier($elem);
		
		this._display();
	},
	
	_display: function(){
		var $nav = $('#'+this.elemId);
		var doc = this.navigationDoc;
		
		if( this.navigationDoc 
		 && this.navigationDoc.nunaliit_navigation 
		 && $nav.length > 0 ){
			// Get current module identifier
			var msg = {
				type: 'moduleGetCurrent'
			};
			this.dispatchService.synchronousCall(DH,msg);
			var currentModuleId = msg.moduleId;

			// Navigation menu
			$nav.empty();

			const menuToggle = $(`
			<div id="menuToggle">
				<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<g clip-path="url(#clip0_429_11066)">
					<path d="M3 6.00092H21M3 12.0009H21M3 18.0009H21"/>
					</g>
					<defs>
					<clipPath id="clip0_429_11066">
					<rect width="24" height="24" fill="white" transform="translate(0 0.000915527)"/>
					</clipPath>
					</defs>
				</svg>
			</div>`)

			$nav.append(menuToggle)

			menuToggle.click(function() {
				$(this.parentNode)?.toggleClass('n2nav_showMenu')
				$('.' + SUBMENU_CLICKED_CLASS).each((_, el) => {
					el.classList.remove(SUBMENU_CLICKED_CLASS)
				})
			})
			
			if( doc.nunaliit_navigation.items 
			 && doc.nunaliit_navigation.items.length > 0 ) {
				var $ul = $('<ul>')
					.addClass('n2nav_setChildModuleCurrent')
					.addClass('n2nav_menu')
					.appendTo($nav);
				
				insertItems($ul, doc.nunaliit_navigation.items, currentModuleId, true);
			};
			
			if( this.showService ){
				this.showService.fixElementAndChildren($nav);
			};
		};
		
		function insertItems($ul, items, currentModuleId, alternatingClassType){
			$ul.addClass(alternatingClassType ? 'n2nav_responsiveMenuTypeA' : 'n2nav_responsiveMenuTypeB')
			for(var i=0,e=items.length; i<e; ++i){
				var item = items[i];
				
				var $li = $('<li>')
					.addClass('n2nav_setChildModuleCurrent')
					.attr('tabindex', 0)
					.appendTo($ul);
				
				if( item.key ){
					$li.attr('n2nav-key',item.key);
				};

				if( item.title && item.href ) {
					// Compute module class
					var moduleId = null;
					var url = new $n2.url.Url({
						url: item.href
					});
					if( url ){
						moduleId = url.getParamValue('module',null);
					};
					if( moduleId ){
						$li.attr('n2nav-module',moduleId);
						$li.addClass('n2nav_setModuleCurrent');
					};
					
					if( moduleId && moduleId === currentModuleId ){
						setNavElementAsCurrentModule($li);
					};
					
					var title = _loc(item.title);
					$('<a>')
						.attr('href',item.href)
						.text(title)
						.appendTo($li);
					
				} else if( item.module ) {
						// Compute URL based on current one
					var currentUrl = $n2.url.getCurrentLocation();
					var moduleUrl = currentUrl
						.clone()
						.setHash(null)
						.setParamValue('module',item.module);
				
					// Install module class
					$li.attr('n2nav-module',item.module);
					$li.addClass('n2nav_setModuleCurrent');
					
					if( item.module === currentModuleId ){
						setNavElementAsCurrentModule($li);
					};
					
					var $a = $('<a>')
						.attr('href',moduleUrl.getUrl())
						.appendTo($li);

					if( item.title ){
						var title = _loc(item.title);
						$a.text(title);
					} else {
						// Obtain title from show service
						$a.attr('nunaliit-document',item.module);
						$a.addClass('n2s_insertModuleName');
						$a.text(item.module);
					};
						
				} else if( item.title ) {
					var $span = $('<span></span>');
					var title = _loc(item.title);
					$span.text(title);
					$li.append($span);
				};
				
				if( item.items && item.items.length > 0 ){
					$li.click(function(ev) {
						ev.stopPropagation()
						$(this).toggleClass(SUBMENU_CLICKED_CLASS)
					})
					var $innerUl = $('<ul>')
						.addClass('n2nav_setChildModuleCurrent')
						.addClass('n2nav_menu')
						.addClass('n2nav_submenu')
						.appendTo($li);
					insertItems($innerUl, item.items, currentModuleId, !alternatingClassType);
				};
			};
		};
	}
});
	
//=========================================================================	
var NavigationService = $n2.Class({
	
	dispatchService: null,
	
	showService: null,
	
	documentSource: null,
	
	currentNavigationDoc: null,

	currentNavigationDocId: null,
	
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
			d.register(DH, 'documentContent', f);
		};
	},
	
	setCurrentNavigation: function(opts_){
		var opts = $n2.extend({
			docId: null
			,doc: null
		},opts_);
		
		var _this = this;
		this.currentNavigationDocId = opts.docId;
		
		if( opts.doc 
		 && opts.doc.nunaliit_navigation ){
			this.navigationDoc = opts.doc;
			
			this._fixElements($('body'), this.navigationDoc);
			if (opts.docId !== 'atlas') {
				opts.docId = this.navigationDoc._id;
			}
			
			if( this.dispatchService ){
				this.dispatchService.send(DH, {
					type: 'navigationReportCurrent'
					,navigationId: opts.docId
					,navigationDoc: this.navigationDoc
				});
			}
			
		}
		else if (opts.docId === 'atlas') {
			// Try atlas document for navigation.
			this.dispatchService.send(DH, {
				type: 'requestDocument',
				docId: 'atlas'
			});
		}
		else if( opts.docId ){
			if( this.documentSource ){
				this.documentSource.getDocument({
					docId: opts.docId
					,onSuccess: function(doc){
						_this.setCurrentNavigation({
							doc: doc
						});
					}
				});
			}
		}
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
		
		// Title
		$set.filter('.n2nav_insertTitle').each(function(){
			var $elem = $(this);
			$elem.removeClass('n2nav_insertTitle').addClass('n2nav_insertedTitle');
			_this._insertTitle($elem, navigationDoc);
		});
		
		// Menu
		$set.filter('.n2nav_insertMenu').each(function(){
			var $elem = $(this);
			$elem.removeClass('n2nav_insertMenu').addClass('n2nav_insertedMenu');
			_this._insertMenu($elem, navigationDoc);
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
	
	_insertMenu: function($elem, doc){

		var docId = this._associateDocumentToElement(doc, $elem);
		
		if( doc && docId === doc._id ){
			new NavigationDisplay({
				dispatchService: this.dispatchService
				,showService: this.showService
				,navigationDoc: doc
				,elem: $elem
			});
		};
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
			$('.n2nav_setModuleCurrent').removeClass('n2_nav_currentModule');
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
		} else if (m.type === 'documentContent' && m.docId === 'atlas' && this.currentNavigationDocId === 'atlas') {
			var atlasDoc = m.doc;
			this.setCurrentNavigation({
				doc: atlasDoc.nunaliit_atlas,
				docId: 'atlas'
			});
		}
	}
});

$n2.couchNavigation = {
	NavigationService: NavigationService
	,NavigationDisplay: NavigationDisplay
};

})(jQuery,nunaliit2);
