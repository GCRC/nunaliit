function(doc) {

	if( doc 
	 && doc.type === 'user'
	 && doc.nunaliit_atlases
		 ) {
		// Loop through roles looking for vetter
		for(var atlasName in doc.nunaliit_atlases){
			emit(atlasName,null);
		};
	};
}