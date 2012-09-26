function(doc) {

	if( doc.nunaliit_download_list ) {
		var docs = doc.nunaliit_download_list.docs;
		if( docs ){
			for(var i=0,e=docs.length; i<e; ++i){
				emit(docs[i],null);
			};
		};
	};

};