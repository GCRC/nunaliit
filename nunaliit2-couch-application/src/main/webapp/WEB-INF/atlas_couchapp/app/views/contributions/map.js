function(doc) {

	if( doc 
	 && doc.nunaliit_contribution 
	 && doc.nunaliit_contribution.nunaliit_type === 'contribution'
	 && doc.nunaliit_contribution.reference 
	 && doc.nunaliit_contribution.reference.nunaliit_type
	 && doc.nunaliit_contribution.reference.nunaliit_type === 'reference'
	 && doc.nunaliit_contribution.reference.doc ) {
		emit(doc.nunaliit_contribution.reference.doc,doc);
	};
}