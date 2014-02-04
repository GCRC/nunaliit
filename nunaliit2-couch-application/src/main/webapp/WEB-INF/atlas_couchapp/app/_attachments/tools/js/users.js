;(function($,$n2){

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };

var DH = 'user.js';	

// *******************************************

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

//*******************************************

var UserCreationApplication = $n2.Class({

	authService: null

	,userDb: null
	
	,userSchema: null
	
	,showService: null
	
	,userService: null
	
	,divId: null
	
	,token: null
	
	,initialize: function(opts_){
		var opts = $n2.extend({
			config: null
			,div: null
			,token: null
		},opts_);
		
		var _this = this;
		
		this.token = opts.token;
		
		var config = opts.config;
		
		this.userDb = $n2.couch.getUserDb();
	 	
		this.authService = config.directory.authService;
		
		$n2.log('config',config);

		this.userService = config.directory.userService;
		
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
		
		var $display = this._getDiv();
		$display.empty();
		
		$('<div>')
			.addClass('tokenVerification')
			.text( _loc('Verifying token') )
			.appendTo($display);
		
		this.userService.validateUserCreation({
			token: this.token
			,onSuccess: function(result){
				_this._displayForm(result);
			}
			,onError: function(err){
				var $display = _this._getDiv();
				$display.empty();

				$('<div>')
					.addClass('tokenVerificationError')
					.text( _loc('Unable to verify token') )
					.appendTo($display);
				
				$('<div>')
					.addClass('tokenVerificationCause')
					.text( err )
					.appendTo($display);
			}
		});
	}

	,_getDiv: function(){
		return $('#'+this.divId);
	}
	
	,_displayForm: function(info){
		var _this = this;
		
		$n2.log('info',info);
		var emailAddress = info.emailAddress;

		var $display = _this._getDiv();
		$display.empty();

		if( emailAddress ){
			$('<div>')
				.addClass('tokenVerifiedEmail')
				.text( _loc('Creating a user associated with the e-mail address: {address}',{
					address: emailAddress
				}) )
				.appendTo($display);
		
		};
		
		var $form = $('<div>')
			.addClass('tokenCreationForm')
			.appendTo($display);

		// Display name
		var $line = $('<div>')
			.addClass('line')
			.appendTo($form);
		$('<div>')
			.addClass('label')
			.text( _loc('Display Name') )
			.appendTo($line);
		$('<div class="value"><input class="displayName" type="text"/></div>')
			.appendTo($line);

		// Password
		var $line = $('<div>')
			.addClass('line')
			.appendTo($form);
		$('<div>')
			.addClass('label')
			.text( _loc('Password') )
			.appendTo($line);
		$('<div class="value"><input class="password1" type="password"/></div>')
			.appendTo($line);

		// Verify Password
		var $line = $('<div>')
			.addClass('line')
			.appendTo($form);
		$('<div>')
			.addClass('label')
			.text( _loc('Verify Password') )
			.appendTo($line);
		$('<div class="value"><input class="password2" type="password"/></div>')
			.appendTo($line);
		
		$('<button>')
			.addClass('createUser')
			.appendTo($form)
			.text( _loc('Create User') )
			.click(function(){
				var $display = _this._getDiv();
				var displayName = $display.find('.displayName').val();
				var password1 = $display.find('.password1').val();
				var password2 = $display.find('.password2').val();
				
				if( displayName ){
					displayName = displayName.trim();
				};
				if( password1 ){
					password1 = password1.trim();
				};
				if( password2 ){
					password2 = password2.trim();
				};
				
				if( !password1 ) {
					alert( _loc('You must provide a password') );
					return;
				} else if( password1.length < 6 ) {
					alert( _loc('Your password is too short') );
					return;
				} else if( password1 !== password2 ) {
					alert( _loc('The provided passwords must match') );
					return;
				};
				
				if( !displayName ){
					alert( _loc('You must provide a display name') );
					return;
				};
				
				_this._createUser(displayName, password1);
			});
	}
	
	,_createUser: function(displayName, password){

		var _this = this;
		
		this.userService.completeUserCreation({
			token: this.token
			,displayName: displayName
			,password: password
			,onSuccess: function(result){
				$n2.log('user created',result);
				var userName = result.name;
				_this._userCreated(userName,password);
			}
			,onError: function(err){
				var $display = _this._getDiv();
				$display.empty();

				$('<div>')
					.addClass('userCreationError')
					.text( _loc('Unable to create user') )
					.appendTo($display);
				
				$('<div>')
					.addClass('userCreationCause')
					.text( err )
					.appendTo($display);
			}
		});
	}
	
	,_userCreated: function(userName,password){
		var $display = this._getDiv();
		$display.empty();

		$('<div>')
			.addClass('userCreationSuccess')
			.text( _loc('User created successfully.') )
			.appendTo($display);
		
		// Log in user
		if( this.authService ){
			this.authService.login({
				username: userName
				,password: password
				,onSuccess: function(context){}
				,onError: function(errMsg){}
			});
		};
	}
});

//*******************************************

var PasswordRecoveryApplication = $n2.Class({

	authService: null

	,userDb: null
	
	,userSchema: null
	
	,showService: null
	
	,userService: null
	
	,divId: null
	
	,token: null
	
	,initialize: function(opts_){
		var opts = $n2.extend({
			config: null
			,div: null
			,token: null
		},opts_);
		
		var _this = this;
		
		this.token = opts.token;
		
		var config = opts.config;
		
		this.userDb = $n2.couch.getUserDb();
	 	
		this.authService = config.directory.authService;
		
		$n2.log('config',config);

		this.userService = config.directory.userService;
		
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
		
		var $display = this._getDiv();
		$display.empty();
		
		$('<div>')
			.addClass('tokenVerification')
			.text( _loc('Verifying token') )
			.appendTo($display);
		
		this.userService.validatePasswordRecovery({
			token: this.token
			,onSuccess: function(result){
				_this._displayForm(result);
			}
			,onError: function(err){
				var $display = _this._getDiv();
				$display.empty();

				$('<div>')
					.addClass('tokenVerificationError')
					.text( _loc('Unable to verify password recovery token') )
					.appendTo($display);
				
				$('<div>')
					.addClass('tokenVerificationCause')
					.text( err )
					.appendTo($display);
			}
		});
	}

	,_getDiv: function(){
		return $('#'+this.divId);
	}
	
	,_displayForm: function(info){
		var _this = this;
		
		$n2.log('info',info);
		var emailAddress = info.emailAddress;

		var $display = _this._getDiv();
		$display.empty();

		if( emailAddress ){
			$('<div>')
				.addClass('tokenVerifiedEmail')
				.text( _loc('Recovering password for a user associated with the e-mail address: {address}',{
					address: emailAddress
				}) )
				.appendTo($display);
		
		};
		
		var $form = $('<div>')
			.addClass('tokenPasswordRecoveryForm')
			.appendTo($display);

		// Password
		var $line = $('<div>')
			.addClass('line')
			.appendTo($form);
		$('<div>')
			.addClass('label')
			.text( _loc('Password') )
			.appendTo($line);
		$('<div class="value"><input class="password1" type="password"/></div>')
			.appendTo($line);

		// Verify Password
		var $line = $('<div>')
			.addClass('line')
			.appendTo($form);
		$('<div>')
			.addClass('label')
			.text( _loc('Verify Password') )
			.appendTo($line);
		$('<div class="value"><input class="password2" type="password"/></div>')
			.appendTo($line);
		
		$('<button>')
			.addClass('createUser')
			.appendTo($form)
			.text( _loc('Set Password') )
			.click(function(){
				var $display = _this._getDiv();
				var password1 = $display.find('.password1').val();
				var password2 = $display.find('.password2').val();
				
				if( password1 ){
					password1 = password1.trim();
				};
				if( password2 ){
					password2 = password2.trim();
				};
				
				if( !password1 ) {
					alert( _loc('You must provide a password') );
					return;
				} else if( password1.length < 6 ) {
					alert( _loc('Your password is too short') );
					return;
				} else if( password1 !== password2 ) {
					alert( _loc('The provided passwords must match') );
					return;
				};
				
				_this._recoverPassword(password1);
			});
	}
	
	,_recoverPassword: function(password){

		var _this = this;
		
		this.userService.completePasswordRecovery({
			token: this.token
			,password: password
			,onSuccess: function(result){
				$n2.log('password recovered',result);
				var userName = result.name;
				_this._passwordRecovered(userName,password);
			}
			,onError: function(err){
				var $display = _this._getDiv();
				$display.empty();

				$('<div>')
					.addClass('passwordRecoveryError')
					.text( _loc('Unable to recover password') )
					.appendTo($display);
				
				$('<div>')
					.addClass('passwordRecoveryCause')
					.text( err )
					.appendTo($display);
			}
		});
	}
	
	,_passwordRecovered: function(userName,password){
		var $display = this._getDiv();
		$display.empty();

		$('<div>')
			.addClass('passwordRecoverySuccess')
			.text( _loc('Password was recovered successfully.') )
			.appendTo($display);
		
		// Log in user
		if( this.authService ){
			this.authService.login({
				username: userName
				,password: password
				,onSuccess: function(context){}
				,onError: function(errMsg){}
			});
		};
	}
});

$n2.userApp = {
	UserManagementApplication: UserManagementApplication
	,UserCreationApplication: UserCreationApplication
	,PasswordRecoveryApplication: PasswordRecoveryApplication
};
	
})(jQuery,nunaliit2);
