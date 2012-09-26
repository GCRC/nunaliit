function(doc) {
// !code vendor/nunaliit2/utils.js

	var layers = n2utils.extractLayers(doc);
	if( layers && n2utils.isValidGeom(doc.nunaliit_geom) ) {
		var geomSize = n2utils.geomSize(doc.nunaliit_geom);
		
		for(var i=0,e=layers.length; i<e; ++i) {
			emit([layers[i],doc._id], geomSize);
		}
	}
};