;(function($,$n2){

var DH = 'browse.js';	
	
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
var dispatcher = null;

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
		
		couchEditor.cancelDocumentForm({suppressEvents:true});

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
			}
			,onCancelFn: function(){ 
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

			// start new document
			var hash = HASH_NEW_PREFIX + $n2.utils.stringToHtmlId(schemaName);
			dispatcher.send(DH,{
				type: 'setHash'
				,hash: hash
			});
			createNewDocumentFromSchemaName(schemaName);
			
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
		
		couchEditor.cancelDocumentForm({suppressEvents:true});
		
		couchEditor.showDocumentForm(doc,{
			panelName: 'results'
			,schema: schema
			,onFeatureInsertedFn: function(fid,feature){
			}
			,onCancelFn: function(){ 
			}
		});
		$n2.log('schema',schema);
		$n2.log('couchEditor',couchEditor);

		var $errors = $('<div id="editErrors"></div>');
		$('#results').append($errors);
	};
};


function displaySearchResults(displayData) {

	var $table = $('<table></table>');
	$('#results').empty().append($table);

	$table.append('<tr><th>Results</th></tr>');

	for(var i=0,e=displayData.list.length; i<e; ++i) {
		var docId = displayData.list[i].id;
		var $tr = $('<tr></tr>');

		$table.append($tr);
		
//		var hash = HashInfo.getEditHashFromDocId(docId);
		
		$td = $('<td><a href="#" alt="'+docId+'">unknown</a></td>');
		$tr.append($td);
		
		var $a = $td.find('a');
		installClick($a, docId);
		showService.printBriefDescription($a,docId);
	};
	
	function installClick($a, docId){
		$a.click(function(){
			dispatcher.send(DH,{
				type:'selected'
				,docId:docId
			});
			return false;
		});
	};
};

function setNewHash(newHash) {
	if( null === newHash  ) {
		location.hash = null;
	} else {
		location.hash = '#' + encodeURIComponent(newHash);
	};
};

function _handle(m){
	if( 'searchInitiate' === m.type ) {
		startRequestWait();

	} else if( 'searchResults' === m.type ) {
		if( m.results ){
			displaySearchResults(m.results);
		} else if( m.error ) {
			reportError('Invalid search results returned: '+m.error);
		};
		
	} else if( 'selected' === m.type ) {
		initiateEdit( m.docId );
		
	} else if( 'unselected' === m.type ) {
		$('#results').empty();
		
	} else if( 'hashChanged' === m.type ) {
		var hash = m.hash;
		if( hash.substr(0,HASH_NEW_PREFIX.length) === HASH_NEW_PREFIX ) {
			// New document
			var schemaName = hash.substr(HASH_NEW_PREFIX.length);
			schemaName = $n2.utils.unescapeHtmlId(schemaName);
			createNewDocumentFromSchemaName(schemaName);
		};
	};
};

function main() {
	
	dispatcher.register(DH,'searchInitiate',_handle);
	dispatcher.register(DH,'searchResults',_handle);
	dispatcher.register(DH,'selected',_handle);
	dispatcher.register(DH,'unselected',_handle);
	dispatcher.register(DH,'hashChanged',_handle);

	searchInput = searchServer.installSearch({
		textInput: $('#searchText')
		,searchButton: $('#searchButton')
		,initialSearchText: 'search database'
		,onlyFinalResults: true
		//,displayFn: displaySearchResults
		,dispatchService: dispatcher
	});
	
	// Editor
	couchEditor.options.schema = defaultSchema;
	couchEditor.options.onCloseFn = function(){
		$('#results').empty();
	};
	
	$('#addDocumentButton').click(addDocument);
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
	dispatcher = config.directory.dispatchService;
	
 	
	if( $.NUNALIIT_AUTH ) {
		$.NUNALIIT_AUTH.addListener(loginStateChanged);
	};

	schemaRepository.getSchema({
		name: 'object'
		,onSuccess: function(schema) {
			defaultSchema = schema;
			main();
			config.start();
		}
		,onError: function(err) {
			$n2.log('Unable to load schema for editor',err);
			main();
			config.start();
		}
	});
};

$n2.browse = {
	main_init: main_init
};

})(jQuery,nunaliit2);