;(function($,$n2){

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };

var DH = 'user.js';	

var couchServer = null;
var userDb = null;
var userSearchService = null;
var userSchema = null;
var showService = null;
var userService = null;

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
	userDb.getUser({
		name: userName
		,onSuccess: function(doc) { 
			userService.startEdit({
				userDoc: doc
				,elemId: 'requests'
			});
		}
		,onError: reportError
	});
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
		// Perform a search
		var searchRequest = userSearchService.submitRequest(searchString, {
			onlyFinalResults: true
			,onError: reportError
			,onSuccess: function(searchResults){
				$n2.log('searchResults',searchResults);
				
				if( searchResults.sorted ){
					var docIds = [];
					for(var i=0,e=searchResults.sorted.length;i<e;++i){
						docIds.push(searchResults.sorted[i].id);
					};
					userDb.getDocuments({
						docIds: docIds
						,onError: reportError
						,onSuccess: reportUsers
					});
				} else {
					reportError('Search result does not contain any sorted entries');
				};
			}
		});
	};
	
	function reportUsers(arr) {
		if( userSchema && showService ){
			var $outterDiv = $('<div></div>');
			$('#requests').empty().append($outterDiv);
			
			for(var i=0,e=arr.length; i<e; ++i) {
				var doc = arr[i];

				var $div = $('<div></div>');
				$outterDiv.append($div);

				var $a = $('<a href="#" alt="'+doc.name+'">'+doc._id+'</a>');
				$div.append( $a );
				$a.click(function(){
					var $a = $(this);
					var userName = $a.attr('alt');
					initiateEdit(userName);
					return false;
				});
				
				showService.displayBriefDescription(
					$a
					,{
						schemaName: 'user'
					}
					,doc
				);
			};
			
		} else {
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
};

function main() {
	$('#btnQueryUsers').click(queryUsers);
	$('#btnAddUser').click(addUser);
};

function main_init(config) {
	couchServer = $n2.couch.DefaultServer;
	userDb = $n2.couch.getUserDb();
 	
	if( config.directory && config.directory.authService ) {
		config.directory.authService.createAuthWidget({
			elemId: 'login'
		});
	};
	
	$n2.log('config',config);

	userService = config.directory.userService;
	
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

	$textInput.keydown(function(e){
		var charCode = null;
		if( null === e ) {
			e = window.event; // IE
		};
		if( null !== e ) {
			if( e.keyCode ) {
				charCode = e.keyCode;
			};
		};

		if( 13 === charCode ) {
			queryUsers();
		};
	});
	
	config.directory.schemaRepository.getSchema({
		name: 'user'
		,onSuccess: function(s){
			userSchema = s;
		}
	});
	
	showService = config.directory.showService;
	
 	main();
};


$n2.app = $n2.app ? $n2.app : {};
$n2.app.users = {
	main_init: main_init
};
	
})(jQuery,nunaliit2);
