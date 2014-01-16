;(function($,$n2){

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };

var DH = 'user.js';	

var UserManagementApplication = $n2.Class({
	
	authService: null

	,userDb: null
	
	,userSearchService: null
	
	,userSchema: null
	
	,showService: null
	
	,userService: null
	
	,divId: null
	
	,initialize: function(opts_){
		var opts = $n2.extend({
			config: null
			,div: null
		},opts_);
		
		var _this = this;
		
		var config = opts.config;
		
		this.userDb = $n2.couch.getUserDb();
	 	
		this.authService = config.directory.authService;
		
		$n2.log('config',config);

		this.userService = config.directory.userService;
		
		var userDesign = this.userDb.getDesignDoc({ddName:'nunaliit_user'});
		
		this.userSearchService = new $n2.couchSearch.SearchServer({
			designDoc: userDesign
			,db: this.userDb
			// ,directory: null // do not set
		});
		
		config.directory.schemaRepository.getSchema({
			name: 'user'
			,onSuccess: function(s){
				_this.userSchema = s;
			}
		});
		
		this.showService = config.directory.showService;
		
		// Assign id to div
		this.divId = $( opts.div ).attr('id');
		if( !this.divId ){
			this.divId = $n2.getUniqueId();
			$( opts.div ).attr('id',this.divId);
		};
		
		this._display();
	}

	,_getDiv: function(){
		return $('#'+this.divId);
	}

	,_display: function(){
//		<div class="userAppInput">
//		<input id="userSearchBox" type="text"/>
//		<input id="btnQueryUsers" type="button" value="Query Users"/>
//		<input id="btnAddUser" type="button" value="Add User"/>
//		<input id="btnMyUser" type="button" value="My User"/>
//	</div>	
//	<div id="requests" class="userAppOutput">
//	</div>
		
		var _this = this;
		
		var div = this._getDiv();
		
		var $userInput = $('<div class="userAppInput"></div>')
			.appendTo(div);
		var $userOutput = $('<div class="userAppOutput"></div>')
			.appendTo(div);
		
		
		var $textInput = $('<input class="userAppSearchText" type="text"></input>')
			.appendTo($userInput);
		if( $textInput.autocomplete ) {
			$textInput.autocomplete({
				source: this.userSearchService.getJqAutoCompleteSource()
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
				_this.queryUsers();
			};
		});
		
		$('<input class="userAppQueryButton" type="button">')
			.val( _loc('Query Users') )
			.appendTo($userInput)
			.click(function(){
				_this.queryUsers();
			});
			
		$('<input class="userAppAddUser" type="button">')
			.val( _loc('Add User') )
			.appendTo($userInput)
			.click(function(){
				_this.addUser();
			});
		
		$('<input class="userAppMyUser" type="button">')
			.val( _loc('My User') )
			.appendTo($userInput)
			.click(function(){
				_this.queryMyUser();
			});
	}
	
	,_reportErrorsOnElem: function(errors, $elem) {
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
	}

	,_reportError: function() {
		var $div = this._getDiv();

		$div.find('.olkit_wait').remove();
		
		var $result = $div.find('.userAppOutput').empty();
		this._reportErrorsOnElem(arguments, $result);
	}

	,_startRequestWait: function() {
		var $div = this._getDiv();

		$div.find('.userAppOutput').html('<div class="olkit_wait"></div>');
	}

	,initiateEdit: function(userName) {
		var _this = this;
		
		var $request = this._getDiv().find('.userAppOutput');
		
		// Get document
		this.userDb.getUser({
			name: userName
			,onSuccess: function(doc) { 
				_this.userService.startEdit({
					userDoc: doc
					,elem: $request
					,userSchema: _this.userSchema
				});
			}
			,onError: function(){
				_this._reportError.apply(_this,arguments);
			}
		});
	}

	,queryMyUser: function() {
		var _this = this;
		
		if( this.authService ) {
			if( false == this.authService.isLoggedIn() ) {
				this.authService.showLoginForm({
					onSuccess: function(){
						_this.queryMyUser();
					}
				});
				return;
			};
			
			var user = this.authService.getCurrentUser();
			this.initiateEdit(user.name);
			
		} else {
			alert( _loc('Authentication service must be configured') );
		};
	}

	,addUser: function() {
		var _this = this;

		var $div = this._getDiv();
		
		$div.find('.userAppOutput').html('<div>'
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
			_this._startRequestWait();
			_this.userDb.createUser({
				name: userName
				,password: pw
				,display: userName
				,onSuccess: function() { 
					loginUser(userName, pw); 
				}
				,onError: function(){
					_this._reportError.apply(_this,arguments);
				}
			});
		};

		function loginUser(userName, pw) {
			if( _this.authService.isLoggedIn() ) {
				// Probably an administrator. No need
				// to login
				_this.initiateEdit(userName);
				
			} else {
				_this.authService.login({
					username: userName
					,password: pw
					,onSuccess: function() { 
						_this.initiateEdit(userName); 
					}
					,onError: function(){
						_this._reportError.apply(_this,arguments);
					}
				});
			};
		};
	}

	,queryUsers: function() {
		var _this = this;
		
		this._startRequestWait();
		
		var $div = this._getDiv();

		var searchString = $div.find('.userAppSearchText').val();
		if( typeof(searchString) === 'string' ){
			searchString = $n2.trim(searchString);
		} else {
			searchString = '';
		};
		
		if( '' === searchString ) {
			this.userDb.getAllUsers({
				onSuccess: reportUsers
				,onError: function(){
					_this._reportError.apply(_this,arguments);
				}
			});
		} else {
			// Perform a search
			var searchRequest = this.userSearchService.submitRequest(searchString, {
				onlyFinalResults: true
				,onError: function(){
					_this._reportError.apply(_this,arguments);
				}
				,onSuccess: function(searchResults){
					$n2.log('searchResults',searchResults);
					
					if( searchResults.sorted ){
						var docIds = [];
						for(var i=0,e=searchResults.sorted.length;i<e;++i){
							docIds.push(searchResults.sorted[i].id);
						};
						_this.userDb.getUsers({
							ids: docIds
							,onError: function(){
								_this._reportError.apply(_this,arguments);
							}
							,onSuccess: reportUsers
						});
					} else {
						_this._reportError('Search result does not contain any sorted entries');
					};
				}
			});
		};

		function reportUsers(arr) {
			var $outterDiv = $('<div class="n2UserList"></div>');
			$div.find('.userAppOutput').empty().append($outterDiv);

			for(var i=0,e=arr.length; i<e; ++i) {
				var doc = arr[i];

				reportUserDoc(doc, $outterDiv);
			};
		};

		function reportUserDoc(userDoc, $outterDiv) {
			if( _this.userSchema && _this.showService ){
				var $div = $('<div></div>');
				$outterDiv.append($div);

				var $a = $('<a href="#" alt="'+userDoc.name+'">'+userDoc._id+'</a>');
				$div.append( $a );
				$a.click(function(){
					var $a = $(this);
					var userName = $a.attr('alt');
					_this.initiateEdit(userName);
					return false;
				});
				
				_this.showService.displayBriefDescription(
					$a
					,{
						schemaName: 'user'
					}
					,userDoc
				);
				
			} else {
				var $userDiv = $('<div class="n2UserListEntry"></div>')
					.appendTo($outterDiv);
				
				$('<span class="userId"></span>')
					.text(userDoc._id)
					.appendTo($userDiv);
				
				$('<span class="userRev"></span>')
					.text(userDoc._rev)
					.appendTo($userDiv);
			
				var $name = $('<span class="userName"></span>')
					.text(userDoc._rev)
					.appendTo($userDiv);
		
				$('<a href="#"></a>')
					.attr('alt',userDoc.name)
					.text(userDoc.name)
					.appendTo($name)
					.click(function(){
						var $a = $(this);
						var userName = $a.attr('alt');
						_this.initiateEdit(userName);
						return false;
					});

				var display = '';
				if( userDoc.display ) {
					display = userDoc.display;
				};
				$('<span class="userDisplay"></span>')
					.text(display)
					.appendTo($userDiv);
				
				var roles = '';
				if( userDoc.roles ) {
					roles = userDoc.roles.join(', ');
				}
				$('<span class="userRoles"></span>')
					.text(roles)
					.appendTo($userDiv);
			};
		};
	}
});

$n2.userApp = {
	UserManagementApplication: UserManagementApplication
};
	
})(jQuery,nunaliit2);
