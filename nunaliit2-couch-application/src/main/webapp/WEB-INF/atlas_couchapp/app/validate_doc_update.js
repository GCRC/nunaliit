function(newDoc, oldDoc, userCtxt) {
	
	var n2utils = require('vendor/nunaliit2/utils');
	var n2atlas = require('vendor/nunaliit2/atlas');
	
//log('validate doc update '+oldDoc+'->'+newDoc+' userCtxt: '+JSON.stringify(userCtxt));
//log('validate doc update '+JSON.stringify(oldDoc)+'->'+JSON.stringify(newDoc));	
//log('Atlas name: '+n2atlas.name);

	var roleAdministrator = n2utils.getAtlasRole(n2atlas,'administrator');
	var roleVetter = n2utils.getAtlasRole(n2atlas,'vetter');
	var roleReplicator = n2utils.getAtlasRole(n2atlas,'replicator');

	// Validate new documents and updates submitted to database...
	if( !userCtxt ) {
		throw( {forbidden: 'Database submissions required a user context'} );
	}
	if( userCtxt.roles && arrayContains(userCtxt.roles, '_admin') ) {
		// system admin is allowed anything
	} else if( userCtxt.roles && arrayContains(userCtxt.roles, 'administrator') ) {
		// system admin is allowed anything
	} else if( userCtxt.roles && arrayContains(userCtxt.roles, roleAdministrator) ) {
		// atlas admin is allowed anything
	} else if( userCtxt.roles && arrayContains(userCtxt.roles, roleReplicator) ) {
		// atlas replicator is allowed any changes
	} else {
		var userName = userCtxt.name;
		
		// Evaluate vetting status
		var approveAction = false;
		var denyAction = false;
		var vettingAction = false;
		if( newDoc
		 && newDoc.nunaliit_attachments
		 && newDoc.nunaliit_attachments.files ) {
			var newFiles = newDoc.nunaliit_attachments.files;
			for(var attachmentName in newFiles) {
				var newFile = newFiles[attachmentName];
				var newStatus = newFile.status;
				
				var oldStatus = getFileStatus(oldDoc, attachmentName);
				
				if( newStatus === 'approved' && newStatus !== oldStatus ) {
					approveAction = true;
					vettingAction = true;
					
				} else if( newStatus === 'denied' && newStatus !== oldStatus ) {
					denyAction = true;
					vettingAction = true;
				};
			};
			
			if( approveAction ) {
				// Requires a special role to approve file uploads
				if( userCtxt.roles && (userCtxt.roles.indexOf(roleVetter) !== -1) ) {
					// vetter is allowed any approvals
				} else {
					throw( {forbidden: 'Upload approval reserved to special role: vetter'} );
				};
			};
			
			if( denyAction ) {
				// Requires a special role to approve uploads
				if( userCtxt.roles && (userCtxt.roles.indexOf(roleVetter) !== -1) ) {
					// vetter is allowed any denials
				} else {
					throw( {forbidden: 'Upload denial reserved to special role: vetter'} );
				};
			};
		};
		
		// Process new document
		if( !oldDoc ) {
			// New document must have a creator name
			if( typeof(newDoc.nunaliit_created) !== 'object' ) {
				throw( {forbidden: 'New documents require a "nunaliit_created" object'} );
			}
			if( newDoc.nunaliit_created.nunaliit_type !== 'actionstamp' ) {
				throw( {forbidden: 'New documents require a "nunaliit_created" with type "actionstamp"'} );
			}
			if( typeof(newDoc.nunaliit_created.name) !== 'string' ) {
				throw( {forbidden: 'New documents require a "nunaliit_created.name" string'} );
			}
			if( newDoc.nunaliit_created.name != userName ) {
				throw( {forbidden: '"nunaliit_created.name" string must match user submitting document'} );
			}
			
		// Process document deletion	
		} else if( newDoc._deleted ) {
			if( typeof(oldDoc.nunaliit_created) === 'object' 
			 && typeof(oldDoc.nunaliit_created.name) === 'string' 
			 && oldDoc.nunaliit_created.name === userName ) {
				// OK to delete
			} else {
				throw( {forbidden: 'Not allowed to delete documents created by others'} );
			};
			
		// Process document update
		} else {
			if( typeof(oldDoc.nunaliit_created) === 'object' && typeof(oldDoc.nunaliit_created.name) === 'string' ) {
				// Perform verification only when old object has required information
				if( typeof(newDoc.nunaliit_created) !== 'object' ) {
					throw( {forbidden: 'Updated documents require a "nunaliit_created" object'} );
				}
				if( newDoc.nunaliit_created.nunaliit_type !== 'actionstamp' ) {
					throw( {forbidden: 'Updated documents require a "nunaliit_created" with type "actionstamp"'} );
				}
				if( typeof(newDoc.nunaliit_created.name) !== 'string' ) {
					throw( {forbidden: 'Updated documents require a "nunaliit_created.name" string'} );
				}
				if( newDoc.nunaliit_created.name != oldDoc.nunaliit_created.name ) {
					throw( {forbidden: '"nunaliit_created.name" can not change on an update'} );
				}
			}

			if( typeof(oldDoc.nunaliit_created) === 'object' 
			 && typeof(oldDoc.nunaliit_created.name) === 'string' 
			 && oldDoc.nunaliit_created.name === userName ) {
				// OK to update
			} else if( vettingAction ) {
				// OK to update
			} else {
				throw( {forbidden: 'Not allowed to update documents created by others'} );
			};
		};
		
		// Process new document and updates
		if( ! newDoc._deleted ) {
			// All documents must have a nunaliit_last_updated name
			if( typeof(newDoc.nunaliit_last_updated) !== 'object' ) {
				throw( {forbidden: 'Documents require a "nunaliit_last_updated" object'} );
			};
			if( newDoc.nunaliit_last_updated.nunaliit_type !== 'actionstamp' ) {
				throw( {forbidden: 'Documents require a "nunaliit_last_updated" object of type "actionstamp"'} );
			};
			if( typeof(newDoc.nunaliit_last_updated.name) !== 'string' ) {
				throw( {forbidden: 'Documents require a "nunaliit_last_updated.name" string'} );
			};
			if( newDoc.nunaliit_last_updated.name != userName ) {
				throw( {forbidden: '"nunaliit_last_updated.name" string must match user submitting document'} );
			};
	
			// Verify geometries
			var geometries = [];
			n2utils.extractGeometries(newDoc, geometries);
			for(var i=0,e=geometries.length; i<e; ++i) {
				var geometry = geometries[i];
				
				if( !n2utils.isValidGeom(geometry) ) {
					throw( {forbidden: 'Invalid geometry'} );
				}
			};
		};
		
		// Verify layers
		if( newDoc.nunaliit_layers ) {
			if( !n2utils.isArray(newDoc.nunaliit_layers) ) {
				throw( {forbidden: 'layers must be an array'} );
			};
			for(var i=0,e=newDoc.nunaliit_layers.length; i<e; ++i) {
				if( typeof(newDoc.nunaliit_layers[i]) !== 'string' ) {
					throw( {forbidden: 'layers must be an array of strings'} );
				};
			};
		};
		{
			var oldDocLayers = {};
			var newDocLayers = {};
			if( oldDoc && oldDoc.nunaliit_layers ) {
				for(var i=0,e=oldDoc.nunaliit_layers.length; i<e; ++i) {
					oldDocLayers[ oldDoc.nunaliit_layers[i] ] = 1;
				};
			};
			if( newDoc._deleted ) {
				// deleting an object is like removing all layers
				// Do not put any layers in the new set
			} else if( newDoc.nunaliit_layers ) {
				for(var i=0,e=newDoc.nunaliit_layers.length; i<e; ++i) {
					newDocLayers[ newDoc.nunaliit_layers[i] ] = 1;
				};
			};
			// Figure out added
			var addedLayers = [];
			for(var layerName in newDocLayers) {
				if( !oldDocLayers[layerName] ) {
					addedLayers.push(layerName);
				};
			};
			// Figure out deleted
			var deletedLayers = [];
			for(var layerName in oldDocLayers) {
				if( !newDocLayers[layerName] ) {
					deletedLayers.push(layerName);
				};
			};
			// Must have appropriate role to delete/add to layer
			for(var i=0,e=addedLayers.length; i<e; ++i) {
				var layerName = addedLayers[i];
				if( layerName !== 'public' ) {
					// Exception for public layer
					var expectedRole = n2utils.getAtlasRole(n2atlas,'layer_'+layerName);
					if( userCtxt.roles && arrayContains(userCtxt.roles, expectedRole) ) {
						// OK
					} else {
						throw( {forbidden: 'Adding feature to layer "'+layerName+'" requires role: '+expectedRole} );
					};
				};
			};
			for(var i=0,e=deletedLayers.length; i<e; ++i) {
				var layerName = deletedLayers[i];
				if( layerName !== 'public' ) {
					// Exception for public layer
					var expectedRole = n2utils.getAtlasRole(n2atlas,'layer_'+layerName);
					if( userCtxt.roles && arrayContains(userCtxt.roles, expectedRole) ) {
						// OK
					} else {
						throw( {forbidden: 'Deleting feature from layer "'+layerName+'" requires role: '+expectedRole} );
					};
				};
			};
		};
		
		// Verify attachment submitters
		verifyAttachmentSubmitters();
		
		// Verify l10n request
		if( newDoc.nunaliit_type && 'translationRequest' == newDoc.nunaliit_type ) {
			if( typeof(newDoc.str) !== 'string' ) {
				throw( {forbidden: 'Translation requests must have a string "str"'} );
			}
			if( typeof(newDoc.lang) !== 'string' ) {
				throw( {forbidden: 'Translation requests must have a string "lang"'} );
			}
			if( newDoc.trans ) {
				if( typeof(newDoc.trans) !== 'string' ) {
					throw( {forbidden: 'Translation requests providing "trans" field must be string'} );
				}
			}
		};
		
		// Verify schema documents
		if( 'schema' === newDoc.nunaliit_type ) {
//			var name = newDoc.name;
//			var expectedId = 'org.nunaliit.schema:'+name;
//			if( newDoc._id != expectedId ) {
//				throw( {forbidden: 'Schema id expected to be: '+expectedId} );
//			};
//			// Must have an attribute array
//			if( !n2utils.isArray(newDoc.attributes) ) {
//				throw( {forbidden: 'Schemas must have "attributes" array'} );
//			};
		};
		
		// Verify CSS
		if( newDoc.nunaliit_css && newDoc.nunaliit_css.nunaliit_type === 'css' ) {
			if( typeof(newDoc.nunaliit_css.name) !== 'string' ) {
				throw( {forbidden: 'CSS fragments must have a string "name" property.'} );
			};
			if( typeof(newDoc.nunaliit_css.css) !== 'undefined'
			 && typeof(newDoc.nunaliit_css.css) !== 'string' ) {
				throw( {forbidden: 'CSS fragments must have a string "css" property.'} );
			};
		};
	};
	
	function arrayContains(arr, obj) {
		return( arr.indexOf(obj) !== -1 );
	};

	function getFileStatus(doc, fileName) {
		var status = null;
		
		if( doc
		 && doc.nunaliit_attachments
		 && doc.nunaliit_attachments.files
		 && doc.nunaliit_attachments.files[fileName]
		 && doc.nunaliit_attachments.files[fileName].status ) {
			status = doc.nunaliit_attachments.files[fileName].status;
		}
		
		return status;
	};
	
	function verifyAttachmentSubmitters(){
		var oldSubmitters = {};
		var newSubmitters = {};
		
		// Accumulate users for attachment in old document
		if( oldDoc
		 && oldDoc.nunaliit_attachments
		 && oldDoc.nunaliit_attachments.files
		 ) {
			for(var fileName in oldDoc.nunaliit_attachments.files){
				var file = oldDoc.nunaliit_attachments.files[fileName];
				if( file.submitter ) {
					oldSubmitters[fileName] = file.submitter;
				};
			};
		};
		
		// Accumulate users for attachment in old document
		if( newDoc
		 && newDoc.nunaliit_attachments
		 && newDoc.nunaliit_attachments.files
		 ) {
			for(var fileName in newDoc.nunaliit_attachments.files){
				var file = newDoc.nunaliit_attachments.files[fileName];
				if( file.submitter ) {
					newSubmitters[fileName] = file.submitter;
				};
			};
		};

		// A user can be added to an attachment only once and then it must remain
		// unchanged. User can be set only to be equal to the current user.
		for(var fileName in newSubmitters){
			if( typeof(oldSubmitters[fileName]) === 'undefined' ) {
				// Adding a new attachment. The submitter must be set to
				// the current user context
				if( newSubmitters[fileName] === userCtxt.name ) {
					// OK
				} else {
					throw( {forbidden: 'Submitter property associated with an attachment must be set to current user'} );
				};
			} else if( oldSubmitters[fileName] === newSubmitters[fileName] ) {
				// OK, submitter not changed
			} else {
				// Attempting to change the submitter after file was attached.
				// Forbidden
				throw( {forbidden: 'Submitter property can not be changed after an attachment is created.'} );
			};
		};
		
	};
}