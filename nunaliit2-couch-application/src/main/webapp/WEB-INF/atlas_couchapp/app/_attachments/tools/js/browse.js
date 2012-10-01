;(function($,$n2){

var HASH_SEARCH_PREFIX="search_";
var HASH_EDIT_PREFIX="edit_";
var HASH_NEW_PREFIX="new_";

var atlasDb = null;
var atlasDesign = null;
var uploadServer = null;
var couchEditor = null;
var defaultSchema = null;
var searchServer = null;
var searchInput = null;
var requests = null;
var contributions = null;
var showService = null;
var schemaRepository = null;

var HashInfo = $n2.Class({
	
	hash: null
	
	,initialize: function(hash_){
		if( hash_ ) {
			this.hash = hash_;
		} else {
			this.hash = window.location.hash.substr(1);
		};
	}

	,isSearchHash: function(){
		return (this.hash.substr(0,HASH_SEARCH_PREFIX.length) === HASH_SEARCH_PREFIX);
	}

	,getSearchTerms: function(){
		if( this.isSearchHash() ) {
			var searchString = decodeURIComponent( this.hash.substr(HASH_SEARCH_PREFIX.length) );
			return searchString;
		} else {
			return null;
		};
	}
	
	,setSearchHash: function(searchTerms){
		this.hash = HASH_SEARCH_PREFIX + searchTerms;
		window.location.hash = '#' + encodeURIComponent(this.hash);
	}

	,isEditHash: function(){
		return (this.hash.substr(0,HASH_EDIT_PREFIX.length) === HASH_EDIT_PREFIX);
	}

	,getEditId: function(){
		if( this.isEditHash() ) {
			var id = decodeURIComponent( this.hash.substr(HASH_EDIT_PREFIX.length) );
			return id;
		} else {
			return null;
		};
	}
	
	,setEditId: function(docId){
		this.hash = HASH_EDIT_PREFIX + docId;
		window.location.hash = '#' + encodeURIComponent(this.hash);
	}

	,isNewDocumentHash: function(){
		return (this.hash.substr(0,HASH_NEW_PREFIX.length) === HASH_NEW_PREFIX);
	}

	,getNewDocumentSchema: function(){
		if( this.isNewDocumentHash() ) {
			if( this.hash === HASH_NEW_PREFIX ) {
				return null;
			} else {
				var schemaName = decodeURIComponent( this.hash.substr(HASH_NEW_PREFIX.length) );
				return schemaName;
			};
		} else {
			return null;
		};
	}
	
	,setNewDocumentHash: function(schemaName){
		if( schemaName ) {
			this.hash = HASH_NEW_PREFIX + schemaName;
		} else {
			this.hash = HASH_NEW_PREFIX;
		};
		window.location.hash = '#' + encodeURIComponent(this.hash);
	}
});

HashInfo.getEditHashFromDocId = function(docId){
	var hash = HASH_EDIT_PREFIX + docId;
	return hash;
};

var loginStateChanged = function(currentUser) {
	var showLogin = false;
	if (null == currentUser) {
		showLogin = true;
	};

	$('#login').empty();
	if( showLogin ) {
		var aElem = $('<a class="loginLink" href="javascript:Login">Login</a>');
		aElem.click(function(){
			if( $.NUNALIIT_AUTH ) $.NUNALIIT_AUTH.login();
			return false;
		});
		var nameElem = $('<span class="loginGreeting">Welcome.&nbsp</span>');
		$('#login').append(aElem).append(nameElem);

	} else {
		var aElem = $('<a class="loginLink" href="javascript:Logout">Logout</a>');
		aElem.click(function(){
			if( $.NUNALIIT_AUTH ) {
				$.NUNALIIT_AUTH.logout();
			};
			return false;
		});
		var display = currentUser.display;
		if( !display ) display = currentUser.name;
		var nameElem = $('<span class="loginGreeting">' + display + '&nbsp</span>');
		$('#login').append(aElem).append(nameElem);
	};
};

function reportErrorsOnElem(errors, $elem) {
	$elem.append( $('<div>Error occurred during the request<div>') );
	
	for(var i=0, e=errors.length; i<e; ++i) {
		var e = errors[i];
		if( typeof(e) === 'object' ) {
			e = JSON.stringify(e);
		};
		if( typeof(e) === 'string' ) {
			$elem.append( $('<div>'+e+'<div>') );
		};
	};
};

function reportError() {
	$('.olkit_wait').remove();
	
	$('#results').empty();
	reportErrorsOnElem(arguments, $('#results'));
};

function startRequestWait() {
	$('#results').html('<div class="olkit_wait"></div>');
};
	
function initiateEdit(docId) {
	// Get document
	startRequestWait();
	atlasDb.getDocument({
		docId: docId
		,onSuccess: function(doc) {
			var schemaName = doc.nunaliit_schema;
			if( !schemaName ) {
				showEdit(doc); 
			} else {
				schemaRepository.getSchema({
					name: schemaName
					,onSuccess: function(schema){
						showEdit(doc,schema);
					}
					,onError: function(){
						showEdit(doc);
					}
				});
			};
		}
		,onError: reportError
	});
	
	function showEdit(doc,schema) {
		$('#results').empty();
		
		couchEditor.cancelDocumentForm();

		// Couch Editor
		var couchEditorId = $n2.getUniqueId();
		var $couchEditorDiv = $('<div id="'+couchEditorId+'"></div>');
		$('#results').append( $couchEditorDiv );
		couchEditor.showDocumentForm(doc,{
			panelName: couchEditorId
			,schema: schema
			,onFeatureInsertedFn: function(fid,feature){ 
				initiateEdit(doc._id); 
			}
			,onFeatureUpdatedFn: function(fid,feature){ 
				initiateEdit(doc._id); 
			}
			,onFeatureDeletedFn: function(fid,feature){
				var hashInfo = new HashInfo();
				if( doc._id === hashInfo.getEditId() ) {
					window.history.back();
				};
			}
			,onCancelFn: function(){ 
				var hashInfo = new HashInfo();
				if( doc._id === hashInfo.getEditId() ) {
					window.history.back();
				};
			}
			,onCloseFn: function(){}
		});

		// References to other objects
		$('#results').append( $('<h3>Other documents referenced by this document</h3>') );
		var references = [];
		n2utils.extractLinks(doc, references);
		var $table = $('<table></table>');
		$('#results').append($table);
		for(var i=0,e=references.length; i<e; ++i) {
			var docId = references[i].doc;
			var $tr = $('<tr></tr>');

			$table.append($tr);

			var $td = $('<td class="docId"></td>');
			$tr.append( $td );

			var $a = $('<a href="#'+docId+'" alt="'+docId+'">'+docId+'</a>');
			showService.printBriefDescription($a,docId);
			$td.append( $a );
			$a.click(function(){
				var $a = $(this);
				var docId = $a.attr('alt');
				initiateEdit(docId);
				return true;
			});

			var $td = $('<td class="brief"></td>');
			$tr.append( $td );
		};

		// References from other objects
		$('#results').append( $('<h3>Other documents referencing this document</h3>') );
		$('#results').append( $('<div id="referencesToThis"><div class="olkit_wait"></div></div>') );
		atlasDesign.queryView({
			viewName: 'link-references'
			,startkey: doc._id
			,endkey: doc._id
			,onSuccess: function(rows) { 
				var $table = $('<table></table>');
				$('#referencesToThis').empty().append($table);
				for(var i=0,e=rows.length; i<e; ++i) {
					var docId = rows[i].id;
					var $tr = $('<tr></tr>');

					$table.append($tr);

					var $td = $('<td class="docId"></td>');
					$tr.append( $td );

					var $a = $('<a href="#'+docId+'" alt="'+docId+'">'+docId+'</a>');
					$td.append( $a );
					$a.click(function(){
						var $a = $(this);
						var docId = $a.attr('alt');
						initiateEdit(docId);
						return true;
					});
					showService.printBriefDescription($a,docId);
				};
			}
			,onError: reportError
		});

		// Attachments
		if( doc._attachments ) {
			$('#results').append( $('<h3>Attachments</h3>') );
			var $table = $('<table></table>');
			$('#results').append($table);
			for(var key in doc._attachments) {
				var att = doc._attachments[key];
				var $tr = $('<tr></tr>');

				$table.append($tr);

				var $td = $('<td class="attachment"></td>');
				$tr.append( $td );

				var attUrl = atlasDb.getDocumentUrl(doc);
				attUrl = attUrl + '/' + key;
				var $a = $('<a href="'+attUrl+'">'+key+'</a>');
				$td.append( $a );

				var type = '';
				if( att.content_type ) {
					type = att.content_type;
				};
				var $td = $('<td class="type">'+type+'</td>');
				$tr.append( $td );

				var size = '';
				if( att.length ) {
					size = att.length;
				};
				var $td = $('<td class="type">'+size+'</td>');
				$tr.append( $td );
			};
		};

		var $errors = $('<div id="editErrors"></div>');
		$('#results').append($errors);
	};
};

function addDocument() {
	if( $.NUNALIIT_AUTH && !$.NUNALIIT_AUTH.isLoggedIn() ) {
		$.NUNALIIT_AUTH.login({
			onSuccess: addDocument
		});
		return;
	};
	
	schemaRepository.getRootSchemas({
		onSuccess: function(schemas){
			selectNewDocumentSchema(schemas);
		}
		,onError: function(){
			var hashInfo = new HashInfo();
			hashInfo.setNewDocumentHash();
		}
	});
};

function selectNewDocumentSchema(schemas) {
	
	var uniqueId = $n2.getUniqueId();
	var $dialog = $('<div id="'+uniqueId+'"><table>'
		+'<tr><th>Schema</th><td><select></select></td></tr>'
		+'<tr><td></td><td><button>OK</button><button>Cancel</button></td></tr>'
		+'</table></div>');
	
	var $select = $dialog.find('select');
	for(var i=0,e=schemas.length; i<e; ++i) {
		var $option = $('<option></option>');
		var label = schemas[i].label;
		if( !label ) {
			label = schemas[i].name;
		};
		$option.text(label);
		$option.val(''+schemas[i].name);
		$select.append( $option );
	};
	
	var $buttons = $dialog.find('button');
	$buttons.first()
		.button({icons:{primary:'ui-icon-check'}})
		.click(function(){
			var $dialog = $('#'+uniqueId);
			var $select = $dialog.find('select');
			var schemaName = $select.val();

			var hashInfo = new HashInfo();
			hashInfo.setNewDocumentHash(schemaName);
			
			$dialog.dialog('close');
		});
	$buttons.first().next()
		.button({icons:{primary:'ui-icon-cancel'}})
		.click(function(){
			var $dialog = $('#'+uniqueId);
			$dialog.dialog('close');
		});
	
	$dialog.dialog({
		autoOpen: true
		,title: 'Select Document Schema'
		,modal: true
		,width: 500
		,close: function(event, ui){
			var diag = $(event.target);
			diag.dialog('destroy');
			diag.remove();
		}
	});
};

function createNewDocumentFromSchemaName(schemaName){
	if( schemaName ) {
		$n2.log('schemaName',schemaName);
		schemaRepository.getSchema({
			name: schemaName
			,onSuccess: function(schema){
				createNewDocument(schema);
			}
			,onError: function(err){
				reportError('Unable to get selected schema: '+err);
			}
		});
	} else {
		createNewDocument();
	};
};

function createNewDocument(schema) {

	if( schema ) {
		var doc = schema.createObject({});
	} else {
		var doc = {};
	};

	$n2.couchMap.adjustDocument(doc);
	
	showEdit(doc,schema);
	
	function showEdit(doc,schema) {
		$('#results').empty();
		
		couchEditor.cancelDocumentForm();
		
		couchEditor.showDocumentForm(doc,{
			panelName: 'results'
			,schema: schema
			,onFeatureInsertedFn: function(fid,feature){
				// replace state
				var newUrl = window.location.href;
				var i = newUrl.indexOf('#');
				newUrl = newUrl.substr(0,i+1) + HashInfo.getEditHashFromDocId(fid);
				window.history.replaceState(null,null,newUrl);
				hashChange();
			}
			,onCancelFn: function(){ 
				var hashInfo = new HashInfo();
				if( hashInfo.isNewDocumentHash() ) {
					window.history.back();
				};
			}
		});
		$n2.log('schema',schema);
		$n2.log('couchEditor',couchEditor);

		var $errors = $('<div id="editErrors"></div>');
		$('#results').append($errors);
	};
};


function displaySearchResults(displayData) {
	var hashInfo = new HashInfo();
	hashInfo.setSearchHash( $('#searchText').val() );

	if( !displayData ) {
		reportError('Invalid search results returned');

	} else if( 'wait' === displayData.type ) {
		startRequestWait();

	} else if( 'results' === displayData.type ) {
		var $table = $('<table></table>');
		$('#results').empty().append($table);
	
		$table.append('<tr><th>Results</th></tr>');

		for(var i=0,e=displayData.list.length; i<e; ++i) {
			var docId = displayData.list[i].id;
			var $tr = $('<tr></tr>');

			$table.append($tr);
			
			var hash = HashInfo.getEditHashFromDocId(docId);
			
			$td = $('<td><a href="#'+hash+'" alt="'+docId+'">unknown</a></td>');
			$tr.append($td);
			showService.printBriefDescription($td.find('a'),docId);
		};
		
	} else {
		reportError('Invalid search results returned');
	};
};

function setNewHash(newHash) {
	if( null === newHash  ) {
		location.hash = null;
	} else {
		location.hash = '#' + encodeURIComponent(newHash);
	};
};

function hashChange() {
	var hashInfo = new HashInfo();
	
	// Cancel editing
	if( couchEditor ) {
		couchEditor.cancelDocumentForm();
	};

	if( hashInfo.isSearchHash() ) {
		var searchTerms = hashInfo.getSearchTerms();
		searchInput.performSearch( searchTerms );

	} else if( hashInfo.isEditHash() ) {
		initiateEdit( hashInfo.getEditId() );

	} else if( hashInfo.isNewDocumentHash() ) {
		var schemaName = hashInfo.getNewDocumentSchema();
		createNewDocumentFromSchemaName(schemaName);

	} else {
		$('#results').empty();
	};
};

function main() {

	searchInput = searchServer.installSearch({
		textInput: $('#searchText')
		,searchButton: $('#searchButton')
		,initialSearchText: 'search database'
		,onlyFinalResults: true
		,displayFn: displaySearchResults
	});
	
	// Editor
	couchEditor.options.schema = defaultSchema;
	couchEditor.options.onCloseFn = function(){
		$('#results').empty();
	};
	
	$('#addDocumentButton').click(addDocument);

	window.addEventListener('hashchange', hashChange, false);
	hashChange();
};

function main_init(config) {
	$n2.log('main_init',config);
	atlasDb = config.atlasDb;
	atlasDesign = config.atlasDesign;
	uploadServer = config.uploadServer;
	searchServer = config.searchServer;
	requests = config.requests;
	contributions = config.contributions;
	couchEditor = config.couchEditor;
	showService = config.show;
	schemaRepository = config.directory.schemaRepository;
 	
	if( $.NUNALIIT_AUTH ) {
		$.NUNALIIT_AUTH.addListener(loginStateChanged);
	};

	schemaRepository.getSchema({
		name: 'object'
		,onSuccess: function(schema) {
			defaultSchema = schema;
			main();
		}
		,onError: function(err) {
			$n2.log('Unable to load schema for editor',err);
			main();
		}
	});
};

$n2.browse = {
	main_init: main_init
};

})(jQuery,nunaliit2);