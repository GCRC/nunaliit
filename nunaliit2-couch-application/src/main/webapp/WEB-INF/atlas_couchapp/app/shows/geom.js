function(doc,req) {
	var ddoc = this;
	var Mustache = require('vendor/nunaliit2/mustache');
	
	var data = {
		title: 'Geometry'
	};
	if( doc ) {
		data.title = 'Geometry ' + doc._id;
		data.wkt = doc.nunaliit_geom.wkt;
		data.bounds = ''+doc.bounds.minx+','+doc.bounds.miny+','+doc.bounds.maxx+','+doc.bounds.maxy;
	};
	
	return Mustache.to_html(ddoc.templates.nunaliit_geom, data);
}