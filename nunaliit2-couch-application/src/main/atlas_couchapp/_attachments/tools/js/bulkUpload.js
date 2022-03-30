; (function ($, $n2) {

	var DH = 'browse.js';

	var HASH_SEARCH_PREFIX = "search_";
	var HASH_EDIT_PREFIX = "edit_";
	var HASH_NEW_PREFIX = "new_";

	var atlasDb = null;
	var atlasDesign = null;
	var uploadService = null;
	var couchEditor = null;
	var schemaEditorService = null;
	var defaultSchema = null;
	var searchServer = null;
	var searchInput = null;
	var requests = null;
	var contributions = null;
	var showService = null;
	var schemaRepository = null;
	var dispatcher = null;
	var authService = null;
	var createDocProcess = null;
	var dialogService = null;
	let filesToUpload = null;
	let selectedSchema = null;
	let documentSource = null;
	let templateDoc = null;

	function reportErrorsOnElem(errors, $elem) {
		$elem.append($('<div>Error occurred during the request<div>'));

		for (var i = 0, e = errors.length; i < e; ++i) {
			var e = errors[i];
			if (typeof (e) === 'object') {
				e = JSON.stringify(e);
			};
			if (typeof (e) === 'string') {
				$elem.append($('<div>' + e + '<div>'));
			};
		};
	};

	function reportError() {
		$('.olkit_wait').remove();

		$('#schemaValues').empty();
		reportErrorsOnElem(arguments, $('#schemaValues'));
	};

	function startRequestWait() {
		$('#schemaValues').html('<div class="olkit_wait"></div>');
	};

	function initiateEdit(docId) {
		// Get document
		startRequestWait();
		atlasDb.getDocument({
			docId: docId
			, onSuccess: function (doc) {
				var schemaName = doc.nunaliit_schema;
				if (!schemaName) {
					showEdit(doc);
				} else {
					schemaRepository.getSchema({
						name: schemaName
						, onSuccess: function (schema) {
							showEdit(doc, schema);
						}
						, onError: function () {
							showEdit(doc);
						}
					});
				};
			}
			, onError: reportError
		});

		function showEdit(doc, schema) {
			$('#schemaValues').empty();

			couchEditor.cancelDocumentForm({ suppressEvents: true });

			// Couch Editor
			var couchEditorId = $n2.getUniqueId();
			var $couchEditorDiv = $('<div id="' + couchEditorId + '"></div>');
			$('#schemaValues').append($couchEditorDiv);
			couchEditor.showDocumentForm(doc, {
				panelName: couchEditorId
				, schema: schema
				, onCloseFn: function (doc_, editor, closeOptions) {
					if (closeOptions.inserted) {
						initiateEdit(doc._id);
					} else if (closeOptions.updated) {
						initiateEdit(doc._id);
					};
				}
			});

			// References to other objects
			$('#schemaValues').append($('<h3>Other documents referenced by this document</h3>'));
			var references = [];
			$n2.couchUtils.extractLinks(doc, references);
			var $table = $('<table></table>');
			$('#schemaValues').append($table);
			for (var i = 0, e = references.length; i < e; ++i) {
				var docId = references[i].doc;
				var $tr = $('<tr></tr>');

				$table.append($tr);

				var $td = $('<td class="docId"></td>');
				$tr.append($td);

				var $a = $('<a href="#' + docId + '" alt="' + docId + '">' + docId + '</a>');
				showService.printBriefDescription($a, docId);
				$td.append($a);
				$a.click(function () {
					var $a = $(this);
					var docId = $a.attr('alt');
					initiateEdit(docId);
					return true;
				});

				var $td = $('<td class="brief"></td>');
				$tr.append($td);
			};

			// References from other objects
			$('#schemaValues').append($('<h3>Other documents referencing this document</h3>'));
			$('#schemaValues').append($('<div id="referencesToThis"><div class="olkit_wait"></div></div>'));
			atlasDesign.queryView({
				viewName: 'link-references'
				, startkey: doc._id
				, endkey: doc._id
				, onSuccess: function (rows) {
					var $table = $('<table></table>');
					$('#referencesToThis').empty().append($table);
					for (var i = 0, e = rows.length; i < e; ++i) {
						var docId = rows[i].id;
						var $tr = $('<tr></tr>');

						$table.append($tr);

						var $td = $('<td class="docId"></td>');
						$tr.append($td);

						var $a = $('<a href="#' + docId + '" alt="' + docId + '">' + docId + '</a>');
						$td.append($a);
						$a.click(function () {
							var $a = $(this);
							var docId = $a.attr('alt');
							initiateEdit(docId);
							return true;
						});
						showService.printBriefDescription($a, docId);
					};
				}
				, onError: reportError
			});

			// Attachments
			if (doc._attachments) {
				$('#schemaValues').append($('<h3>Attachments</h3>'));
				var $table = $('<table></table>');
				$('#schemaValues').append($table);
				for (var key in doc._attachments) {
					var att = doc._attachments[key];
					var $tr = $('<tr></tr>');

					$table.append($tr);

					var $td = $('<td class="attachment"></td>');
					$tr.append($td);

					var attUrl = atlasDb.getDocumentUrl(doc);
					attUrl = attUrl + '/' + key;
					var $a = $('<a href="' + attUrl + '">' + key + '</a>');
					$td.append($a);

					var type = '';
					if (att.content_type) {
						type = att.content_type;
					};
					var $td = $('<td class="type">' + type + '</td>');
					$tr.append($td);

					var size = '';
					if (att.length) {
						size = att.length;
					};
					var $td = $('<td class="type">' + size + '</td>');
					$tr.append($td);
				};
			};

			var $errors = $('<div id="editErrors"></div>');
			$('#schemaValues').append($errors);
		};
	};

	function addDocument() {
		if (authService && !authService.isLoggedIn()) {
			authService.showLoginForm({
				onSuccess: addDocument
			});
			return;
		};

		dialogService.selectSchema({
			onSelected: function (schema) {
				// start new document
				var hash = HASH_NEW_PREFIX + $n2.utils.stringToHtmlId(schema.name);
				dispatcher.send(DH, {
					type: 'setHash'
					, hash: hash
				});
				selectedSchema = schema;
				createNewDocument();
			}
		});
	};


	function createNewDocumentFromSchemaName(schemaName) {
		if (schemaName) {
			$n2.log('schemaName', schemaName);
			schemaRepository.getSchema({
				name: schemaName
				, onSuccess: function (schema) {
					createNewDocument(schema);
				}
				, onError: function (err) {
					reportError('Unable to get selected schema: ' + err);
				}
			});
		} else {
			createNewDocument();
		};
	};

	function createNewDocument() {

		if (selectedSchema) {
			templateDoc = selectedSchema.createObject({});
		} else {
			templateDoc = {};
		};

		$n2.couchDocument.adjustDocument(templateDoc);

		showEdit(templateDoc, selectedSchema);

		function showEdit(doc, schema) {
			$('#schemaValues').empty();

			this.schemaEditor = schemaEditorService.editDocument({
				doc: doc
				, schema: schema
				, $div: $('#schemaValues')
				, onChanged: function () {
					// _this._adjustInternalValues(_this.editedDocument);
					// if( _this.treeEditor ) {
					// 	_this.treeEditor.refresh();
					// };
					// if( _this.slideEditor ) {
					// 	_this.slideEditor.refresh();
					// };
					// if( _this.attachmentEditor ) {
					// 	_this.attachmentEditor.refresh();
					// };
					// _this._refreshRelations(data);
					// _this.onEditorObjectChanged(data);
					console.log(doc);
				}
			});
			// couchEditor.cancelDocumentForm({suppressEvents:true});



			// couchEditor.showDocumentForm(doc,{
			// 	panelName: 'results'
			// 	,schema: schema
			// 	,onFeatureInsertedFn: function(fid,feature){
			// 	}
			// 	,onCancelFn: function(){ 
			// 	}
			// });
			$n2.log('schema', schema);
			// $n2.log('couchEditor',couchEditor);

			var $errors = $('<div id="editErrors"></div>');
			$('#schemaValues').append($errors);
		};
	};

	function setNewHash(newHash) {
		if (null === newHash) {
			location.hash = null;
		} else {
			location.hash = '#' + encodeURIComponent(newHash);
		};
	};

	function _handle(m) {
		if ('selected' === m.type) {
			initiateEdit(m.docId);

		} else if ('unselected' === m.type) {
			$('#schemaValues').empty();

		} else if ('hashChanged' === m.type) {
			var hash = m.hash;
			if (hash.substr(0, HASH_NEW_PREFIX.length) === HASH_NEW_PREFIX) {
				// New document
				var schemaName = hash.substr(HASH_NEW_PREFIX.length);
				schemaName = $n2.utils.unescapeHtmlId(schemaName);
				createNewDocumentFromSchemaName(schemaName);
			};
		};
	};

	function getUuid() {
		return new Promise(function (resolve, reject) {
			documentSource.getUniqueIdentifier({
				onSuccess: function(uuid){	
					resolve(uuid);
				},
				onError: function(err) {
					reject();
				}
		  	});
		});
	}

	//function checkUploadService()
	//function createDocument()
	function uploadMediaFile(file, i, uploadFileId) {
		let data = new FormData();
		data.append('media', file);
		data.append('progressId', `progress${i}`);
		data.append('uploadId', uploadFileId);

		return new Promise(function (resolve, reject) {
			$.ajax({
				type: 'POST'
				,url: `${uploadService.options.url}put`
				,data: data
				,dataType: 'json'
				,processData: false
				,contentType: false
				,success: function(res) {
					if( res.error ) {
						reject(res.error);
					} else {
						resolve(res);
					}
				}
				,error: function(xhr, status, err) {
					reject(err);
				}
			});
		})
	}
		  
	function uploadFiles(event) {
		console.log("Handler for .submit() called.");
		console.log(event);
		if (uploadService) {
			// Verify that server is available
			uploadService.getWelcome({
				onSuccess: async function () {
					for (let i = 0; i < filesToUpload.length; i++) {
						const uploadFile = filesToUpload[i];
						const uploadFileId = await getUuid();
						
						let newDoc = selectedSchema.createObject({});
						newDoc[templateDoc.nunaliit_schema] = templateDoc[templateDoc.nunaliit_schema];

						// Compute a new attachment name
						var attName = 'media';

						// Update document
						newDoc.nunaliit_attachments.files[attName] = {
							attachmentName: attName
							,status: "waiting for upload"
							,data: {}
							,uploadId: uploadFileId
						};

						documentSource.createDocument({
							doc: newDoc
							,onSuccess: async function(createdDoc) {
								console.log('DOC CREATED with');
								console.log(createdDoc);
								console.log(`uploadId: ${uploadFileId}`);
								console.log('DOC CREATED END');
								await uploadMediaFile(uploadFile, i, uploadFileId);
								console.log(`${createdDoc._id}, ${uploadFileId}, ${uploadFile.name}`);
							}
							,onError: function(err) {
								console.log('Error creating doc');
							}
						})
					}
				}
				, onError: function (err) {
					_this._enableControls();
					$n2.reportErrorForced('Server is not available: ' + err);
				}
			});
		}
	}	

	function main(opts_) {
		var opts = $n2.extend({
			config: null
		}, opts_);

		var config = opts.config;

		$n2.log('main', config);
		atlasDb = config.atlasDb;
		atlasDesign = config.atlasDesign;
		uploadService = config.directory.uploadService;
		searchServer = config.directory.searchService;
		requests = config.directory.requestService;
		contributions = config.contributions;
		couchEditor = config.couchEditor;
		schemaEditorService = config.directory.schemaEditorService;
		showService = config.directory.showService;
		schemaRepository = config.directory.schemaRepository;
		dispatcher = config.directory.dispatchService;
		createDocProcess = config.directory.createDocProcess;
		dialogService = config.directory.dialogService;
		documentSource = config.documentSource;

		dispatcher.register(DH, 'hashChanged', _handle);

		$('#selectSchemaButton').click(addDocument);
		$('#uploadFiles').change(function (event) {
			filesToUpload = event.target.files;
			for (let i = 0; i < filesToUpload.length; i++) {
				console.log(filesToUpload[i].name);
			}

		});
		$('#uploadForm').submit(function (event) {
			uploadFiles(event);

			event.preventDefault();
		});

		// Editor
		couchEditor.options.enableAddFile = true;
		// couchEditor.options.onCloseFn = function(){
		// 	$('#schemaValues').empty();
		// };
		schemaRepository.getSchema({
			name: 'object'
			, onSuccess: function (schema) {
				defaultSchema = schema;
				couchEditor.options.schema = defaultSchema;
			}
			, onError: function (err) {
				$n2.log('Unable to load schema for editor', err);
			}
		});

		config.start();
	};

	$n2.bulkUploadApp = {
		main: main
	};

})(jQuery, nunaliit2);