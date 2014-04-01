function(newDoc, oldDoc, userCtxt) {
	
	var n2utils = require('vendor/nunaliit2/n2.couchUtils');
	var n2atlas = require('vendor/nunaliit2/atlas');
	
    var reAtlasAdmin = new RegExp("(.*)_administrator");
    var reAtlasVetter = new RegExp("(.*)_vetter");
    var reAtlasReplicator = new RegExp("(.*)_replicator");
    var reAtlasUser = new RegExp("(.*)_user");
    var reAtlasLayer = new RegExp("(.*)_layer_(.*)");
    var reGlobalLayer = new RegExp("layer_(.*)");
	
	var publicLayerName = 'public';
	var publicLayerPrefix = 'public_';
	
//log('validate doc update '+oldDoc+'->'+newDoc+' userCtxt: '+JSON.stringify(userCtxt));
//log('validate doc update '+JSON.stringify(oldDoc)+'->'+JSON.stringify(newDoc));	
//log('Atlas name: '+n2atlas.name);

	var userInfo = getRolesInfo(userCtxt.roles);

	// Validate new documents and updates submitted to database...
	if( !userCtxt ) {
		throw( {forbidden: 'Database submissions required a user context'} );
	};
	
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
	} else {
		// Regular access validation
		
		var userName = userCtxt.name;
		
		// Verify document structure
		n2utils.validateDocumentStructure(newDoc,function(msg){
			throw( {forbidden: msg} );
		});
		
		// Evaluate vetting status
		var approveAction = false;
		var denyAction = false;
		var vettingAction = false;
		if( newDoc
		 && newDoc.nunaliit_submission ) {
			var newStatus = newDoc.nunaliit_submission.state;
			
			var oldStatus = getSubmissionState(oldDoc);
			
			if( newStatus === 'approved' && newStatus !== oldStatus ) {
				approveAction = true;
				vettingAction = true;
				
			} else if( newStatus === 'denied' && newStatus !== oldStatus ) {
				denyAction = true;
				vettingAction = true;
			};
			
			if( approveAction ) {
				// Requires a special role to approve submission
				if( userInfo.atlas[n2atlas.name] 
				 && userInfo.atlas[n2atlas.name].vetter ) {
					// vetter is allowed any approvals
				} else {
					throw( {forbidden: 'Submission approval reserved to special role: vetter'} );
				};
			};
			
			if( denyAction ) {
				// Requires a special role to approve uploads
				if( userInfo.atlas[n2atlas.name] 
				 && userInfo.atlas[n2atlas.name].vetter ) {
					// vetter is allowed any denials
				} else {
					throw( {forbidden: 'Submission denial reserved to special role: vetter'} );
				};
			};
		};
		
		// Process new document
		if( !oldDoc ) {
			// New document must have a creator name
			if( typeof(newDoc.nunaliit_created) !== 'object' ) {
				throw( {forbidden: 'New documents require a "nunaliit_created" object'} );
			};
			if( newDoc.nunaliit_created.name != userName ) {
				throw( {forbidden: '"nunaliit_created.name" string must match user submitting document'} );
			};
			
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
				if( typeof(newDoc.nunaliit_created) !== 'object' ) {
					throw( {forbidden: 'Updated documents require a "nunaliit_created" object'} );
				};
				if( newDoc.nunaliit_created.name != oldDoc.nunaliit_created.name ) {
					throw( {forbidden: '"nunaliit_created.name" can not change on an update'} );
				};
			};

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
		
		// Verify type of documents
		if( newDoc.nunaliit_submission ) {
			// Submission documents
			if( newDoc._deleted ){
				throw( {forbidden: 'Not allowed to delete submission documents'} );
			} else if ( !oldDoc ) {
				// New document: OK
			} else if( vettingAction ){
				// OK
			} else {
				throw( {forbidden: 'Submission document can be modified only by vetters'} );
			};
			
			// Verify structure of submitted document
			if( newDoc.nunaliit_submission.submitted_doc
			 || newDoc.nunaliit_submission.submitted_reserved ) {
				var checkDoc = getDocumentFromSplits(
					newDoc.nunaliit_submission.submitted_doc
					,newDoc.nunaliit_submission.submitted_reserved
					);
				n2utils.validateDocumentStructure(checkDoc,function(msg){
					throw( {forbidden: 'Submitted Document: '+msg} );
				});
			};

			// Verify structure of approved document
			if( newDoc.nunaliit_submission.approved_doc
			 || newDoc.nunaliit_submission.approved_reserved ) {
				var checkDoc = getDocumentFromSplits(
					newDoc.nunaliit_submission.approved_doc
					,newDoc.nunaliit_submission.approved_reserved
					);
				n2utils.validateDocumentStructure(checkDoc,function(msg){
					throw( {forbidden: 'Approved Document: '+msg} );
				});
			};
			
		} else {
			throw( {forbidden: 'This document is not allowed in the submission database'} );
		};
	};
	
	function getSubmissionState(doc) {
		var status = null;
		
		if( doc
		 && doc.nunaliit_submission
		 && doc.nunaliit_submission.state ) {
			status = doc.nunaliit_submission.state;
		}
		
		return status;
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
				
			} else if( mAtlasLayer ){
				role.atlas = mAtlasLayer[1];
				role.layer = mAtlasLayer[2];

			} else if( mGlobalLayer ){
				role.layer = mGlobalLayer[1];
			};
		};
		
		return role;
	};
	
	function getDocumentFromSplits(doc, reserved){
		var result = {};
		
		if( doc ){
			for(var key in doc){
				var value = doc[key];
				result[key] = value;
			};
		};
		
		if( reserved ){
			for(var key in reserved){
				var value = reserved[key];
				result['_'+key] = value;
			};
		};
		
		return result;
	};
}