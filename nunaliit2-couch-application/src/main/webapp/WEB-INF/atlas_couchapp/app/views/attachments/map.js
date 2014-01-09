function(doc){
	if( doc.nunaliit_attachments
	 && doc.nunaliit_attachments.files 
	 ) {
		for(var attName in doc.nunaliit_attachments.files){
			var att = doc.nunaliit_attachments.files[attName];
			emit(att.status,attName);
		};
	};
}