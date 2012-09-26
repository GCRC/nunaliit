function(doc) {
	var classes = {};
	if( doc 
	 && doc.nunaliit_attachments 
	 && doc.nunaliit_attachments.files
	 && doc.nunaliit_attachments.files.length
	 ) {
		for(var i=0,e=doc.nunaliit_attachments.files.length; i<e; ++i) {
			var file = doc.nunaliit_attachments.files[i];
			if( file && file.fileClass ) {
				classes[file.fileClass] = 1;
			};
		};
	};
	for(var aClass in classes) {
		emit(aClass, doc);
	};
};