function(keys, values, rereduce) {

	var result = 1;
	
	// Input values are one of the states: 'submitted', 'complete', 'denied', 'approved', 'resolved'
	// Output value is: 1 if all states are 'complete' or 'denied'
	if( rereduce ){
		values.forEach(function(value){
			if( 0 === value ){
				result = 0;
			};
		});
	} else {
		values.forEach(function(value){
			if( 'complete' === value ){
				// OK
			}
			else if( 'denied' === value ){
				// OK
			}
			else {
				result = 0;
			};
		});
	};
	
	return result;
}