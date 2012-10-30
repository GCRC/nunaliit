function(doc){
	if( doc.nunaliit_layer_definition ){
		emit(doc._id, null);
	};
};