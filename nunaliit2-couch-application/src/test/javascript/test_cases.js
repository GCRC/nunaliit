
// **** Atlas script ****

var regularAtlas = {
	name: 'atlas'
	,restricted: false
	,isDocumentDb: true
};
var restrictedAtlas = {
	name: 'atlas'
	,restricted: true
	,isDocumentDb: true
};
var submissionDb = {
	name: 'atlas'
	,restricted: false
	,isSubmissionDb: true
};

var n2AtlasObj = {};

function setAtlas(atlasObj){
	for(var key in n2AtlasObj){
		delete n2AtlasObj[key];
	};
	for(var key in atlasObj){
		n2AtlasObj[key] = atlasObj[key];
	};
};

// **** Scaffolding ****

function validate_doc_update(newDoc, oldDoc, userCtxt){
	n2validate.validate_doc_update(newDoc, oldDoc, userCtxt, {
		n2utils: n2utils
		,n2atlas: n2AtlasObj
	});
};

// **** User ****

var users = {
	john: {
		_id: 'org.couchdb.user:john'
		,_rev: '7-abcedf'
		,name: 'john'
		,roles: []
		,type: 'user'
	}
};

function getContext(opts_){
	// opts_ can have the following parameters:
	// user - full user object
	// name - string which is name of user
	// roles - array of strings, which are the roles assigned to the user 

	// Figure out user
	var u = null;
	if( opts_.user ) {
		// Whole user is given
		u = opts_.user;
		
	} else if( opts_.name ) {
		// Just a name is givne
		u = users[opts_.name];
	} else {
		// Nothing given
		u = {
			name: null
			,roles: []
		};
	};

	var context = {
		name: u.name
		,roles: []
	};
	
	// Copy user roles, if any
	for(var i=0,e=u.roles.length; i<e; ++i){
		context.roles.push(u.roles[i]);
	};
	
	// Copy roles in argument, if any
	if( opts_.roles ){
		for(var i=0,e=opts_.roles.length; i<e; ++i){
			context.roles.push(opts_.roles[i]);
		};
	};
	
	return context;
};

// **** Test cases ****

// *********
jsunit.defineTest('_admin can change a document',function($$){
	setAtlas(regularAtlas);
	var ctxt = getContext({
		name: 'john'
		,roles: ['_admin']
	});

	var prev = {
		_id: 'doc-1'
		,_rev: '1-abcdef'
	};

	var current = jsunit.extend(true,{},prev);
	current.test = 'a string';
	
	validate_doc_update(current, prev, ctxt);
});

// *********
jsunit.defineTest('atlas administrator can change a document',function($$){
	setAtlas(regularAtlas);
	var ctxt = getContext({
		name: 'john'
		,roles: ['atlas_administrator']
	});

	var prev = {
		_id: 'doc-1'
		,_rev: '1-abcdef'
	};

	var current = jsunit.extend(true,{},prev);
	current.test = 'a string';
	
	validate_doc_update(current, prev, ctxt);
});

// *********
jsunit.defineTest('atlas replicator can change a document',function($$){
	setAtlas(regularAtlas);
	var ctxt = getContext({
		name: 'john'
		,roles: ['atlas_replicator']
	});

	var prev = {
		_id: 'doc-1'
		,_rev: '1-abcdef'
	};

	var current = jsunit.extend(true,{},prev);
	current.test = 'a string';
	
	validate_doc_update(current, prev, ctxt);
});

// *********
jsunit.defineTest('administrators from a different atlas can not change a document',function($$){
	setAtlas(regularAtlas);
	var ctxt = getContext({
		name: 'john'
		,roles: ['other_administrator','nunaliit_agreement_atlas']
	});

	var prev = {
		_id: 'doc-1'
		,_rev: '1-abcdef'
	};

	var current = jsunit.extend(true,{},prev);
	current.test = 'a string';
	
	try {
		validate_doc_update(current, prev, ctxt);
		$$.fail('administrators from a different database are not allowed to change documents');
	} catch(e) {
		// OK
	};
});

// *********
jsunit.defineTest('atlas vetter can not change a document',function($$){
	setAtlas(regularAtlas);
	var ctxt = getContext({
		name: 'john'
		,roles: ['atlas_vetter','nunaliit_agreement_atlas']
	});

	var prev = {
		_id: 'doc-1'
		,_rev: '1-abcdef'
	};

	var current = jsunit.extend(true,{},prev);
	current.test = 'a string';
	
	try {
		validate_doc_update(current, prev, ctxt);
		$$.fail('administrators from a different database are not allowed to change docuemnts');
	} catch(e) {
		// OK
	};
});

// *********
jsunit.defineTest('in non-restricted mode, a regular user can create a document',function($$){
	setAtlas(regularAtlas);
	var ctxt = getContext({
		name: 'john'
		,roles: ['nunaliit_agreement_atlas']
	});

	var prev = null;
	
	var current = {
		_id: 'doc-1'
		,nunaliit_created:{
			nunaliit_type: 'actionstamp'
			,name: ctxt.name
			,time: 12345
			,action: 'created'
		}
		,nunaliit_last_updated:{
			nunaliit_type: 'actionstamp'
			,name: ctxt.name
			,time: 12345
			,action: 'updated'
		}
	};
	
	validate_doc_update(current, prev, ctxt);
});

// *********
jsunit.defineTest('in restricted mode, an atlas user can create a document',function($$){
	setAtlas(restrictedAtlas);
	var ctxt = getContext({
		name: 'john'
		,roles: ['atlas_user','nunaliit_agreement_atlas']
	});

	var prev = null;
	
	var current = {
		_id: 'doc-1'
		,nunaliit_created:{
			nunaliit_type: 'actionstamp'
			,name: ctxt.name
			,time: 12345
			,action: 'created'
		}
		,nunaliit_last_updated:{
			nunaliit_type: 'actionstamp'
			,name: ctxt.name
			,time: 12345
			,action: 'updated'
		}
	};
	
	validate_doc_update(current, prev, ctxt);
});

// *********
jsunit.defineTest('in restricted mode, a regular user can not create a document',function($$){
	setAtlas(restrictedAtlas);
	var ctxt = getContext({
		name: 'john'
		,roles: ['nunaliit_agreement_atlas']
	});

	var prev = null;
	
	var current = {
		_id: 'doc-1'
		,nunaliit_created:{
			nunaliit_type: 'actionstamp'
			,name: ctxt.name
			,time: 12345
			,action: 'created'
		}
		,nunaliit_last_updated:{
			nunaliit_type: 'actionstamp'
			,name: ctxt.name
			,time: 12345
			,action: 'updated'
		}
	};
	
	try {
		validate_doc_update(current, prev, ctxt);
		$$.fail('only atlas users should be able to create a document');
	} catch(e) {
		// OK
	};
});

//*********
jsunit.defineTest('in restricted mode, an atlas_administrator can create a document',function($$){
	setAtlas(restrictedAtlas);
	var ctxt = getContext({
		name: 'john'
		,roles: ['atlas_administrator','nunaliit_agreement_atlas']
	});

	var prev = null;
	
	var current = {
		_id: 'doc-1'
		,nunaliit_created:{
			nunaliit_type: 'actionstamp'
			,name: ctxt.name
			,time: 12345
			,action: 'created'
		}
		,nunaliit_last_updated:{
			nunaliit_type: 'actionstamp'
			,name: ctxt.name
			,time: 12345
			,action: 'updated'
		}
	};
	
	validate_doc_update(current, prev, ctxt);
});

//*********
jsunit.defineTest('in restricted mode, an atlas_vetter can create a document',function($$){
	setAtlas(restrictedAtlas);
	var ctxt = getContext({
		name: 'john'
		,roles: ['atlas_administrator','nunaliit_agreement_atlas']
	});

	var prev = null;
	
	var current = {
		_id: 'doc-1'
		,nunaliit_created:{
			nunaliit_type: 'actionstamp'
			,name: ctxt.name
			,time: 12345
			,action: 'created'
		}
		,nunaliit_last_updated:{
			nunaliit_type: 'actionstamp'
			,name: ctxt.name
			,time: 12345
			,action: 'updated'
		}
	};
	
	validate_doc_update(current, prev, ctxt);
});

// *********
jsunit.defineTest('vetter can change submission state',function($$){
	setAtlas(submissionDb);
	var ctxt = getContext({
		name: 'john'
		,roles: ['nunaliit_agreement_atlas','atlas_vetter']
	});

	var prev = {
		_id: 'doc-1'
		,_rev: '1-abcde'
		,nunaliit_created:{
			nunaliit_type: 'actionstamp'
			,name: 'someoneelse'
			,time: 12345
			,action: 'created'
		}
		,nunaliit_last_updated:{
			nunaliit_type: 'actionstamp'
			,name: 'someoneelse'
			,time: 12345
			,action: 'updated'
		}
		,nunaliit_submission:{
			state: 'submitted'
			,submitter_name: 'someoneelse'
			,submitter_roles: ['nunaliit_agreement_atlas']
			,original_reserved: {
				id: 'doc-2'
				,rev: '1-aaaaa'
			}
			,original_doc: {
				context: 'text'
			}
			,submitted_reserved: {
				id: 'doc-2'
				,rev: '1-aaaaa'
			}
			,submitted_doc: {
				context: 'text'
			}
		}
	};
	
	var current = {
		_id: 'doc-1'
		,_rev: '1-abcde'
		,nunaliit_created:{
			nunaliit_type: 'actionstamp'
			,name: 'someoneelse'
			,time: 12345
			,action: 'created'
		}
		,nunaliit_last_updated:{
			nunaliit_type: 'actionstamp'
			,name: ctxt.name
			,time: 23456
			,action: 'updated'
		}
		,nunaliit_submission:{
			state: 'approved'
			,submitter_name: 'someoneelse'
			,submitter_roles: ['nunaliit_agreement_atlas']
			,original_reserved: {
				id: 'doc-2'
				,rev: '1-aaaaa'
			}
			,original_doc: {
				context: 'text'
			}
			,submitted_reserved: {
				id: 'doc-2'
				,rev: '1-aaaaa'
			}
			,submitted_doc: {
				context: 'text'
			}
		}
	};
	
	validate_doc_update(current, prev, ctxt);
});

//*********
jsunit.defineTest('_admin can create an invalid document',function($$){
	setAtlas(regularAtlas);
	var ctxt = getContext({
		name: 'john'
		,roles: ['_admin']
	});

	var prev = null;
	
	var current = {
		_id: 'doc-1'
		,nunaliit_created:{
			time: 'Not valid document'
		}
	};
	
	validate_doc_update(current, prev, ctxt);
});

//*********
jsunit.defineTest('atlas_administrator can not create an invalid document',function($$){
	setAtlas(regularAtlas);
	var ctxt = getContext({
		name: 'john'
		,roles: ['nunaliit_agreement_atlas','atlas_administrator']
	});

	var prev = null;
	
	var current = {
		_id: 'doc-1'
		,nunaliit_created:{
			time: 'Not valid document'
		}
	};
	
	try {
		validate_doc_update(current, prev, ctxt);
		$$.fail('atlas_administrator should not be able to create an invalid document');
	} catch(e) {
		// OK
	};
});

//*********
jsunit.defineTest('atlas_vetter can not create an invalid document',function($$){
	setAtlas(regularAtlas);
	var ctxt = getContext({
		name: 'john'
		,roles: ['nunaliit_agreement_atlas','atlas_vetter']
	});

	var prev = null;
	
	var current = {
		_id: 'doc-1'
		,nunaliit_created:{
			time: 'Not valid document'
		}
	};
	
	try {
		validate_doc_update(current, prev, ctxt);
		$$.fail('atlas_vetter should not be able to create an invalid document');
	} catch(e) {
		// OK
	};
});

//*********
jsunit.defineTest('atlas_user can not create an invalid document',function($$){
	setAtlas(regularAtlas);
	var ctxt = getContext({
		name: 'john'
		,roles: ['nunaliit_agreement_atlas','atlas_user']
	});

	var prev = null;
	
	var current = {
		_id: 'doc-1'
		,nunaliit_created:{
			time: 'Not valid document'
		}
	};
	
	try {
		validate_doc_update(current, prev, ctxt);
		$$.fail('atlas_user should not be able to create an invalid document');
	} catch(e) {
		// OK
	};
});
