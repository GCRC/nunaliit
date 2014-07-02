// Test
var n2validate = {
	reAtlasAdmin: new RegExp("(.*)_administrator"),
	reAtlasVetter: new RegExp("(.*)_vetter"),
	reAtlasReplicator: new RegExp("(.*)_replicator"),
	reAtlasUser: new RegExp("(.*)_user"),
	reAtlasLayer: new RegExp("(.*)_layer_(.*)"),
	reAtlasAgreement: new RegExp("nunaliit_agreement_(.*)"),
	reGlobalLayer: new RegExp("layer_(.*)"),
	
	publicLayerName: 'public',
	publicLayerPrefix: 'public_',
		
	validate_doc_update: function(newDoc, oldDoc, userCtxt, x){
		var n2utils = x.n2utils;
		var n2atlas = x.n2atlas;
		
		//log('validate doc update '+oldDoc+'->'+newDoc+' userCtxt: '+JSON.stringify(userCtxt));
		//log('validate doc update '+JSON.stringify(oldDoc)+'->'+JSON.stringify(newDoc));	
		//log('Atlas name: '+n2atlas.name);

		// Must have a user context
		if( !userCtxt ) {
			throw( {forbidden: 'Database submissions required a user context'} );
		};

		var userInfo = n2validate.getUserInfo(userCtxt);
		//log('userCtxt.roles: '+userCtxt.roles);	
		//log('userInfo: '+JSON.stringify(userInfo));	

		// Validate new documents and updates submitted to database...
		if( userInfo.admin ) {
			// system admin is allowed anything
			
		} else if( userInfo.atlas[n2atlas.name] 
		 && userInfo.atlas[n2atlas.name].admin ) {
			// atlas admin is allowed anything, as long as the document
			// has a valid structure
			n2utils.validateDocumentStructure(newDoc, function(msg){
				throw( {forbidden: msg} );
			});
		
		} else if( userInfo.atlas[n2atlas.name] 
		 && userInfo.atlas[n2atlas.name].replicator ) {
			// atlas replicator is allowed any changes
		
		} else if( n2atlas.restricted 
		 && null == userInfo.atlas[n2atlas.name] ) {
			throw( {forbidden: 'Database submissions are restricted to users associated with database'} );
			
		} else if( n2atlas.restricted 
		 && userInfo.atlas[n2atlas.name]
		 && !userInfo.atlas[n2atlas.name].user ) {
			throw( {forbidden: 'Database submissions are restricted to users associated with database'} );
		
		} else if( !userInfo.atlas[n2atlas.name]
		 || !userInfo.atlas[n2atlas.name].agreement ) {
			throw( {forbidden: 'Database submissions are restricted to users that have accepted the user agreement'} );
		
		} else if( n2atlas.submissionDbEnabled
		 && n2atlas.isDocumentDb
		 && !newDoc.nunaliit_upload_request ) {
			// When the submission database is enabled, only upload requests are allowed
			// in document database
			throw( {forbidden: 'Database submissions must be performed via the submission database'} );
		
		} else {
	
			// Validate the document structure
			n2utils.validateDocumentStructure(newDoc, function(msg){
				throw( {forbidden: msg} );
			});
			
			// Check that nunaliit_creation is correct
			n2validate.verifyCreationStructure(newDoc, oldDoc, userInfo);
			
			// Check that nunaliit_creation is correct
			n2validate.verifyLastUpdatedStructure(newDoc, oldDoc, userInfo);
			
			// Validate changes in attachment status. Returns true if a vetting action
			// was performed
			var vettingAction = false;
			if( n2validate.verifyAttachmentStatus(newDoc, oldDoc, userInfo, n2atlas) ) {
				vettingAction = true;
			};
			
			// Validate changes in submission status. Returns true if a vetting action
			// was performed
			if( n2validate.verifySubmission(newDoc, oldDoc, userInfo, n2atlas, n2utils) ){
				vettingAction = true;
			};
			
			// Verify attachment submitters
			n2validate.verifyAttachmentSubmitters(newDoc, oldDoc, userInfo);
			
			// Check if allowed to delete
			n2validate.verifyDeletion(newDoc, oldDoc, userInfo);
			
			// Validate changes in layers
			n2validate.verifyLayers(newDoc, oldDoc, userInfo, n2atlas);
			
			// Process document update
			if( oldDoc && !newDoc._deleted ) {
	
				// Updates are allowed to the original user or if a vetter
				// performs a vetting action
				if( typeof(oldDoc.nunaliit_created) === 'object' 
				 && typeof(oldDoc.nunaliit_created.name) === 'string' 
				 && oldDoc.nunaliit_created.name === userInfo.name ) {
					// OK to update
				} else if( vettingAction ) {
					// OK to update
				} else {
					throw( {forbidden: 'Not allowed to update documents created by others'} );
				};
			};
		};
	},

	arrayContains: function(arr, obj) {
		return( arr.indexOf(obj) !== -1 );
	},

	getAttachmentInfo: function(doc, attName) {
		var info = null;
		
		if( doc
		 && doc.nunaliit_attachments
		 && doc.nunaliit_attachments.files
		 && doc.nunaliit_attachments.files[attName] ) {
			info = doc.nunaliit_attachments.files[attName];
		};
		
		return info;
	},

	getAttachmentStatus: function(doc, attName) {
		var status = null;
		
		var info = n2validate.getAttachmentInfo(doc, attName);
		if( info ) {
			status = info.status;
		};
		
		return status;
	},
	
	/*
	 * Detect deletion and validates that only original user can perform it
	 */
	verifyDeletion: function(newDoc, oldDoc, userInfo){
		if( newDoc._deleted ) {
			// This is a deletion
			if( typeof(oldDoc.nunaliit_created) === 'object' 
			 && typeof(oldDoc.nunaliit_created.name) === 'string' 
			 && oldDoc.nunaliit_created.name === userInfo.name ) {
				// OK to delete
			} else {
				throw( {forbidden: 'Not allowed to delete documents created by others'} );
			};
		};
	},
	
	/*
	 * This function verifies that a nunaliit_created structure is not
	 * modified
	 */
	verifyCreationStructure: function(newDoc, oldDoc, userInfo){
		if( !oldDoc ) {
			// New document
			if( typeof(newDoc.nunaliit_created) !== 'object' ) {
				throw( {forbidden: 'New documents require a "nunaliit_created" object'} );
			};
			if( newDoc.nunaliit_created.name != userInfo.name ) {
				throw( {forbidden: '"nunaliit_created.name" string must match user submitting document'} );
			};
			
		} else if( newDoc._deleted ) {
			// Do not check on deletion
			
		} else {
			// Document update
			if( oldDoc.nunaliit_created 
			 && newDoc.nunaliit_created ) {
				// Check that it remains unmodified
				if( newDoc.nunaliit_created.name != oldDoc.nunaliit_created.name
				 || newDoc.nunaliit_created.time != oldDoc.nunaliit_created.time 
				 || newDoc.nunaliit_created.action != oldDoc.nunaliit_created.action ){
					throw( {forbidden: 'Field "nunaliit_created" can not change on an update'} );
				};
				
			} else if( !oldDoc.nunaliit_created 
			 && !newDoc.nunaliit_created) {
				// That's OK.
			} else {
				throw( {forbidden: 'Field "nunaliit_created" can not be added or deleted on a document update'} );
			};
		};
	},
	
	/*
	 * This function verifies the validity of the field nunaliit_last_updated
	 */
	verifyLastUpdatedStructure: function(newDoc, oldDoc, userInfo){
		if( newDoc._deleted ) {
			// Do not check on deletion
			
		} else {
			// All documents must have a nunaliit_last_updated name
			if( typeof(newDoc.nunaliit_last_updated) !== 'object' ) {
				throw( {forbidden: 'Documents require a "nunaliit_last_updated" object'} );
			};
			if( newDoc.nunaliit_last_updated.name != userInfo.name ) {
				throw( {forbidden: '"nunaliit_last_updated.name" string must match user submitting document'} );
			};
		};
	},
	
	/*
	 * This function verifies that the status of attachment are fixed unless
	 * changed by a vetter
	 */
	verifyAttachmentStatus: function(newDoc, oldDoc, userInfo, n2atlas){
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
				
				var oldStatus = n2validate.getAttachmentStatus(oldDoc, attachmentName);
				
				if( newStatus === 'approved' && newStatus !== oldStatus ) {
					approveAction = true;
					vettingAction = true;
					
				} else if( newStatus === 'denied' && newStatus !== oldStatus ) {
					denyAction = true;
					vettingAction = true;

				} else if( newStatus === 'waiting for upload' && null === oldStatus ) {
					// OK. creating a new attachment
				
				} else if( newStatus !== oldStatus ) {
					throw( {forbidden: 'Not allowed to change status on attachments'} );
				};
			};
			
			if( approveAction ) {
				// Requires a special role to approve file uploads
				if( userInfo.atlas[n2atlas.name] 
				 && userInfo.atlas[n2atlas.name].vetter ) {
					// vetter is allowed any approvals
				} else {
					throw( {forbidden: 'Upload approval reserved to special role: vetter'} );
				};
			};
			
			if( denyAction ) {
				// Requires a special role to approve uploads
				if( userInfo.atlas[n2atlas.name] 
				 && userInfo.atlas[n2atlas.name].vetter ) {
					// vetter is allowed any denials
				} else {
					throw( {forbidden: 'Upload denial reserved to special role: vetter'} );
				};
			};
		};
		
		return vettingAction;
	},
	
	/*
	 * This function verifies that the name of submitters associated with
	 * the attachment do not change. 
	 */
	verifyAttachmentSubmitters: function(newDoc, oldDoc, userInfo){
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
		
		// Accumulate users for attachment in new document
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
				if( newSubmitters[fileName] === userInfo.name ) {
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
	},
	
	/*
	 * This function verifies that changes in submission document is valid 
	 */
	verifySubmission: function(newDoc, oldDoc, userInfo, n2atlas, n2utils){
		var vettingAction = false;
		
		if( newDoc 
		 && newDoc.nunaliit_submission ){
			if( n2atlas.isSubmissionDb ){
				n2validate.validate_submission_doc(newDoc, oldDoc, userInfo, {
					n2utils: n2utils
					,n2atlas: n2atlas
				});
			} else {
				throw( {forbidden: 'Submission documents are only allowed in the submission database'} );
			};
		};
		
		if( oldDoc
		 && newDoc
		 && !newDoc._deleted ){
			// This is an update
			if( !oldDoc.nunaliit_submission 
			 && newDoc.nunaliit_submission ){
				throw( {forbidden: 'Can not insert a submission structure'} );
			};
			if( oldDoc.nunaliit_submission 
			 && !newDoc.nunaliit_submission ){
				throw( {forbidden: 'Can not remove a submission structure'} );
			};
			if( oldDoc.nunaliit_submission 
			 && newDoc.nunaliit_submission ){
				if( newDoc.nunaliit_submission.submitter_name !== oldDoc.nunaliit_submission.submitter_name ){
					throw( {forbidden: 'Not allowed to change submitter on submission request'} );
				};
				
				if( newDoc.nunaliit_submission.state !== oldDoc.nunaliit_submission.state ){
					// State of submission has changed. This can only be performed by a vetter
					if( userInfo.atlas[n2atlas.name] && userInfo.atlas[n2atlas.name].vetter ){
						// OK
						vettingAction = true;
					} else {
						throw( {forbidden: 'Not allowed to change submission state unless vetter'} );
					};
				};
			};
		};
		
		return vettingAction;
	},
	
	/*
	 * This function verifies that changes in layers is restricted only to users that
	 * have the appropriate role. 
	 */
	verifyLayers: function(newDoc, oldDoc, userInfo, n2atlas){
		var oldDocLayers = {};
		var newDocLayers = {};
		
		// Accumulate old layers
		if( oldDoc && oldDoc.nunaliit_layers ) {
			for(var i=0,e=oldDoc.nunaliit_layers.length; i<e; ++i) {
				oldDocLayers[ oldDoc.nunaliit_layers[i] ] = 1;
			};
		};
		
		// Accumulate new layers
		if( newDoc._deleted ) {
			// deleting an object is like removing all layers
			// Do not put any layers in the new set
		} else if( newDoc.nunaliit_layers ) {
			for(var i=0,e=newDoc.nunaliit_layers.length; i<e; ++i) {
				newDocLayers[ newDoc.nunaliit_layers[i] ] = 1;
			};
		};
		
		// Figure out added layers
		var addedLayers = [];
		for(var layerName in newDocLayers) {
			if( !oldDocLayers[layerName] ) {
				addedLayers.push(layerName);
			};
		};
		
		// Figure out deleted layers
		var deletedLayers = [];
		for(var layerName in oldDocLayers) {
			if( !newDocLayers[layerName] ) {
				deletedLayers.push(layerName);
			};
		};
		
		// Must have appropriate role to delete/add to layer
		for(var i=0,e=addedLayers.length; i<e; ++i) {
			var layerName = addedLayers[i];
			var isPublic = n2validate.isLayerNamePublic(layerName);
			if( isPublic ) {
				// Exception for public layer. Everyone can add to a public layer
			} else {
				if( userInfo.atlas[n2atlas.name] 
				 && userInfo.atlas[n2atlas.name].layers.indexOf(layerName) >= 0 ) {
					// OK
				} else {
					var expectedRole = '' + n2atlas.name + '_layer_' + layerName;
					throw( {forbidden: 'Adding feature to layer "'+layerName+'" requires role: '+expectedRole} );
				};
			};
		};
		for(var i=0,e=deletedLayers.length; i<e; ++i) {
			var layerName = deletedLayers[i];
			var isPublic = n2validate.isLayerNamePublic(layerName);
			if( isPublic ) {
				// Exception for public layer. Everyone can delete from a public layer
			} else {
				if( userInfo.atlas[n2atlas.name] 
				 && userInfo.atlas[n2atlas.name].layers.indexOf(layerName) >= 0 ) {
					// OK
				} else {
					var expectedRole = '' + n2atlas.name + '_layer_' + layerName;
					throw( {forbidden: 'Deleting feature from layer "'+layerName+'" requires role: '+expectedRole} );
				};
			};
		};
	},
	
	// Take an array of roles and accumulate information about them
	getUserInfo: function(userCtxt){
		var info = {
			name: userCtxt.name
			,roles:[]
			,admin: false
			,vetter: false
			,layers: []
			,atlas:{}
			,n2Info: true
		};
		
		for(var i=0,e=userCtxt.roles.length; i<e; ++i){
			var r = userCtxt.roles[i];

			var ri = n2validate.getRoleInfo(r);
			
			info.roles.push(ri);
			
			if( ri.atlas ){
				var atlas = info.atlas[ri.atlas];
				if( !atlas ){
					atlas = {
						admin: false
						,vetter: false
						,replicator: false
						,user: false
						,agreement: false
						,layers: []
					};
					info.atlas[ri.atlas] = atlas;
				};
				
				if( ri.admin ){
					atlas.admin = true;
				};
				if( ri.vetter ){
					atlas.vetter = true;
				};
				if( ri.replicator ){
					atlas.replicator = true;
				};
				if( ri.user ){
					atlas.user = true;
				};
				if( ri.agreement ){
					atlas.agreement = true;
				};
				if( ri.layer ){
					atlas.layers.push(ri.layer);
				};
				
			} else {
				// Global role
				if( ri.admin ){
					info.admin = true;
				};
				if( ri.vetter ){
					info.vetter = true;
				};
				if( ri.layer ){
					info.layers.push(ri.layer);
				};
			};
		};
		
		return info;
	},
	
	// Parse role string and return information about it
	getRoleInfo: function(r){
		var role = {
			name: r
		};
		
		if( '_admin' === r 
		 || 'administrator' === r ){
			role.admin = true;
			
		} else if( 'vetter' == r ){
			role.vetter = true;
			
		} else {
			var mAtlasAdmin = n2validate.reAtlasAdmin.exec(r);
			var mAtlasVetter = n2validate.reAtlasVetter.exec(r);
			var mAtlasReplicator = n2validate.reAtlasReplicator.exec(r);
			var mAtlasUser = n2validate.reAtlasUser.exec(r);
			var mAtlasAgreement = n2validate.reAtlasAgreement.exec(r);
			var mAtlasLayer = n2validate.reAtlasLayer.exec(r);
			var mGlobalLayer = n2validate.reGlobalLayer.exec(r);

			if( mAtlasAdmin ){
				role.atlas = mAtlasAdmin[1];
				role.admin = true;
				
			} else if( mAtlasVetter ){
				role.atlas = mAtlasVetter[1];
				role.vetter = true;
				
			} else if( mAtlasReplicator ){
				role.atlas = mAtlasReplicator[1];
				role.replicator = true;
				
			} else if( mAtlasUser ){
				role.atlas = mAtlasUser[1];
				role.user = true;
				
			} else if( mAtlasAgreement ){
				role.atlas = mAtlasAgreement[1];
				role.agreement = true;
				
			} else if( mAtlasLayer ){
				role.atlas = mAtlasLayer[1];
				role.layer = mAtlasLayer[2];

			} else if( mGlobalLayer ){
				role.layer = mGlobalLayer[1];
			};
		};
		
		return role;
	},
	
	isLayerNamePublic: function(layerId){
		if( layerId === n2validate.publicLayerName ) return true;
		if( layerId.substr(0,n2validate.publicLayerPrefix.length) === n2validate.publicLayerPrefix ) return true;
		return false;
	},
	
	validate_submission_doc: function(newDoc, oldDoc, userInfo, x){
		// Check that this is a submission document
		if( typeof(newDoc.nunaliit_submission) !== 'object' ){
			throw( {forbidden: 'Expected a submission document'} );
		};
		
		// On a new submission, verify changes proposed
		if( !oldDoc ){
			// Create a user context
			var submissionUserCtxt = {};
			if( typeof(newDoc.nunaliit_submission.submitter_name) !== 'string' ){
				throw( {forbidden: 'Submisison must have a "submitter_name" field'} );
			};
			submissionUserCtxt.name = newDoc.nunaliit_submission.submitter_name;
			if( typeof(newDoc.nunaliit_submission.submitter_roles) !== 'object' ){
				throw( {forbidden: 'Expected roles for submitter'} );
			};
			if( typeof(newDoc.nunaliit_submission.submitter_roles.length) !== 'number' ){
				throw( {forbidden: 'Expected array of roles for submitter'} );
			};
			for(var i=0,e=newDoc.nunaliit_submission.submitter_roles.length; i<e; ++i){
				var role = newDoc.nunaliit_submission.submitter_roles[i];
				if( typeof(role) !== 'string' ){
					throw( {forbidden: 'Expected array of strings for submitter roles'} );
				};
			};
			submissionUserCtxt.roles = newDoc.nunaliit_submission.submitter_roles;

			// Re-create old document
			var submissionOldDoc = null;
			if( typeof(newDoc.nunaliit_submission.original_reserved) === 'object'
			 && typeof(newDoc.nunaliit_submission.original_doc) === 'object' ){
				submissionOldDoc = {};

				for(var key in newDoc.nunaliit_submission.original_doc){
					submissionOldDoc[key] = newDoc.nunaliit_submission.original_doc[key];
				};

				for(var key in newDoc.nunaliit_submission.original_reserved){
					submissionOldDoc['_'+key] = newDoc.nunaliit_submission.original_reserved[key];
				};
			};

			// Re-create new document
			var submissionNewDoc = null;
			if( newDoc.nunaliit_submission.deletion ) {
				submissionNewDoc = {
					_deleted: true
					,_id: newDoc.nunaliit_submission.original_reserved.id
					,_rev: newDoc.nunaliit_submission.original_reserved.rev
				};
				
			} else if( typeof(newDoc.nunaliit_submission.submitted_reserved) === 'object'
			 && typeof(newDoc.nunaliit_submission.submitted_doc) === 'object' ){
				submissionNewDoc = {};

				for(var key in newDoc.nunaliit_submission.submitted_doc){
					submissionNewDoc[key] = newDoc.nunaliit_submission.submitted_doc[key];
				};

				for(var key in newDoc.nunaliit_submission.submitted_reserved){
					submissionNewDoc['_'+key] = newDoc.nunaliit_submission.submitted_reserved[key];
				};
			};
			
			// Perform regular validation on submission
			n2validate.validate_doc_update(submissionNewDoc, submissionOldDoc, submissionUserCtxt, x);
		};
	}
};

if( typeof(exports) === 'object' ) {
	exports.validate_doc_update = n2validate.validate_doc_update;
	exports.validate_submission_doc = n2validate.validate_submission_doc;
};
