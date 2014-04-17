function(head, req) {

	provides("css",function(){
		var row = null;
		var sent = false;
		while( row = getRow() ){
			if( row.value && row.id ) {
				send('\n/* ');
				send( row.id );
				send(' */\n');
				send( row.value );
				sent = true;
			};
		};
		
		if( !sent ){
			send('/* No CSS available */\n');
		};
	});
}