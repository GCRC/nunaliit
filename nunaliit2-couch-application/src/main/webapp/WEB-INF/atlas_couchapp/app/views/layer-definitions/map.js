function(doc){
	if( doc.nunaliit_layer_definition ){
		var layerId = doc.nunaliit_layer_definition.id;
		if( !layerId ){
			layerId = doc._id;
		};
		emit(layerId, null);
	};
};