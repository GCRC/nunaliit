function(newDoc, oldDoc, userCtxt) {

//log('validate doc update '+oldDoc+'->'+newDoc+' userCtxt: '+JSON.stringify(userCtxt));
//log('validate doc update '+JSON.stringify(oldDoc)+'->'+JSON.stringify(newDoc));	

	// Validate new documents and updates submitted to database...
	if( !userCtxt ) {
		throw( {forbidden: 'Database submissions required a user context'} );
	}
	if( userCtxt.roles && arrayContains(userCtxt.roles, '_admin') ) {
		// admin is allowed anything
	} else if( userCtxt.roles && arrayContains(userCtxt.roles, 'administrator') ) {
		// admin is allowed anything
	} else if( userCtxt.roles && arrayContains(userCtxt.roles, 'replicator') ) {
		// replicator is allowed any changes
	} else {
		var userName = userCtxt.name;
		
		// Any operation on download list must be done by a user with the
		// role 'mobile_download'
		if( newDoc.nunaliit_download_list ){
			if( !userCtxt.roles
			 || !arrayContains(userCtxt.roles, 'mobile_download') ) {
				throw( {forbidden: 'Operations on documents with \'nunaliit_download_list\' is reserved to users with role \'mobile_download\' '} );
			};
		};
		
		// Process new document
		if( !oldDoc ) {
			
		// Process document deletion	
		} else if( newDoc._deleted ) {
			
		// Process document update
		} else {

		};
		
	};
	
	function arrayContains(arr, obj) {
		return( arr.indexOf(obj) !== -1 );
	};
}