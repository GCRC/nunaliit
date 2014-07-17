function(doc) {

// !code vendor/nunaliit2/n2.couchUtils.js
	
	var arr = [];
	n2utils.extractSpecificType(doc, 'date', arr);
	for(var i=0,e=arr.length; i<e; ++i){
		var d = arr[i];
		if( typeof d.min === 'number' && typeof d.max === 'number' ){
			emit([d.min,d.max],null);
		};
	};
};