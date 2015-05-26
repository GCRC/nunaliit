function(head, req) {

	provides("js",function(){

		send(';(function($n2){');
		send('if( !$n2.l10n ) $n2.l10n = {};');
		send('if( !$n2.l10n.strings ) $n2.l10n.strings = {};');
		send('function ls(arr){');
			send('for(var i=0,e=arr.length;i<e;++i){');
				send('var l = arr[i].l;');
				send('if(!$n2.l10n.strings[l])$n2.l10n.strings[l]={};');
				send('$n2.l10n.strings[l][arr[i].s]=arr[i].t;');
			send('};');
		send('};');

		send('ls([');
		
		var row
			,first = true
			;
		while(row = getRow()) {
			if( first ) {
				first = false;
			} else {
				send( ',' );
			};

			var data = {
				l: row.doc.lang
				,s: row.doc.str
				,t: row.doc.trans
			};
			
			send( toJSON(data) );
		};
		
		send(']);');

		send('if( typeof $n2.l10n.refreshLocalizedStrings === "function" ) $n2.l10n.refreshLocalizedStrings();');
		
		send('})(nunaliit2);');
	});
}