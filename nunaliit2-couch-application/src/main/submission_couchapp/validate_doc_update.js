function(newDoc, oldDoc, userCtxt) {
	
	var n2utils = require('vendor/nunaliit2/n2.couchUtils');
	var n2atlas = require('vendor/nunaliit2/atlas');
	var n2validate = require('vendor/nunaliit2/validate');

	n2validate.validate_doc_update(newDoc, oldDoc, userCtxt, {
		n2utils: n2utils
		,n2atlas: n2atlas
	});
	
	if( newDoc && newDoc.nunaliit_submission ){
		n2validate.validate_submission_doc(newDoc, oldDoc, userCtxt, {
			n2utils: n2utils
			,n2atlas: n2atlas
		});
	};
}