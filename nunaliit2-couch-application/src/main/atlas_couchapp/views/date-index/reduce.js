function(keys, values, rereduce) {

	var result = null;
	
	if( rereduce ){
		for(var i=0,e=values.length;i<e;++i){
			var info = values[i];
			if( info ) {
				if( !result ) {
					result = {
						ongoing: info.ongoing
						,min: info.min
						,max: info.max
						,count: info.count
					};
				} else {
					if( result.ongoing !== info.ongoing ){
						result.ongoing = undefined;
					};
					if( result.min > info.min  ){
						result.min = info.min;
					};
					if( typeof result.max === 'number' 
					 && typeof info.max === 'number' ){
						if( result.max < info.max  ){
							result.max = info.max;
						};
					} else if( typeof info.max === 'number' ) {
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
					var ongoing = interval.ongoing ? true : false;
					result = {
						ongoing: ongoing
						,min: interval.min
						,count: 1
					};
					if( !ongoing ){
						result.max = interval.max;
					};
					
				} else {
					var ongoing = interval.ongoing ? true : false;
					
					if( ongoing !== result.ongoing ){
						result.ongoing = undefined;
					};
					
					if( result.min > interval.min  ){
						result.min = interval.min;
					};
					
					if( !ongoing ){
						if( typeof result.max === 'number' ) {
							if( result.max < interval.max  ){
								result.max = interval.max;
							};
						} else {
							result.max = interval.max;
						};
					};
					
					result.count++;
				};
			};
		};
	};
	
	return result;
}