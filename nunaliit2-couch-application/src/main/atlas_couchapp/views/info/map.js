function(doc){
	var info = {
		id: doc._id
		,rev: doc._rev
	};
	if( doc.nunaliit_schema ){
		info.schema = doc.nunaliit_schema;
	};
	if( doc.nunaliit_created
	 && doc.nunaliit_created.time ){
		info.createdTime = doc.nunaliit_created.time;
	};
	if( doc.nunaliit_last_updated
	 && doc.nunaliit_last_updated.time ){
		info.updatedTime = doc.nunaliit_last_updated.time;
	};
	emit(doc._id,info);
}