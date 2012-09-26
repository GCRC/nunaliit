function(doc){
	// !code n2/utils.js
	
	var test = util();
	if( test ) {
		emit(doc._id,null);
	}
}