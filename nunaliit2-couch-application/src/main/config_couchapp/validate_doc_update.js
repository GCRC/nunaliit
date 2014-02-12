function(newDoc, oldDoc, userCtxt) {
	
	// Validate new documents and updates submitted to database...
	if( !userCtxt ) {
		throw( {forbidden: 'Database submissions required a user context'} );
	}
	if( userCtxt.roles && arrayContains(userCtxt.roles, '_admin') ) {
		// admin is allowed anything
	} else if( userCtxt.roles && arrayContains(userCtxt.roles, 'replicator') ) {
		// replicator is allowed access to database
	} else {
		throw( {forbidden: 'Changes to configuration allowed only to replicators'} );
	}

	// Verify that server configuration objects are consistent
	if( newDoc.nunaliit_type && newDoc.nunaliit_type === 'serverConfig' ) {
		if( newDoc._deleted ) {
			// Document being deleted, do not care
		} else {
			if( typeof(newDoc.server) !== 'string' ) {
				throw( {forbidden: 'Server configuration object must contain a "string" server field'} );
			};

			if( newDoc.server === '' ) {
				throw( {forbidden: 'Server configuration object can not have an empty "server" field'} );
			};

			var expectedName = 'org.nunaliit.serverConfig:'+newDoc.server;
			if( newDoc._id !== expectedName ) {
				throw( {forbidden: 'Server configuration object have a consistent identifier. Expected: '+expectedName} );
			};
		};
	};
	
	function arrayContains(arr, obj) {
		for(var i=0,e=arr.length; i<e; ++i) {
			if(arr[i] === obj){
				return true;
			}
		}
		return false;
	};
}