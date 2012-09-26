// This filter can be used during replication to transmit only the
// design document used for the atlas application.
//
// POST /_replicate HTTP/1.1
//{"source":"atlas","target":"http://admin:password@127.0.0.1:5984/atlas2", filter":"atlas/onlyAtlasDesignDoc"}

function(doc, req) {
	if( doc._id == '_design/atlas' ) {
		return true;
	} else {
		return false;
	}
}