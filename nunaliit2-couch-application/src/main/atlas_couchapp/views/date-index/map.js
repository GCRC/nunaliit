function(doc) {

// !code vendor/nunaliit2/n2.couchUtils.js
	
	var arr = [];
	n2utils.extractSpecificType(doc, 'date', arr);
	for(var i=0,e=arr.length; i<e; ++i){
		var d = arr[i];
		var index = d.index ? d.index : null;
		if( d.ongoing && typeof d.min === 'number' ){
			emit(index, {min:d.min,ongoing:true});
		} else if( typeof d.min === 'number' && typeof d.max === 'number' ){
			emit(index, {min:d.min,max:d.max});
		};
	};
};