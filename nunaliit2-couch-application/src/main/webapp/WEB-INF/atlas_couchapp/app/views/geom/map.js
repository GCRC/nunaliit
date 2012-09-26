function(doc) {

// !code vendor/nunaliit2/utils.js
	if( n2utils.isValidGeom(doc.nunaliit_geom) ) {
		var geomSize = n2utils.geomSize(doc.nunaliit_geom);
		
		emit(doc._id, geomSize);
	}
};