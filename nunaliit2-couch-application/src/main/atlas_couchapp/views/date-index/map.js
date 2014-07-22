function(doc) {

// !code vendor/nunaliit2/n2.couchUtils.js
	
	var arr = [];
	n2utils.extractSpecificType(doc, 'date', arr);
	for(var i=0,e=arr.length; i<e; ++i){
		var d = arr[i];
		if( typeof d.min === 'number' && typeof d.max === 'number' ){
			var index = d.index ? d.index : null;
			emit(index, [d.min,d.max]);
		};
	};
};