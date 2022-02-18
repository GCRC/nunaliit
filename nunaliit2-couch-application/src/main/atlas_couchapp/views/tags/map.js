function(doc) {
	// !code vendor/nunaliit2/n2.couchUtils.js

	// Search complete doc for outward links
	var tagObjs = [];
	n2utils.extractSpecificTypeWithKey(doc, 'root', 'tag', tagObjs);
	for(var i=0,e=tagObjs.length; i<e; ++i) {
		var key = tagObjs[i][0];
		var obj = tagObjs[i][1];
		var tags = obj.tags;
		if(!key) {
			key = 'undefined';
		}
		for(var tidx=0,tlen=tags.length; tidx<tlen; ++tidx) {
			var tag = tags[tidx];
			var tag = [key, tag];
			if(tag) {
				emit(tag, 1);
			}
		}
	}
}