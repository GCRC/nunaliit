function(doc) {
	// !code vendor/nunaliit2/n2.couchUtils.js

	// Search complete doc for outward links
	var tagObjs = [];
	n2utils.extractSpecificType(doc, 'tag', tagObjs);
	for(var i=0,e=tagObjs.length; i<e; ++i) {
		var tags = tagObjs[i].tags;
		var group = tagObjs[i].id;
		if(!group) {
			group = 'undefined';
		}
		for(var tidx=0,tlen=tags.length; tidx<tlen; ++tidx) {
			var tag = tags[tidx];
			var tag = [group, tag];
			if(tag) {
				emit(tag, 1);
			}
		}
	}
}