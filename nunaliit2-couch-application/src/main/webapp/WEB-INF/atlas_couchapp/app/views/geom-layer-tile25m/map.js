function(doc) {
// !code vendor/nunaliit2/n2.couchUtils.js
// !code vendor/nunaliit2/n2.couchTiles.js

	var layers = n2utils.extractLayers(doc);
	if( layers && n2utils.isValidGeom(doc.nunaliit_geom) ) {
		var geomSize = n2utils.geomSize(doc.nunaliit_geom);
		
		for(var i=0,e=layers.length; i<e; ++i) {
			// Emit the document for each tile
			var tiles = n2tiles.getTilesFromBounds(
				n2tiles.format4326_25M
				,doc.nunaliit_geom.bbox[0],doc.nunaliit_geom.bbox[1]
				,doc.nunaliit_geom.bbox[2],doc.nunaliit_geom.bbox[3]
				,200
				);
			for(var j=0,k=tiles.length; j<k; ++j) {
				emit([layers[i],tiles[j]], geomSize);
			};
		};
	};
};