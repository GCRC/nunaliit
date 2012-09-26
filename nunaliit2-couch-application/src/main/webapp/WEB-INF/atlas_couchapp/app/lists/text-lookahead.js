function(head, req) {

	provides("js",function(){

		var top = req.query.top;
		
		var result = [];
		var row;
		while(row = getRow()) {
			var word = row.key;
			var count = row.value;
			
			result.push( [word,count] );
		};
		
		result.sort(function(a,b){
			// Sort by word count
			if( a[1] < b[1] ) {
				return 1;
			};
			if( a[1] > b[1] ) {
				return -1;
			};
			// Sort lexicographically
			if( a[0] < b[0] ) {
				return -1;
			};
			if( a[0] > b[0] ) {
				return 1;
			};
			return 0;
		});
		
		var full = true;
		if( top && top < result.length ) {
			result = result.slice(0,top);
			full = false;
		};
		
		send('{"rows":');
		
		send( toJSON(result) );

		// Returns whether the full listing was returned
		send(',"all_rows":'+full);
	
		send('}');
	});
}