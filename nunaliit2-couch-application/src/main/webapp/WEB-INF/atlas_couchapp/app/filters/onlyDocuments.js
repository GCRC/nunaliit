// This filter can be used during replication to transmit only the
// documents without any design documents
//
// POST /_replicate HTTP/1.1
//{"source":"atlas","target":"http://admin:password@127.0.0.1:5984/atlas2", filter":"atlas/onlyDocuments"}

function(doc, req) {
	if( doc._id.substr(0,8) == '_design/' ) {
		return false;
	} else {
		return true;
	}
}