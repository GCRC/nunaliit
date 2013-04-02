;(function($,$n2){

var DH = 'user.js';	

var userDb = null;
var userSearchService = null;

function reportErrorsOnElem(errors, $elem) {
	$elem.append( $('<div>Error occurred during the request<div>') );
	
	for(var i=0, e=errors.length; i<e; ++i) {
		var e = errors[i];
		if( typeof(e) === 'object' ) {
			e = JSON.stringify(e);
		};
		if( typeof(e) === 'string' ) {
			$elem.append( $('<div>'+e+'<div>') );
		};
	};
};

function reportError() {
	$('.olkit_wait').remove();
	
	$('#requests').empty();
	reportErrorsOnElem(arguments, $('#requests'));
};

function startRequestWait() {
	$('#requests').html('<div class="olkit_wait"></div>');
};
	
function initiateEdit(userName) {
	// Get document
	startRequestWait();
	userDb.getUser({
		name: userName
		,onSuccess: function(doc) { 
			showEdit(doc); 
		}
		,onError: reportError
	});
	
	function showEdit(doc) {
		$('#requests').empty();
		
		var $editor = $('<div></div>');
		$('#requests').append($editor);
		
		var objectTree = new $n2.tree.ObjectTree($editor,doc);
		var treeEditor = new $n2.tree.ObjectTreeEditor(objectTree,doc);

		var $buttons = $('<div></div>');
		$('#requests').append($buttons);

		var $btnSave = $('<input type="button" value="Save"/>');
		$buttons.append($btnSave);
		var $btnDelete = $('<input type="button" value="Delete"/>');
		$buttons.append($btnDelete);
		
		$btnSave.click(function(){
			$('#editErrors').html('<div class="olkit_wait"></div>');
			userDb.updateUser({
				user: doc
				,onSuccess: function() {
					initiateEdit(userName);
				} 
				,onError: function() {
					$('#editErrors').empty();
					reportErrorsOnElem(arguments, $('#editErrors'));
				}
			});
		});
		
		$btnDelete.click(function(){
			if( false == confirm('You are about delete a user configuration object. Do you wish to proceed?') ) {
				return;
			};
			startRequestWait();
			userDb.deleteUser({
				user: doc
				,onSuccess: function() {
					$('#requests').text('Deleted user for: '+userName);
				} 
				,onError: reportError
			});
		});

		var $password = $('<div></div>');
		$('#requests').append($password);
		$password.append( $('<div>'
			+'<input id="changePw1" type="password"/>'
			+'<input id="changePw2" type="password"/>'
			+'<input id="btnChangePw" type="button" value="Change Password"/>'
			+'</div>') );
		$('#btnChangePw').click(function(){
			var pw1 = $('#changePw1').val();
			var pw2 = $('#changePw2').val();
			
			if( pw1 != pw2 ) {
				alert('Passwords do not match');
			} else if( pw1.length < 6 ) {
				alert('Password is too short');
			} else {
				startRequestWait();
				userDb.setUserPassword({
					user: doc
					,password: pw1
					,onSuccess: function() {
						initiateEdit(userName);
					} 
					,onError: reportError
				});
			};
		});	

		var $errors = $('<div id="editErrors"></div>');
		$('#requests').append($errors);
	};
};

function addUser() {
	$('#requests').html('<div>'
		+'User Name: <input id="addUserName" type="text"/><br/>'
		+'Password: <input id="addUserPassword1" type="password"/><br/>'
		+'Repeat Password: <input id="addUserPassword2" type="password"/><br/>'
		+'<input id="btnAddUser2" type="button" value="Proceed"/></div>');
	$('#addUserName').focus();
	
	$('#btnAddUser2').click(function(){
		var userName = $('#addUserName').val();
		var pw1 = $('#addUserPassword1').val();
		var pw2 = $('#addUserPassword2').val();

		if( pw1 != pw2 ) {
			alert('Passwords do not match');
		} else if( pw1.length < 6 ) {
			alert('Password is too short');
		} else {
			createInitialUser(userName, pw1);
		}
	});
	
	function createInitialUser(userName, pw) {
		startRequestWait();
		userDb.createUser({
			name: userName
			,password: pw
			,display: userName
			,onSuccess: function() { initiateEdit(userName); }
			,onError: reportError
		});
	};
};

function queryUsers() {
	startRequestWait();

	var searchString = $('#userSearchBox').val();
	if( typeof(searchString) === 'string' ){
		searchString = $n2.trim(searchString);
	} else {
		searchString = '';
	};
	
	if( '' === searchString ) {
		userDb.getAllUsers({
			onSuccess: reportUsers
			,onError: reportError
		});
	} else {
		// TBD
	};
	
	function reportUsers(arr) {
		var $table = $('<table></table>');
		$('#requests').empty().append($table);
	
		$table.append('<tr><th>ID</th><th>Revision</th><th>User</th><th>Display</th><th>Roles</th></tr>');
	
		for(var i=0,e=arr.length; i<e; ++i) {
			var $tr = $('<tr></tr>');
			$table.append($tr);
		
			var doc = arr[i];
		
			$tr.append( $('<td class="userId">'+doc._id+'</td>') );
			$tr.append( $('<td class="userRev">'+doc._rev+'</td>') );

			var $td = $('<td class="userName"></td>');
			$tr.append( $td );

			var $a = $('<a href="#" alt="'+doc.name+'">'+doc.name+'</a>');
			$td.append( $a );
			$a.click(function(){
				var $a = $(this);
				var userName = $a.attr('alt');
				initiateEdit(userName);
				return false;
			});

			var display = '';
			if( doc.display ) {
				display = doc.display;
			};
			$tr.append( $('<td class="userDisplay">'+display+'</td>') );
			
			var roles = '';
			if( doc.roles ) {
				roles = doc.roles.join(', ');
			}
			$tr.append( $('<td class="userRoles">'+roles+'</td>') );
		};
	};
};

function main() {
	$('#btnQueryUsers').click(queryUsers);
	$('#btnAddUser').click(addUser);
};

function main_init(config) {
	userDb = $n2.couch.getUserDb();
 	
	if( config.directory && config.directory.authService ) {
		config.directory.authService.createAuthWidget({
			elemId: 'login'
		});
	};
	
	$n2.log('config',config);

	var userDesign = userDb.getDesignDoc({ddName:'nunaliit_user'});
	
	userSearchService = new $n2.couchSearch.SearchServer({
		designDoc: userDesign
		,db: userDb
		// ,directory: null // do not set
	});

	var $textInput = $('#userSearchBox');
	if( $textInput.autocomplete ) {
		$textInput.autocomplete({
			source: userSearchService.getJqAutoCompleteSource()
		});
	};
	
 	main();
};


$n2.app = $n2.app ? $n2.app : {};
$n2.app.users = {
	main_init: main_init
};
	
})(jQuery,nunaliit2);
