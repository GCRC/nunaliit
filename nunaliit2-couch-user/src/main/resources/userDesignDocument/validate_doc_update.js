function(newDoc, oldDoc, userCtx) {
	
	var reAtlasAdmin = /(.*)_administrator/;
	var reAtlasVetter = /(.*)_vetter/;
	var reAtlasReplicator = /(.*)_replicator/;
	var reAtlasUser = /(.*)_user/;
	var reAtlasLayer = /(.*)_layer_(.*)/;
	var reGlobalLayer = /layer_(.*)/;
	
	var userInfo = getRolesInfo(userCtx.roles);
	
	var isSystemAdmin = userInfo.admin;

	// Validate changes from a user (not a system administrator)
	if( !isSystemAdmin ) {
		// Verify role changes
		var oldRoles = null;
		if( oldDoc ){
			oldRoles = oldDoc.roles;
		};
		var changes = getRoleChanges(oldRoles, newDoc.roles);

		for(var i=0,e=changes.changed.length;i<e;++i){
			var r = changes.changed[i];

			if( r.atlas ){
				// This is a role for an atlas. Atlas admins are
				// allowed to assign them
				if( userInfo 
				 && userInfo.atlas
				 && userInfo.atlas[r.atlas]
				 && userInfo.atlas[r.atlas].admin
				){
					// OK
				} else {
					throw({forbidden: 'Only atlas administrators may set atlas roles: '+r.atlas});
				};
				
			} else if( r.admin || r.vetter || r.layers.length > 0 ) {
				// Not an atlas role. Only system admins can change those
				throw({forbidden: 'Only administrators may set global roles'});
			};
		};
		
		// Only a user can modify his/her document, unless
		// an atlas administrator
		if (oldDoc) {
			if( userInfo.atlasAdmin ) {
				// OK, atlas admin is allowed
			} else if (userCtx.name !== newDoc.name) {
				throw({forbidden: 'You may only update your own user document.'});
			}
		};
		
		// Can not change validated e-mail addresses
		if( oldDoc ){
			var oldValidatedEmails = oldDoc.nunaliit_validated_emails ? oldDoc.nunaliit_validated_emails : [];
			var newValidatedEmails = newDoc.nunaliit_validated_emails ? newDoc.nunaliit_validated_emails : [];
			
			if( oldValidatedEmails.length != newValidatedEmails.length ){
				throw({forbidden: 'Can not modifiy nunaliit_validated_emails.'});
			};
			for(var i=0,e=oldValidatedEmails.length; i<e; ++i){
				if( newValidatedEmails.indexOf(oldValidatedEmails[i]) < 0 ){
					throw({forbidden: 'Can not modifiy nunaliit_validated_emails.'});
				};
			};
			for(var i=0,e=newValidatedEmails.length; i<e; ++i){
				if( oldValidatedEmails.indexOf(newValidatedEmails[i]) < 0 ){
					throw({forbidden: 'Can not modifiy nunaliit_validated_emails.'});
				};
			};
		}
	};
	
	// Given two arrays of roles, figure out which ones are added and deleted. Return
	// information about them
	function getRoleChanges(prevRoles, curRoles){
		var prevMap = {};
		var curMap = {};
		
		if(prevRoles){
			for(var i=0,e=prevRoles.length;i<e;++i){
				prevMap[prevRoles[i]] = true;
			};
		};
		
		if(curRoles){
			for(var i=0,e=curRoles.length;i<e;++i){
				curMap[curRoles[i]] = true;
			};
		};
		
		var changes = {
			added: []
			,removed: []
			,changed: []
		};
		
		// Find previous roles that are no longer in role list
		for(var r in prevMap){
			if( !curMap[r] ){
				var i = getRoleInfo(r);
				changes.removed.push(i);
				changes.changed.push(i);
			};
		};
		
		// Find current roles that were not in the role list
		for(var r in curMap){
			if( !prevMap[r] ){
				var i = getRoleInfo(r);
				changes.added.push(i);
				changes.changed.push(i);
			};
		};
		
		return changes;
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
}
