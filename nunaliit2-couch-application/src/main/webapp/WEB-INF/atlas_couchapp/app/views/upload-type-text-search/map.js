function(doc) {

// !code vendor/nunaliit2/utils.js

	var found = false;
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
				found = true;
			};
		};
	};
	
	if( found ) {
		var map = n2utils.extractSearchTerms(doc);
		if( map ) {
			for(var word in map) {
				for(var aClass in classes) {
					emit([aClass, word, map[word].index],doc)
				};
			};
		};
	};
};