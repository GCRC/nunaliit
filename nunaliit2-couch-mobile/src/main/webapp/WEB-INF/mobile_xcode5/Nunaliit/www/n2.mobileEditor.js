;(function($,$n2){

var FLAVOUR_TREE = 'tree';
var FLAVOUR_SCHEMA = 'schema';

function isKeyEditingAllowed(obj, selectors, data) {
	if( selectors[0] === '_id' ) return false;
	if( selectors[0] === '_rev' ) return false;
	
	return true;
};

function isValueEditingAllowed(obj, selectors, data) {
	if( selectors[0] === '_id' ) return false;
	if( selectors[0] === '_rev' ) return false;
	
	return true;
};

function isKeyDeletionAllowed(obj, selectors, data) {
	if( selectors[0] === '_id' ) return false;
	if( selectors[0] === '_rev' ) return false;
	
	return true;
};

//=============================================================
var MobileEditor = $n2.Class({
	
	options: null
	
	,pageId: null
	
	,doc: null
	
	,originalDoc: null
	
	,flavour: null
	
	,treeEditor: null
	
	,schemaEditor: null
	
	,savedInfo: null
	
	,cleanupPage: null
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,initialize: function(opts_){
		this.options = $n2.extend({
			currentDb: null
			,doc: null
			,schema: null
			,onSaved: function(docInfo){}
		},opts_);
		
		this.pageId = 'edit_' + $n2.getUniqueId();

		this.doc = this.options.doc;
		
		// Adjust object being edited
		this.options.currentDb.adjustLastUpdated(this.doc);
		
		this.originalDoc = $n2.extend(true,{},this.options.doc);
		
		this.flavour = FLAVOUR_TREE;
		if( this.options.schema ) {
			this.flavour = FLAVOUR_SCHEMA;
		};
		
		this.createPage();
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
	,getPage: function(){
		return $('#'+this.pageId);
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getPageContainer: function(){
		return $.mobile.pageContainer;
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getDisplayArea: function(){
		return this.getPage().find('.mobileEditDisplay');
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,createPage: function(){

		var _this = this;
		var $pageContainer = this.getPageContainer();
		
		var documentBase = $.mobile.getDocumentBase(true);
		var absUrl = $.mobile.path.makeUrlAbsolute( this.pageId, documentBase.hrefNoHash );
		var dataUrl = $.mobile.path.convertUrlToDataUrl( absUrl );
		
		var $newPage = $pageContainer.children('#'+this.pageId);
		if( $newPage.length < 1 ) {
			// Create page
			$newPage = $('<div id="'+this.pageId+'" data-url="'+dataUrl+'" data-role="page" data-theme="b"></div>');
			$newPage.append('<div data-role="header" data-theme="b"><a href="#" data-icon="arrow-l" data-theme="b">Cancel</a><h1>Edit Document&nbsp;&nbsp;<span class="mobileEditLabel"></span></h1></div>');
			$newPage.append('<div class="mobileEditContent" data-role="content" data-theme="d"></div>');
			$newPage.append('<div class="mobileEditFooter" data-role="footer" data-theme="b"></div>');
			
			$newPage.find('a').click(function(e){
				_this._clickCancel(this, e);
				return false;
			});
			
			$pageContainer.append($newPage);
			
			// Enhance page
			$newPage.page();
			$newPage.bind('pagehide',function(){
				var $page = $( this );

				if( _this.cleanupPage ) {
					var prEvent = new $.Event('pageremove');
					$page.trigger( prEvent );
	
					if( !prEvent.isDefaultPrevented() ){
						$page.removeWithDependents();
					};
				};
				
				if( _this.savedInfo ){
					_this.options.onSaved(_this.savedInfo);
				};
			});
		};
		
		this._editDocument();
		
		// Load this page
		var newPageOptions = {
		};
		$.mobile.changePage($newPage, newPageOptions);
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_editDocument: function(){
		var _this = this;
		
		var currentDb = this.getCurrentDb();
		var showService = currentDb.getShowService();
		
		var $page = this.getPage();
		var $content = $page.find('.mobileEditContent');
		var $label = $page.find('.mobileEditLabel');
		var $footer = $page.find('.mobileEditFooter');
		
		$label.empty();
		$content.empty();
		$footer.empty();
		
		// Radio buttons for flavour menu
		var $radioButtons = $('<div data-role="fieldcontain"><fieldset data-role="controlgroup" data-type="horizontal"></fieldset></div>');
		var $radioFieldSet = $radioButtons.find('fieldset');
		$content.append($radioButtons);
		if( null != this.options.schema ) {
			var $button = $('<input type="radio" class="mobileEditFlavourRadio" name="mobileEditFlavour" id="mobileEditFlavourSchema"/>');
			$button.attr('value',FLAVOUR_SCHEMA);
			if( FLAVOUR_SCHEMA === this.flavour ) $button.attr('checked','checked');
			$radioFieldSet.append( $button );
			$radioFieldSet.append( $('<label for="mobileEditFlavourSchema">Form</label>') );
		};

		var $button = $('<input type="radio" class="mobileEditFlavourRadio" name="mobileEditFlavour" id="mobileEditFlavourTree"/>');
		$button.attr('value',FLAVOUR_TREE);
		if( FLAVOUR_TREE === this.flavour ) $button.attr('checked','checked');
		$radioFieldSet.append( $button );
		$radioFieldSet.append( $('<label for="mobileEditFlavourTree">Detailed</label>') );

		// Add display area
		$content.append( $('<div class="mobileEditDisplay"></div>') );

		// Add attached files
		$content.append( $('<div class="mobileEditAttachedFile"></div>') );
		
		// Events
		$page.find('.mobileEditFlavourRadio').bind('change',function(){_this._changeFlavour(this);});
		
		// Add navigation area
		var $navBar = $('<div data-role="navbar"></div>');
		$footer.append($navBar);
		var $navBarUl = $('<ul></ul>');
		$navBar.append($navBarUl);
		$navBarUl.append( $('<li><a class="mobileEditButtonSave" data-role="button" data-inline="true" data-icon="check">Save</a></li>') );
		$navBarUl.append( $('<li><a class="mobileEditButtonCancel" data-role="button" data-inline="true" data-icon="back">Cancel</a></li>') );
		$navBarUl.append( $('<li><a class="mobileEditButtonGps" data-role="button" data-inline="true" data-icon="add">Set Location</a></li>') );
		$navBar.find('.mobileEditButtonSave').click(function(e){
			_this._clickSave(this, e);
		});
		$navBar.find('.mobileEditButtonCancel').click(function(e){
			_this._clickCancel(this, e);
		});
		$navBar.find('.mobileEditButtonGps').click(function(e){
			_this._clickGps(this);
		});
		
		this._refresh();
		
		$page.trigger('create');
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_changeFlavour: function(btn_){
		var $input = $(btn_);
		this.flavour = $input.val();

		this._refresh();
		
		var $page = this.getPage();
		$page.page();
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_clickSave: function(btn_,e){
		var $input = $(btn_);
		
		var _this = this;
		
		var docInfo = null;
		var uploadAttachments = [];
		var filesToDelete = [];
		
		var patch = patcher.computePatch(this.originalDoc, this.doc);
		if( null == patch ) {
			// Button is not enabled
			window.setTimeout(function(){
				var $saveBtn = $('.mobileEditButtonSave');
				$saveBtn.removeClass( $.mobile.activeBtnClass );
			},0);
			return false;
		};

		$n2.mobile.ShowWaitScreen('Saving');

		saveDocument();
		
		function saveDocument(){
			// Remove attachments that must be uploaded
			if( _this.doc._attachments ) {
				for(var key in _this.doc._attachments){
					var att = _this.doc._attachments[key];
					if( att._uploadRequired ) {
						uploadAttachments.push({
							name: key
							,att: att
						});
					};
					if( att._releaseRequired && att._fullPath ) {
						filesToDelete.push(att._fullPath);
					};
				};
				for(var i=0,e=uploadAttachments.length; i<e; ++i){
					var key = uploadAttachments[i].name;
					delete _this.doc._attachments[key];
				};
			};
		
			if( _this.doc._rev ) {
				// update
				_this.getDb().updateDocument({
					data: _this.doc
					,onSuccess: function(docInfo_){
						docInfo = docInfo_;
						upload();
					}
					,onError: error
				});
				
			} else {
				// create
				_this.getDb().createDocument({
					data: _this.doc
					,onSuccess: function(docInfo_){
						docInfo = docInfo_;
						upload();
					}
					,onError: error
				});
			};
		};
		
		function upload(){
			if( uploadAttachments.length < 1 ) {
				doneSaving();
			} else {
				var up = uploadAttachments.pop();
				window.plugins.CouchDBAttachmentUploader.upload(
					up.att._fullPath
					,_this.getDb().dbUrl
			        ,docInfo.id
					,docInfo.rev
			        ,function(info) { 
			            //success callback
			            $n2.mobile.SetWaitMessage('Saving... 100%');
			            updateDocInfo(upload,function(){
				           	error('Problem accessing document');
				        });
			        }
			        ,function(str) {
			            //failure callback
		            	error('Problem uploading attachment: '+str);
			        }
			        ,{
			        	contentType: up.att.content_type
			        	,method: 'put'
			        	,attachmentName: up.name
			        	,progress: function(c,t){
			        		if( typeof(c) === 'number' 
			        		 && typeof(t) === 'number' 
			        		 && c <= t 
			        		 && t > 0 ) {
			        		 	var p = Math.floor(c / t * 100);
			        		 	$n2.mobile.SetWaitMessage('Saving... '+p+'%');
			        		};
			        	}
			        }
				);
			};
		};
		
		function updateDocInfo(fn, errorFn){
			_this.getDb().getDocumentRevision({
				docId: docInfo.id
				,onSuccess: function(rev){
					docInfo.rev = rev;
					fn();
				}
				,onError: errorFn
			});
		};
		
		function deleteTemporaryFiles(doneFn){
			if( filesToDelete.length < 1 ){
				doneFn();
			} else {
				var pathToDel = filesToDelete.pop();
				window.resolveLocalFileSystemURI(
					pathToDel
					,function(fileEntry){ // success for fileEntry
						fileEntry.remove(
							function(){  // success for remove
								$n2.log('Deleted temporary file: '+fileEntry.name);
								deleteTemporaryFiles(doneFn); 
							}
							,function(str){  // error for remove
								alert('Can not delete temporary file: '+str);
								$n2.log('Can not delete temporary file: '+fileEntry.name);
								deleteTemporaryFiles(doneFn); 
							}
						);
					}
					,function(str){  // error for fileEntry
						alert('Can not find temporary file: '+str);
						$n2.log('Can not find temporary file: '+pathToDel); 
						deleteTemporaryFiles(doneFn); 
					}
				);
			};
		};
		
		function doneSaving(){
			deleteTemporaryFiles(function(){
				$n2.mobile.HideWaitScreen();
				
				// Save docInfo for client
				_this.savedInfo = docInfo;
				
				// Go back to parent
				_this.cleanupPage = true;
				window.history.back();
			});
		};
		
		function error(str){
			deleteTemporaryFiles(function(){
				$n2.mobile.HideWaitScreen();
	
				alert('Unable to save document: '+str);
			});
		};
		
		return false;
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_clickCancel: function(btn_, e){
		var _this = this;
		var $input = $(btn_);

		var patch = patcher.computePatch(this.originalDoc, this.doc);
		if( null == patch ) {
			// Go back to parent
			_this.cleanupPage = true;
			window.history.back();

		} else if( confirm('Are you sure you want to discard your changes to this document?') ) {
			_this.cleanupPage = true;
			window.history.back();
			
		} else {
			// Do not follow cancel button.
			window.setTimeout(function(){
				var $cancelBtn = $('.mobileEditButtonCancel');
				$cancelBtn.removeClass( $.mobile.activeBtnClass );
			},0);
		};
		
		return false;
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_clickGps: function(btn_){
		var $input = $(btn_);
		
		var _this = this;
		
		var myGeolocation = null;
		if( typeof(navigator) !== 'undefined' 
			 && navigator.geolocation 
			 && navigator.geolocation.getCurrentPosition ) {
			
			myGeolocation = navigator.geolocation;
		} else {
			alert('Geolocation services are not available');
			return;
		};
		
		$n2.mobile.ShowWaitScreen('Acquiring GPS');

		getPosition();

		window.setTimeout(function(){
			var $positionBtn = $('.mobileEditButtonGps');
			$positionBtn.removeClass( $.mobile.activeBtnClass );
		},0);
		
		function getPosition() {
			myGeolocation.getCurrentPosition(
				onGpsSuccess
				,onGpsError
				,{
				}
			);
		};
			
		function onGpsSuccess(pos) {
			$n2.mobile.HideWaitScreen();

			var lat = pos.coords.latitude;
			var lon = pos.coords.longitude;
			_this.doc.nunaliit_geom = {
				nunaliit_type: 'geometry'
				,wkt:'MULTIPOINT(('+lon+' '+lat+'))'
				,bbox:[lon,lat,lon,lat]
			};
			
			// By default, add to pulic layer
			if( !_this.doc.nunaliit_layers ) {
				_this.doc.nunaliit_layers = ['public'];
			};
			
			_this._refresh();
		};
		
		function onGpsError(message) {
			$n2.mobile.HideWaitScreen();
			alert('Error encountered while querying GPS: '+message);
		};
		
		return false;
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_internalRefresh: function() {
		if( this.treeEditor ) {
			this.treeEditor.refresh();
		};
		if( this.schemaEditor ) {
			this.schemaEditor.refresh();
		};
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_refresh: function(){
		if( FLAVOUR_SCHEMA === this.flavour ) {
			this._refreshSchema();
		} else {
			this._refreshTree();
		};
		
		this._refreshAttachments();
		this._refreshButtons();
		
		var $page = this.getPage();
		$page.trigger('create');
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_refreshTree: function(){
		
		var _this = this;
		
		var $display = this.getDisplayArea();
		
		$display.empty();

		this.schemaEditor = null;
		
		var editorOptions = {
			onObjectChanged: function() {
				_this._objectUpdated();
			}
			,isKeyEditingAllowed: isKeyEditingAllowed
			,isValueEditingAllowed: isValueEditingAllowed
			,isKeyDeletionAllowed: isKeyDeletionAllowed
		};
		var objectTree = new $n2.tree.ObjectTree($display, this.doc, editorOptions);
		this.treeEditor = new $n2.tree.ObjectTreeEditor(objectTree, this.doc, editorOptions);
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_refreshSchema: function(){
		
		var _this = this;
		
		var $display = this.getDisplayArea();
		
		$display.empty();
		
		this.treeEditor = null;
		this.schemaEditor = this.options.schema.form(
			this.doc
			,$display
			,{}
			,function(){ // on change function
				_this._objectUpdated();
			}
			,{ // functionMap
				'getDocumentId' : searchForDocumentId
			}
		);
		
		function searchForDocumentId(cb,resetFn){
			new $n2.mobile.searchReference.CreatePage({
				currentDb: _this.getCurrentDb()
				,onSuccess: cb
				,onCancel: resetFn
			});
		};
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_refreshAttachments: function(){
		
		var _this = this;
		
		var $page = this.getPage();
		
		// Add attached files
		var $filesArea = $page.find('.mobileEditAttachedFile');
		$filesArea.empty();
		if( this.doc._attachments ) {
			for(var attName in this.doc._attachments){
				var attachment = this.doc._attachments[attName];
				var $button = $('<a href="#" data-role="button" data-icon="arrow-r" data-iconpos="right" data-theme="c">'+attName+'</a>');
				$filesArea.append( $button );
				installMediaEditClick($button, attName);
			};
		};
		
		function installMediaEditClick($button, attachment){
			$button.click(function(){
				new $n2.mobile.MobileMediaEditor({
					currentDb: _this.getCurrentDb()
					,doc: _this.doc
					,attachmentName: attachment
					,onClosed: function(){
						_this._refresh();
					}
				});
				return false;
			});
		};
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_refreshButtons: function(){
		
		var patch = patcher.computePatch(this.originalDoc, this.doc);

		var $page = this.getPage();
		var $saveBtn = $page.find('.mobileEditButtonSave');
		
		if( null == patch ) {
			$saveBtn.addClass('ui-disabled');
		} else {
			$saveBtn.removeClass('ui-disabled');
		};
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_objectUpdated: function() {
		this._refreshButtons();
	}
});

//=============================================================
var CreateNewDocument = $n2.Class({
	
	options: null
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,initialize: function(opts_){
		this.options = $n2.extend({
			currentDb: null
			,schema: null
			,initObj: null
			,onCreated: function(docInfo){}
		},opts_);

		if( this.options.schema ) {
			this._selectedSchema(this.options.schema);
		} else {
			this._getRootSchemas();
		};
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_getRootSchemas: function(){
		var _this = this;
		
		var currentDb = this.options.currentDb;
		var rootSchemas = [];
		var blackList = {};
		var whiteRootSchemas = null;
		
		var schemaRepository = currentDb.getSchemaRepository();
		
		schemaRepository.getRootSchemas({
			onSuccess: function(rootSchemas_){
				rootSchemas = rootSchemas_;
				getSchemaBlackList();
			}
			,onError: function(){
				alert('Unable to obtain schema list');
			}
		});

		function getSchemaBlackList(){
			var designDoc = currentDb.getDesignDoc();
			designDoc.queryView({
				viewName: 'schema-black-list'
				,onSuccess: function(rows){
					for(var i=0,e=rows.length; i<e; ++i){
						var blackListedSchemaName = rows[i].key;
						blackList[blackListedSchemaName] = true;
					};

					createSchemaList();
				}
				,onError: createSchemaList
			});
		};
		
		function createSchemaList(){
			whiteRootSchemas = [];

			for(var i=0,e=rootSchemas.length; i<e; ++i){
				var schema = rootSchemas[i];
				
				if( blackList[schema.name] ) {
					// black listed
				} else {
					whiteRootSchemas.push(schema);
				};
			};
			
			done();
		};
		
		function done(){
			_this._selectSchema(whiteRootSchemas);
		};
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_selectSchema: function(schemaList){
		var _this = this;

		if( !schemaList || !schemaList.length ) {
			alert( 'Unable to create new document because there are no available root schemas' );
			return;
		};
		
		if( 1 == schemaList.length ) {
			this.options.schema = schemaList[0];
			this._selectedSchema(schemaList[0]);
			return;
		};
		
		// Use a dialog to select the schema
		var schemaNames = [];
		var schemaByName = {};
		for(var i=0,e=schemaList.length; i<e; ++i){
			var schema = schemaList[i];
			schemaNames.push(schema.name);
			schemaByName[schema.name] = schema;
		};
		new $n2.mobile.MobileSelectDialog({
			title: 'Create New Document'
			,selections: schemaNames
			,onSelect: function(schemaName){
				_this.options.schema = schemaByName[schemaName];
				_this._selectedSchema(schemaByName[schemaName]);
			}
		});
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_selectedSchema: function(schema){
		var _this = this;
		var obj = schema.createObject(this.options.initObj);
		
		// Find out if the new object is expecting an attachment
		var attachmentName = null;
		if( obj 
		 && obj.nunaliit_attachments 
		 && obj.nunaliit_attachments.files ) {
			for(var attName in obj.nunaliit_attachments.files){
				attachmentName = attName;
				break;
			};
		};

		// If not attachment expected, simply go to editor
		if( !attachmentName ) {
			this._initiateEdit(obj, schema);

		} else {
			// An attachment is needed, capture it
			new $n2.mobile.MobileCaptureMedia({
				suppressMetaData: true
				,onCapture: function(captureData){
					_this._attachFile(captureData, attachmentName, obj, schema);
				}
			});
		};
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_attachFile: function(fileData, attName, obj, schema){
		var _this = this;
		
		if( !obj._attachments ) {
			obj._attachments = {};
		};
		if( !obj.nunaliit_attachments ) {
			obj.nunaliit_attachments = {
				nunaliit_type: 'attachment_descriptions'
				,files: {}
			};
		};
		
		obj._attachments[attName] = {
			content_type: fileData.mimeType
		};
		
		obj.nunaliit_attachments.files[attName] = {
			attachmentName: attName
			,fileClass: fileData.fileClass
			,status: 'submitted_inline'
			,conversionPerformed: false
			,originalName: attName
			,mimeType: fileData.mimeType
			,mobileSource: true
		};
		
		var username = this.options.currentDb.getRemoteUserName();
		if( username ) {
			obj.nunaliit_attachments.files[attName].submitter = username;
		};
		
		// Handle data
		if( !obj.nunaliit_attachments.files[attName].data ) {
			obj.nunaliit_attachments.files[attName].data = {};
		};
		
		// Update submitter
		this.options.currentDb.adjustLastUpdated(obj);
		
		// In some cases, the content is provided. In other cases,
		// the file must be referenced by path
		if( fileData.content ) {
			obj._attachments[attName].data = fileData.content;
			edit();
			
		} else if( fileData.fullPath ) {
//			alert('about to call upload');
//			window.plugins.CouchDBAttachmentUploader.upload(
//				fileData.fullPath
//				,'http://127.0.0.1:5984/couchdb'
//		        ,'docId'
//				,'docRev'
//		        ,function() { 
//		            //success callback
//		            alert('success called');
//		        }
//		        ,function(error) {
//		            //failure callback
//		            alert('Failure: '+error);
//		        }
//		        ,{
//		        	contentType: 'image/jpeg'
//		        	,method: 'put'
//		        	,attachmentName: 'photo.jpg'
//		        }
//			);
//			alert('upload call completed');
			obj._attachments[attName]._fullPath = fileData.fullPath;
			obj._attachments[attName]._uploadRequired = true;
			obj._attachments[attName]._releaseRequired = fileData.isTemporary;
			edit();
			

		} else {
			// Create id to track attachment and object
			// to access content
			fileData.getBase64Content({
				onSuccess: function(b64Content){
					obj._attachments[attName].data = b64Content;
					
					edit();
				}
				,onError: error
			});
		};

		function edit(){
			_this._initiateEdit(obj, schema);
		};
		
		function error(){
			alert('Error obtaining attachment');
		};
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_initiateEdit: function(obj, schema){
		var _this = this;
		new MobileEditor({
			currentDb: this.options.currentDb
			,doc: obj
			,schema: schema
			,onSaved: function(docInfo){
				_this.options.onCreated(docInfo);
			}
		});
	}
});

$n2.mobile.MobileEditor = MobileEditor;
$n2.mobile.CreateNewDocument = CreateNewDocument;

})(jQuery,nunaliit2);