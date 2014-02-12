function(head, req) {

	provides("css",function(){

		while(row = getRow()) {
			if( row.value ) {
				send('\n/* ');
				send( toJSON(row.key) );
				send(' */\n');
				send( row.value );
			};
		};
	
	});
}