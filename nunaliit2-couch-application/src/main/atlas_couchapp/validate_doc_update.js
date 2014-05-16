function(newDoc, oldDoc, userCtxt) {
	
	var n2utils = require('vendor/nunaliit2/n2.couchUtils');
	var n2atlas = require('vendor/nunaliit2/atlas');
	
    var reAtlasAdmin = new RegExp("(.*)_administrator");
    var reAtlasVetter = new RegExp("(.*)_vetter");
    var reAtlasReplicator = new RegExp("(.*)_replicator");
    var reAtlasUser = new RegExp("(.*)_user");
    var reAtlasLayer = new RegExp("(.*)_layer_(.*)");
    var reAtlasAgreement = new RegExp("nunaliit_agreement_(.*)");
    var reGlobalLayer = new RegExp("layer_(.*)");
	
	var publicLayerName = 'public';
	var publicLayerPrefix = 'public_';
	
//log('validate doc update '+oldDoc+'->'+newDoc+' userCtxt: '+JSON.stringify(userCtxt));
//log('validate doc update '+JSON.stringify(oldDoc)+'->'+JSON.stringify(newDoc));	
//log('Atlas name: '+n2atlas.name);

	var userInfo = getRolesInfo(userCtxt.roles);
log('userCtxt.roles: '+userCtxt.roles);	
log('userInfo: '+JSON.stringify(userInfo));	

	// Validate new documents and updates submitted to database...
	if( !userCtxt ) {
		throw( {forbidden: 'Database submissions required a user context'} );
	}
	if( userInfo.admin ) {
		// system admin is allowed anything
	} else if( userInfo.atlas[n2atlas.name] 
	 && userInfo.atlas[n2atlas.name].admin ) {
		// atlas admin is allowed anything
	} else if( userInfo.atlas[n2atlas.name] 
	 && userInfo.atlas[n2atlas.name].replicator ) {
		// atlas replicator is allowed any changes
	} else if( n2atlas.restricted 
	 && null == userInfo.atlas[n2atlas.name] ) {
		throw( {forbidden: 'Database submissions are restricted to users associated with database'} );
	} else if( !userInfo.atlas[n2atlas.name]
	 || !userInfo.atlas[n2atlas.name].agreement ) {
		throw( {forbidden: 'Database submissions are restricted to users that have accepted the user agreement'} );
	} else if( n2atlas.submissionDbEnabled 
	 && !newDoc.nunaliit_upload_request ) {
		// Only upload requests are allowed
		throw( {forbidden: 'Database submissions must be performed via the submission database'} );
	} else {
		var userName = userCtxt.name;

		// Validate the document structure
		n2utils.validateDocumentStructure(newDoc, function(msg){
			throw( {forbidden: msg} );
		});
		
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
		
		// Process new document
		if( !oldDoc ) {
			// New document must have a creator name
			if( typeof(newDoc.nunaliit_created) !== 'object' ) {
				throw( {forbidden: 'New documents require a "nunaliit_created" object'} );
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
			if( typeof(oldDoc.nunaliit_created) === 'object' 
			 && typeof(oldDoc.nunaliit_created.name) === 'string' ) {
				// Perform verification only when old object has required information
				if( ! newDoc.nunaliit_created ) {
					throw( {forbidden: 'Updated documents require a "nunaliit_created" object'} );
				}
				if( newDoc.nunaliit_created.name != oldDoc.nunaliit_created.name ) {
					throw( {forbidden: '"nunaliit_created.name" can not change on an update'} );
				}
			}

			// Updates are allowed to the original user or if a vetter
			// performs a vetting action
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
			if( newDoc.nunaliit_last_updated.name != userName ) {
				throw( {forbidden: '"nunaliit_last_updated.name" string must match user submitting document'} );
			};
		};
		
		// Verify layers addition and removals
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
				var isPublic = isLayerNamePublic(layerName);
				if( !isPublic ) {
					// Exception for public layer
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
				var isPublic = isLayerNamePublic(layerName);
				if( !isPublic ) {
					// Exception for public layer
					if( userInfo.atlas[n2atlas.name] 
					 && userInfo.atlas[n2atlas.name].layers.indexOf(layerName) >= 0 ) {
						// OK
					} else {
						var expectedRole = '' + n2atlas.name + '_layer_' + layerName;
						throw( {forbidden: 'Deleting feature from layer "'+layerName+'" requires role: '+expectedRole} );
					};
				};
			};
		};
		
		// Verify attachment submitters
		verifyAttachmentSubmitters();
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
	
	// Take an array of roles and accumulate information about them
	function getRolesInfo(roles){
		var info = {
			admin: false
			,vetter: false
			,layers: []
			,atlasAdmin: false
			,atlas:{
				
			}
			,roles:[]
		};
		
		for(var i=0,e=roles.length; i<e; ++i){
			var r = roles[i];

			var ri = getRoleInfo(r);
			
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
					info.atlasAdmin = true;
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
	};
	
	// Parse role string and return information about it
	function getRoleInfo(r){
		var role = {
			name: r
		};
		
		if( '_admin' === r 
		 || 'administrator' === r ){
			role.admin = true;
			
		} else if( 'vetter' == r ){
			role.vetter = true;
			
		} else {
			var mAtlasAdmin = reAtlasAdmin.exec(r);
			var mAtlasVetter = reAtlasVetter.exec(r);
			var mAtlasReplicator = reAtlasReplicator.exec(r);
			var mAtlasUser = reAtlasUser.exec(r);
			var mAtlasAgreement = reAtlasAgreement.exec(r);
			var mAtlasLayer = reAtlasLayer.exec(r);
			var mGlobalLayer = reGlobalLayer.exec(r);

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
	};
	
	function isLayerNamePublic(layerId){
		if( layerId === publicLayerName ) return true;
		if( layerId.substr(0,publicLayerPrefix.length) === publicLayerPrefix ) return true;
		return false;
	};
}