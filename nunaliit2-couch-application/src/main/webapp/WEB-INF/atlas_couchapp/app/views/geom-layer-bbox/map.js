function(doc) {
// !code vendor/nunaliit2/n2.couchUtils.js

	var layers = n2utils.extractLayers(doc);
	if( layers && n2utils.isValidGeom(doc.nunaliit_geom) ) {
		var bbox = doc.nunaliit_geom.bbox;
		
		for(var i=0,e=layers.length; i<e; ++i) {
			emit(layers[i], bbox);
		}
	}
};