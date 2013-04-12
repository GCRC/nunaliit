function(newDoc, oldDoc, userCtx) {
	
	var reAtlasAdmin = /(.*)_administrator/;
	var reAtlasVetter = /(.*)_vetter/;
	var reAtlasLayer = /(.*)_layer_(.*)/;
	var reGlobalLayer = /layer_(.*)/;
	
	var userInfo = getRoles(userCtx.roles);
	
	var isSystemAdmin = userInfo.admin;
	
	if (newDoc._deleted === true) {
		// allow deletes by admins and matching users
		// without checking the other fields
		if( isSystemAdmin || (userCtx.name == oldDoc.name) ) {
			return;
		} else {
			throw({forbidden: 'Only admins may delete other user docs.'});
		}
	}
	
	if( (oldDoc && oldDoc.type !== 'user') 
	 || newDoc.type !== 'user' ) {
		throw({forbidden : 'doc.type must be user'});
	} // we only allow user docs for now
	
	if( !newDoc.name 
	 || typeof(newDoc.name) !== 'string' ) {
		throw({forbidden: 'doc.name is required'});
	}
	
	if( typeof(newDoc.roles) === 'object'
	 && typeof(newDoc.roles.length) === 'number'
	 && typeof(newDoc.roles.push) === 'function'
	 && typeof(newDoc.roles.pop) === 'function' ) {
		// OK
	} else {
		throw({forbidden: 'doc.roles must be an array'});
	}
	
	if( newDoc._id !== ('org.couchdb.user:' + newDoc.name) ) {
		throw({forbidden: 'Doc ID must be of the form org.couchdb.user:name'});
	}
	
	if (oldDoc) { // validate all updates
		if (oldDoc.name !== newDoc.name) {
			throw({forbidden: 'Usernames can not be changed.'});
		}
	}
	
	if (newDoc.password_sha && !newDoc.salt) {
		throw({
			forbidden: 'Users with password_sha must have a salt.' +
			'See /_utils/script/couch.js for example code.'
		});
	}
	
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
				
			} else {
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
	}
	
	// no system roles in users db
	for (var i = 0; i < newDoc.roles.length; i++) {
		if (newDoc.roles[i][0] === '_') {
			throw({forbidden:'No system roles (starting with underscore) in users db.'});
		}
	}
	
	// no system names as names
	if (newDoc.name[0] === '_') {
		throw({forbidden: 'Username may not start with underscore.'});
	}
	
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
	function getRoles(roles){
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

			var i = getRoleInfo(r);
			
			info.roles.push(i);
			
			if( i.atlas ){
				var atlas = info.atlas[i.atlas];
				if( !atlas ){
					atlas = {
						admin: false
						,vetter: false
						,layers: []
					};
					info.atlas[i.atlas] = atlas;
				};
				
				if( i.admin ){
					atlas.admin = true;
					info.atlasAdmin = true;
				};
				if( i.vetter ){
					atlas.vetter = true;
				};
				if( i.layer ){
					atlas.layers.push(i.layer);
				};
				
			} else {
				// Global role
				if( i.admin ){
					info.admin = true;
				};
				if( i.vetter ){
					info.vetter = true;
				};
				if( i.layer ){
					info.layers.push(i.layer);
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
			var mAtlasLayer = reAtlasLayer.exec(r);
			var mGlobalLayer = reGlobalLayer.exec(r);

			if( mAtlasAdmin ){
				role.atlas = mAtlasAdmin[1];
				role.admin = true;
				
			} else if( mAtlasVetter ){
				role.atlas = mAtlasVetter[1];
				role.vetter = true;
				
			} else if( mAtlasLayer ){
				role.atlas = mAtlasLayer[1];
				role.layer = mAtlasLayer[2];

			} else if( mGlobalLayer ){
				role.layer = mGlobalLayer[1];
			};
		};
		
		return role;
	}
}
