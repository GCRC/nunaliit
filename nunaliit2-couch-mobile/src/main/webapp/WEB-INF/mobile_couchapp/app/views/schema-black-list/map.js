function(doc) {

	if( doc.nunaliit_schema_black_list
	 && doc.nunaliit_schema_black_list.length ) {
		for(var i=0,e=doc.nunaliit_schema_black_list.length; i<e; ++i) {
			var blackListSchemaName = doc.nunaliit_schema_black_list[i];
			emit(blackListSchemaName,null);
		};
	};
};