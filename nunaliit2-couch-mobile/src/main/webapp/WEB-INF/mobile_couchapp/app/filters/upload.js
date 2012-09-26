
function(doc, req) {
	// Black list
	if( doc._id == '_design/mobile' ) {
		return false;
	};
	if( doc._id == 'org.nunaliit.mobile.config' ) {
		return false;
	};

	return true;
}