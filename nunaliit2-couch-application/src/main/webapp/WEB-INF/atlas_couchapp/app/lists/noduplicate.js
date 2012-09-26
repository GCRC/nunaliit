function(head, req) {

	provides("js",function(){

		send('{"total_rows":'+head.total_rows+',"offset":'+head.offset+',"rows":[');
		var ids = {}
			,row
			,first = true
			;
		while(row = getRow()) {
			if( !ids[row.id] ) {
				if( first ) {
					first = false;
				} else {
					send( ',' );
				};
				send( toJSON(row) );
				ids[row.id] = 1;
			};
		};
		send(']}');
	
	});
}