
function(doc, req) {
	// white list
	if( doc._id === '_design/mobile' ) {
		return true;
	};
	if( doc._id === 'org.nunaliit.mobile:schemaBlackList' ) {
		return true;
	};
	if( doc.nunaliit_type === 'schema' ) {
		return true;
	};
	
	return false;
}