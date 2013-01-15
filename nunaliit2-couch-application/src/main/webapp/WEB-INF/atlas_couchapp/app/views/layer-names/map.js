function(doc){
	if( doc.nunaliit_layers ){
		if( doc.nunaliit_layers.length ) {
			for(var i=0,e=doc.nunaliit_layers.length;i<e;++i){
				var l = doc.nunaliit_layers[i];
				emit(l, 1);
			};
		};
	};
};