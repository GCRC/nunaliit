function(keys, values, rereduce) {

	var result = null;
	
	if( rereduce ){
		for(var i=0,e=values.length;i<e;++i){
			var info = values[i];
			if( info ) {
				if( !result ) {
					result = {
						min: info.min
						,max: info.max
						,count: info.count
					};
				} else {
					if( result.min > info.min  ){
						result.min = info.min;
					};
					if( result.max < info.max  ){
						result.max = info.max;
					};
					result.count += info.count;
				};
			};
		};
	} else {
		for(var i=0,e=values.length;i<e;++i){
			var interval = values[i];
			if( interval ) {
				if( !result ) {
					result = {
						min: interval[0]
						,max: interval[1]
						,count: 1
					};
				} else {
					if( result.min > interval[0]  ){
						result.min = interval[0];
					};
					if( result.max < interval[1]  ){
						result.max = interval[1];
					};
					result.count++;
				};
			};
		};
	};
	
	return result;
}