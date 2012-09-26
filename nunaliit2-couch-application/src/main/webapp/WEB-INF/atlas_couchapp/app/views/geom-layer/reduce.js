function(keys, values, rereduce) {

	var result = null;
	
	for(var i=0,e=values.length;i<e;++i){
		var bbox = values[i];
		if( bbox ) {
			if( !result ) {
				result = bbox;
			} else {
				if( result[0] > bbox[0]  ){
					result[0] = bbox[0];
				};
				if( result[1] > bbox[1]  ){
					result[1] = bbox[1];
				};
				if( result[2] < bbox[2]  ){
					result[2] = bbox[2];
				};
				if( result[3] < bbox[3]  ){
					result[3] = bbox[3];
				};
			};
		};
	};
	
	return result;
}