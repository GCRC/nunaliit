// This filter can be used during replication to prevent deleted documents
// from being sent, preventing the deletion to occur on the remote server.
//
function(doc, req) {
	return !doc._deleted;
}