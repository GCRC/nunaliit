function(doc){
	var info = {
		id: doc._id
		,rev: doc._rev
	};
	if( doc.nunaliit_schema ){
		info.schema = doc.nunaliit_schema;
	};
	emit(doc._id,info);
}