;(function($,$n2){


//=============================================================
function escapeSelector(sel) {
	var res = [];
	for(var i=0,e=sel.length; i<e; ++i) {
		var c = sel[i];
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
};

//=============================================================
function unescapeSelector(sel) {
	var res = [];
	for(var i=0,e=sel.length; i<e; ++i) {
		var c = sel[i];
		if( c === '_' ) { 
			++i;
			var o2 = sel.charCodeAt(i);
			++i;
			var o1 = sel.charCodeAt(i);
			++i;
			var o0 = sel.charCodeAt(i);
			
			var b = ((o2-0x30)<<6)+((o1-0x30)<<3)+(o0-0x30);
			res.push(String.fromCharCode(b));
			
		} else {
			res.push(c);
		};
	};
	return res.join('');
};
	
//=============================================================
var PREFIX = 'doc_';
var ComputeUrlFromId = function(docId){
	return PREFIX + escapeSelector(docId);
};

//=============================================================
var ComputeIdFromUrl = function(url){
	if( url.substr(0,PREFIX.length) === PREFIX ) {
		var escaped = url.substr(PREFIX.length);
		return unescapeSelector(escaped);
	} else {
		return null;
	};
};
	
//=============================================================
var MobileViewer = $n2.Class({
	
	options: null
	
	,pageId: null
	
	,schema: null
	
	,doc: null
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,initialize: function(opts_){
		this.options = $n2.extend({
			currentDb: null
			,docId: null
			,pageOptions: null
		},opts_);
	
		var _this = this;
		var docId = this.options.docId;
	
		this.getDb().getDocument({
			docId: this.options.docId
			,onSuccess: function(doc){
				_this.doc = doc;
				_this._createPage();
			}
			,onError: function(){
				// This situation occurs when a document previously
				// viewed has been deleted. On window.hash.back(), this
				// URL is found and the document is not found.
				//alert('Unable to display document. Can not load document.');
				_this.doc = {
					_deleted: true
					,_id: docId
				};
				_this._createPage();
			}
		});
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getCurrentDb: function(){
		return this.options.currentDb;
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getDb: function(){
		return this.options.currentDb.getDb();
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getConnection: function(){
		return this.options.currentDb.getConnection();
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getPage: function(){
		return $('#'+this.pageId);
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getPageContainer: function(){
		return $.mobile.pageContainer;
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_createPage: function(){
		
		var docId = this.options.docId;
		var $pageContainer = this.getPageContainer();
		
		var documentBase = $.mobile.getDocumentBase(true);
		var url = $n2.mobile.MobileViewer.ComputeUrlFromId(docId);
		var absUrl = $.mobile.path.makeUrlAbsolute( url, documentBase.hrefNoHash );
		var dataUrl = $.mobile.path.convertUrlToDataUrl( absUrl );
		
		var $newPage = $pageContainer.children('#'+url);
		if( $newPage.length < 1 ) {
			// Create page
			$newPage = $('<div id="'+url+'" data-url="'+dataUrl+'" data-role="page" data-add-back-btn="true" data-theme="b"></div>');
			$newPage.append('<div data-role="header" data-theme="b"><h1>View Document&nbsp;&nbsp;<span class="mobileViewLabel"></span></h1></div>');
			$newPage.append('<div class="mobileViewContent" data-role="content" data-theme="d"></div>');
			$newPage.append('<div class="mobileViewFooter" data-role="footer" data-theme="b"></div>');
			
			$pageContainer.append($newPage);
			
			// Enhance page
			$newPage.page();
			$newPage.bind('pagehide',function(){
				var $this = $( this ),
					prEvent = new $.Event( "pageremove" );

				$this.trigger( prEvent );

				if( !prEvent.isDefaultPrevented() ){
					$this.removeWithDependents();
				};
			});
		};
		
		this.pageId = url;
		
		this._showDocument();
		
		// Load this page
		var newPageOptions = {
		};
		if( this.options.pageOptions ) {
			newPageOptions = this.options.pageOptions;
		};
		$.mobile.changePage($newPage, newPageOptions);
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_showDocument: function(){
		var _this = this;
		var doc = this.doc;
		
		var currentDb = this.getCurrentDb();
		var showService = currentDb.getShowService();
		
		var $page = this.getPage();
		var $content = $page.find('.mobileViewContent');
		var $label = $page.find('.mobileViewLabel');
		var $pageFooter = $page.find('.mobileViewFooter');
		
		$label.empty();
		showService.printBriefDescription($label, doc._id, null);
		
		$content.empty();
		var $docContent = $('<div></div>');
		$content.append($docContent);
		if( doc._deleted ) {
			$docContent.text('This document has been deleted or is not available locally.');
		} else {
			showService.printDocument($docContent, doc._id, null);
		};

		// References
		var $filesArea = $('<div class="mobileViewReferences"></div>');
		$content.append($filesArea);
		this._showReferences();

		// Fix navbar
		this._refreshNavbar();
		
		// Get schema, if one is associated with document
		if( doc.nunaliit_schema ) {
			// Obtain schema
			this.options.currentDb.getSchemaRepository().getSchema({
				name: doc.nunaliit_schema
				,onSuccess: function(schema){
					_this.schema = schema;
					_this._refreshNavbar();
				}
				,onError: function(err){}
			});
		};
		
		$page.trigger('create');
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_refreshNavbar: function(){
		var _this = this;
		var doc = this.doc;
		
		var currentDb = this.getCurrentDb();
		var showService = currentDb.getShowService();
		
		var $page = this.getPage();
		var $pageFooter = $page.find('.mobileViewFooter');
		
		$pageFooter.empty().append( $('<div data-role="navbar"><ul></ul></div>') );
		var $buttonsUl = $pageFooter.find('ul');
		
		if( doc._rev ) {
			var $editButtonLine = $('<li><a href="#" data-role="button" data-inline="true" data-icon="gear">Edit</a></li>');
			$buttonsUl.append($editButtonLine);
			$editButtonLine.find('a').click(function(){
				new $n2.mobile.MobileEditor({
					currentDb: currentDb
					,doc: doc
					,schema: _this.schema
				});
				return false;
			});
		};

		if( doc._rev ) {
			var $deleteButtonLine = $('<li><a href="#" data-role="button" data-inline="true" data-icon="delete">Delete</a></li>');
			$buttonsUl.append($deleteButtonLine);
			$deleteButtonLine.find('a').click(function(){
				_this._clickDelete(this);
				return false;
			});
		};
		
		if( this.schema 
		 && this.schema.isSchema 
		 && this.schema.relatedSchemaNames 
		 && this.schema.relatedSchemaNames.length
			 ) {
			var $buttonLine = $('<li><a href="#" data-role="button" data-inline="true" data-icon="add">Add Related Info</a></li>');
			$buttonsUl.append( $buttonLine );
			
			$buttonLine.find('a')
				.click(function(){
					_this._clickAddRelatedDoc();
					return false;
				});
		};
		
		$page.trigger('create');
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_clickDelete: function(btn_){
		var _this = this;
		var $input = $(btn_);

		new $n2.mobile.MobileSelectDialog({
			title: 'Confirm Deletion'
			,selections: [
				{
					label: 'Delete Locally Only'
					,localDelete: true
				}
				,{
					label: 'Delete Locally and on Server'
					,fullDelete: true
				}
				,{
					label: 'Do Not Delete'
				}
			]
			,onSelect: function(selection){
				_this._performDeletion(selection);
			}
		});
		
		return false;
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_performDeletion: function(action){

		var _this = this;
		
		if( action.localDelete ) {
			var purgeNeeded = false;
		} else if( action.fullDelete ){
			var purgeNeeded = true;
		} else {
			// Assume cancel
			return;
		};
		
		if( ! this.doc._rev ) {
			alert('Document not yet created.');
			return;
		};
		
		if( purgeNeeded ) {
			performPurge();
		} else {
			performDelete();
		};
		
		function performPurge(){
			_this.getConnection().addPurgedDocument({
				docId: _this.doc._id
				,onSuccess: performDelete
				,onError: error
			});
		};
		
		function performDelete(){
			_this.getDb().deleteDocument({
				data: _this.doc
				,onSuccess: doneDeleting
				,onError: error
			});
		};
		
		function doneDeleting(){
			// Go back to parent
			window.history.back();
		};
		
		function error(str){
			alert('Error deleting document: '+str);
		};
		
		return false;
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_clickAddRelatedDoc: function(){
		var _this = this;
		new $n2.mobile.MobileSelectDialog({
			title: 'Select a Schema'
			,selections: this.schema.relatedSchemaNames
			,onSelect: function(selection){
				_this._selectedRelatedDocSchema(selection);
			}
		});
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_selectedRelatedDocSchema: function(schemaName){
		var _this = this;
		
		this.options.currentDb.getSchemaRepository().getSchema({
			name: schemaName
			,onSuccess: withSchema
			,onError: function(err){
				alert('Unable to obtain schema');
			}
		});
		
		function withSchema(schema){
			if( !schema ) {
				alert('Unable to obtain schema');
				return;
			};
			
			new $n2.mobile.CreateNewDocument({
				currentDb: _this.getCurrentDb()
				,schema: schema
				,initObj: {
					nunaliit_source: {
						nunaliit_type: 'reference'
						,category: 'attachment'
						,doc: _this.options.docId
					}
				}
				,onCreated: function(docInfo){
					_this._showReferences();
				}
			});
		};
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_showReferences: function(){
		var _this = this;
		
		var currentDb = this.getCurrentDb();
		var docId = this.options.docId;
		var $page = this.getPage();

		var $references = $page.find('.mobileViewReferences');
		if( $references.length > 0 ) {
			currentDb.getDesignDoc().queryView({
				viewName: 'link-references'
				,startkey: docId
				,endkey: docId
				,onSuccess: function(rows){
					var currentDb = _this.getCurrentDb();
					var showService = currentDb.getShowService();
					var $page = _this.getPage();
					var $references = $page.find('.mobileViewReferences');
					$references.empty();
					var referencesProcessed = {};
					for(var i=0,e=rows.length; i<e; ++i){
						var docId = rows[i].id;
						if( !referencesProcessed[docId] ) {
							var $a = $('<a href="doc_'+docId+'" data-role="button" data-icon="arrow-r" data-iconpos="right" data-theme="c"><span>'+docId+'</span></a>');
							$references.append( $a );
							showService.printBriefDescription($a.find('span'), docId, null);
							referencesProcessed[docId] = true;
						};
					};
					$page.trigger('create');
				}
				,onError: function(err){
					var $page = _this.getPage();
					var $references = $page.find('.mobileViewReferences');
					$references.empty();
					alert('Error accessing document references');
				}
			});
		};
	}
});

$n2.mobile.MobileViewer = MobileViewer;
$n2.mobile.MobileViewer.ComputeUrlFromId = ComputeUrlFromId;
$n2.mobile.MobileViewer.ComputeIdFromUrl = ComputeIdFromUrl;

})(jQuery,nunaliit2);