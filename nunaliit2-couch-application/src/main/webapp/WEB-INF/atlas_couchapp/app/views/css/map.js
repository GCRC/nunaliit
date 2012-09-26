function(doc) {

	if( doc 
	 && doc.nunaliit_css 
	 && doc.nunaliit_css.nunaliit_type === 'css' 
	 && typeof(doc.nunaliit_css.css) === 'string'
		 ) {
		var order = 1 * doc.nunaliit_css.order;
		var key = [order,doc.nunaliit_css.name];
		emit(key,doc.nunaliit_css.css);
	};
}