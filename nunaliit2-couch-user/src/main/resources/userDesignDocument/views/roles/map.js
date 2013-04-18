function(doc) {

	if( doc 
	 && doc.type === 'user'
	 && doc.roles
	 && doc.roles.length
		 ) {
		// Loop through roles looking for vetter
		for(var i=0,e=doc.roles.length;i<e;++i){
			var role = doc.roles[i];
			emit(role,null);
		};
	};
}