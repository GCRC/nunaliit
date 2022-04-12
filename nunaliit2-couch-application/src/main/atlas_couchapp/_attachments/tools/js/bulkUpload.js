; (function ($, $n2) {

	var DH = 'bulkUpload.js';

	var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };

	var HASH_NEW_PREFIX = "new_";

	var uploadService = null;
	var schemaEditorService = null;
	var schemaRepository = null;
	var dispatcher = null;
	var authService = null;
	var dialogService = null;
	let filesToUpload = null;
	let selectedSchema = null;
	let documentSource = null;
	let templateDoc = null;

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
			schemaRepository.getSchema({
				name: schemaName
				, onSuccess: function (schema) {
					createNewDocument(schema);
				}
				, onError: function (err) {
					$('#uploadErrors').append(`<p>Unable to get selected schema: ${err}</p>`);
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
	}

	function showEdit(doc, schema) {
		$('#schemaValues').empty();
		$('#uploadForm').removeClass('hiddenForm');

		this.schemaEditor = schemaEditorService.editDocument({
			doc: doc
			, schema: schema
			, $div: $('#schemaValues')
			, onChanged: function () {}
		});
	}

	function _handle(m) {
		if ('hashChanged' === m.type) {
			var hash = m.hash;
			if (hash.substr(0, HASH_NEW_PREFIX.length) === HASH_NEW_PREFIX) {
				// New document
				var schemaName = hash.substr(HASH_NEW_PREFIX.length);
				schemaName = $n2.utils.unescapeHtmlId(schemaName);
				createNewDocumentFromSchemaName(schemaName);
			};
		};
	}

	function getUuid() {
		return new Promise(function (resolve, reject) {
			documentSource.getUniqueIdentifier({
				onSuccess: function (uuid) {
					resolve(uuid);
				},
				onError: function (err) {
					reject();
				}
			});
		});
	}

	function checkUploadService() {
		return new Promise(function (resolve, reject) {
			if (uploadService) {
				uploadService.getWelcome({
					onSuccess: function () {
						return resolve(true);
					},
					onError: function () {
						return resolve(false);
					}
				});
			} else {
				return resolve(false);
			}
		})
	}

	function createDocument(newDoc) {
		return new Promise(function (resolve, reject) {
			documentSource.createDocument({
				doc: newDoc
				, onSuccess: function (createdDoc) {
					resolve(createdDoc);
				}
				, onError: function (err) {
					reject(err);
				}
			})
		});
	}

	function uploadMediaFile(file, i, uploadFileId) {
		let data = new FormData();
		data.append('media', file);
		data.append('progressId', `progress${i}`);
		data.append('uploadId', uploadFileId);

		return new Promise(function (resolve, reject) {
			$.ajax({
				type: 'POST'
				, url: `${uploadService.options.url}put`
				, data: data
				, dataType: 'json'
				, processData: false
				, contentType: false
				, success: function (res) {
					if (res.error) {
						reject(res.error);
					} else {
						resolve(res);
					}
				}
				, error: function (xhr, status, err) {
					reject(err);
				}
			});
		})
	}

	function addDocToStateTable(docInfo) {
		const tbody = $('#n2bulkMediaUploadTableBody')[0];
		$(`<tr id="statusRow_${docInfo.id}")><td>${docInfo.id}</td><td>${docInfo.filename}</td><td>${docInfo.state}</td></tr>`).appendTo(tbody);
	}

	function updateDocInStateTable(docInfo) {
		if($(`#statusRow_${docInfo.id}`).length === 0) {
			addDocToStateTable(docInfo);
			return;
		}
		const tr = $($(`#statusRow_${docInfo.id}`)[0]);
		tr.empty();
		$(`<td>${docInfo.id}</td>`).appendTo(tr);
		$(`<td>${docInfo.filename}</td>`).appendTo(tr);
		$(`<td>${docInfo.state}</td>`).appendTo(tr);
	}

	function refreshStateTable(createdDocs, import_profile) {
		const resultsDiv = $('#results');
		resultsDiv.html('');
		$('<div>').text(_loc('Import Profile: ') + import_profile).appendTo(resultsDiv);
		const table = $('<table>');
		$('<thead><tr><th>ID</th><th>File Name</th><th>Status</th></tr></thead>').appendTo(table);

		const tbody = $("<tbody id='n2bulkMediaUploadTableBody'>");
		createdDocs.forEach(docInfo => {
			$(`<tr><td>${docInfo.id}</td><td>${docInfo.filename}</td><td>${docInfo.state}</td></tr>`).appendTo(tbody);
		})
		tbody.appendTo(table);
		table.appendTo(resultsDiv);
	}

	async function uploadFiles() {
		$('#uploadErrors').text('');
		let createdDocs = [];
		const uploadAvailable = await checkUploadService();
		if (!uploadAvailable) {
			$('#uploadErrors').text('Upload service not available.');
			return
		}
		if (filesToUpload == null || filesToUpload.length < 1) {
			$('#uploadErrors').text('ERROR: No media files selected for upload. Use the "Choose Files" button to select them.');
			return
		}

		const attName = 'media';
		const importProfile = `bulk_media_upload_${(new Date()).toISOString()}`;
		refreshStateTable(createdDocs, importProfile);
		
		for (let i = 0; i < filesToUpload.length; i++) {
			const uploadFile = filesToUpload[i];
			const uploadFileId = await getUuid();

			const newDoc = selectedSchema.createObject({});
			newDoc[templateDoc.nunaliit_schema] = templateDoc[templateDoc.nunaliit_schema];

			newDoc.nunaliit_attachments.files[attName] = {
				attachmentName: attName
				, status: "waiting for upload"
				, data: {}
				, uploadId: uploadFileId
			};

			newDoc.nunaliit_import = {
				id: i
				,profile: importProfile
			}

			let docInfo = {
				id: '',
				uploadId: uploadFileId,
				filename: uploadFile.name,
				state: 'creating'
			};
			createdDocs.push(docInfo);
			
			try {
				const createdDoc = await createDocument(newDoc);
				docInfo.state = 'uploading media';
				docInfo.id = createdDoc._id;
				addDocToStateTable(docInfo);

				await uploadMediaFile(uploadFile, i, uploadFileId);
				docInfo.state = 'done';
				updateDocInStateTable(docInfo);
			} catch (err) {
				docInfo.state = `ERROR: ${err}`;
				updateDocInStateTable(docInfo);
				$('#uploadErrors').text('Error creating or uploading documents, see table for details.');
			}
		}
		refreshStateTable(createdDocs, importProfile);
	}

	function main(opts_) {
		var opts = $n2.extend({
			config: null
		}, opts_);

		var config = opts.config;

		$n2.log('main', config);
		uploadService = config.directory.uploadService;
		schemaEditorService = config.directory.schemaEditorService;
		schemaRepository = config.directory.schemaRepository;
		dispatcher = config.directory.dispatchService;
		dialogService = config.directory.dialogService;
		documentSource = config.documentSource;

		dispatcher.register(DH, 'hashChanged', _handle);

		$('#selectSchemaButton').click(addDocument);
		$('#uploadFiles').change(function (event) {
			filesToUpload = event.target.files;
		});
		$('#uploadForm').submit(function (event) {
			uploadFiles(event);
			event.preventDefault();
		});
		config.start();
	};

	$n2.bulkUploadApp = {
		main: main
	};

})(jQuery, nunaliit2);