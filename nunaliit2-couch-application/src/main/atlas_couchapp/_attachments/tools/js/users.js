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
		var _this = this;
		
		var div = this._getDiv();
		var inputId = $n2.getUniqueId();

		var $userInput = $('<div class="userAppInput"></div>')
			.appendTo(div);
		var $userOutput = $('<div class="userAppOutput"></div>')
			.appendTo(div);
		
		var userSearchTxtFldOpts = {
			parentId: $n2.utils.getElementIdentifier($userInput),
			txtFldInputClasses: inputId,
			txtFldInputClasses: ['userAppSearchText'],
			txtFldLabel: 'User Search'
		};
		new $n2.mdc.MDCTextField(userSearchTxtFldOpts);

		var $textInput = $('#' + inputId);

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

		var btnParentId = $n2.utils.getElementIdentifier($userInput);

		new $n2.mdc.MDCButton({
			parentId: btnParentId,
			mdcClasses: ['userAppQueryButton'],
			btnLabel: 'Query Users',
			btnRaised: true,
			onBtnClick: function(){
				_this.queryUsers();
			}
		});

		new $n2.mdc.MDCButton({
			parentId: btnParentId,
			mdcClasses: ['userAppAddUser'],
			btnLabel: 'Add User',
			btnRaised: true,
			onBtnClick: function(){
				_this.addUser();
			}
		});
		
		new $n2.mdc.MDCButton({
			parentId: btnParentId,
			mdcClasses: ['userAppMyUser'],
			btnLabel: 'My User',
			btnRaised: true,
			onBtnClick: function(){
				_this.queryMyUser();
			}
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
			
			var userName = this.authService.getCurrentUserName();
			this.initiateEdit(userName);
			
		} else {
			alert( _loc('Authentication service must be configured') );
		};
	}

	,addUser: function() {
		var _this = this;

		var $div = this._getDiv();
		var formId = $n2.getUniqueId();

		var $userAppOutput = $div.find('.userAppOutput').empty();
		var $userForm = $('<form>')
			.attr('id', formId)
			.appendTo($userAppOutput);

		var addUserNameTxtFldOpts = {
			parentId: formId,
			txtFldInputId: 'addUserName',
			txtFldLabel: 'User Name'
		};
		new $n2.mdc.MDCTextField(addUserNameTxtFldOpts);
		
		$userForm.append('</br>');

		var addUserPassFldOpts = {
			parentId: formId,
			txtFldInputAttributes: {
				'type': 'password'
			},
			txtFldInputId: 'addUserPassword1',
			txtFldLabel: 'Password'
		};
		new $n2.mdc.MDCTextField(addUserPassFldOpts);

		$userForm.append('</br>');

		var addUserConfirmPassFldOpts = {
			parentId: formId,
			txtFldInputAttributes: {
				'type': 'password'
			},
			txtFldInputId: 'addUserPassword2',
			txtFldLabel: 'Repeat Password'
		};
		new $n2.mdc.MDCTextField(addUserConfirmPassFldOpts);

		$userForm.append('</br>');

		new $n2.mdc.MDCButton({
			parentId: formId,
			mdcId: 'btnAddUser2',
			btnLabel: 'Proceed',
			btnRaised: true,
			onBtnClick: function(){
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
			}
		});

		$('#addUserName').focus();

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
			var $outterList = $('<ul class="n2UserList mdc-list"></ul>');
			$div.find('.userAppOutput').empty().append($outterList);

			for(var i=0,e=arr.length; i<e; ++i) {
				var doc = arr[i];

				reportUserDoc(doc, $outterList);
			};
		};

		function reportUserDoc(userDoc, $outterList) {
			if( _this.userSchema && _this.showService ){
				var $listItem = $('<li class="mdc-list-item"></li>');
				$outterList.append($listItem);

				var $a = $('<a href="#" alt="'+userDoc.name+'" class="mdc-list-item__text">'+userDoc._id+'</a>');
				$listItem.append( $a ); 
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
				var $userDiv = $('<li class="n2UserListEntry mdc-list-item"></li>')
					.appendTo($outterList);
				
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
	
	,atlasDb: null
	
	,showService: null
	
	,userService: null
	
	,divId: null
	
	,token: null
	
	,userAgreementDoc: null
	
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
		this.atlasDb = config.atlasDb;
		
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
		
		// Obtain user agreement
		if( this.atlasDb ){
			this.atlasDb.getDocument({
				docId: 'org.nunaliit.user_agreement'
				,onSuccess: function(doc){
					if( doc 
					 && doc.nunaliit_user_agreement 
					 && doc.nunaliit_user_agreement.content ) {
						_this.userAgreementDoc = doc;
						_this._refreshUserAgreement();
					};
				}
			});
		};
		
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
			.addClass('displayName')
			.appendTo($form);
		$('<div>')
			.addClass('label')
			.text( _loc('Display Name') )
			.appendTo($line);
		$('<div class="value"><input class="displayNameInput" type="text"/></div>')
			.appendTo($line);

		// Password section
		var $passwordSection = $('<div>')
			.addClass('passwordSection')
			.appendTo($form);

		// Choose my own password
		var $line = $('<div>')
			.addClass('line')
			.addClass('chooseOwnPassword')
			.appendTo($form);
		var elemId = $n2.getUniqueId();
		$('<label>')
			.attr('for',elemId)
			.text( _loc('I want to choose my own password') )
			.appendTo($line);
		$('<input class="choosePassword" type="checkbox"/>')
			.attr('id',elemId)
			.appendTo($line)
			.change(function(){
				var $display = _this._getDiv();
				var $choose = $display.find('.choosePassword');
				var chooseMyOwn = $choose.is(':checked');
				if( chooseMyOwn ) {
					displayChoosePassword();
				} else {
					displayGeneratedPassword();
				};
			});
		
		// Show password
		var $line = $('<div>')
			.addClass('line')
			.addClass('showOwnPassword')
			.appendTo($form);
		var elemId = $n2.getUniqueId();
		$('<label>')
			.attr('for',elemId)
			.text( _loc('Show my password') )
			.appendTo($line);
		$('<input class="showPassword" type="checkbox"/>')
			.attr('id',elemId)
			.appendTo($line)
			.change(function(){
				var $display = _this._getDiv();
				var $show = $display.find('.showPassword');
				var showPw = $show.is(':checked');
				if( showPw ) {
					showOwnPassword(true);
				} else {
					showOwnPassword(false);
				};
			});
		

		// E-mail Password
		var $line = $('<div>')
			.addClass('line')
			.addClass('emailPassword')
			.appendTo($form);
		var elemId = $n2.getUniqueId();
		$('<label>')
			.attr('for',elemId)
			.text( _loc('E-mail me my password') )
			.appendTo($line);
		$('<input class="emailPassword" type="checkbox"/>')
			.attr('id',elemId)
			.appendTo($line);
		
		// User Agreement
		var $line = $('<div>')
			.addClass('user_agreement')
			.appendTo($form);
		
		$('<button>')
			.addClass('createUser')
			.appendTo($form)
			.text( _loc('Create User') )
			.click(function(){
				var $display = _this._getDiv();
				var displayName = $display.find('.displayNameInput').val();
				var password1 = $display.find('.password1').val();
				var password2 = $display.find('.password2').val();
				var password3 = $display.find('.password3').val();
				var sendEmailPasswordReminder = $display.find('.emailPassword').is(':checked');
				
				var userAgreement = null;
				var $userAgreementCheckbox = $display.find('.user_agreement_accept');
				if( $userAgreementCheckbox.length > 0 ){
					if( !$userAgreementCheckbox.is(':checked') ){
						alert( _loc('You must agree to the User Agreement before creating a user.') );
						return;
					};
					userAgreement = _this._getUserAgreementContent();
				};
				
				if( displayName ){
					displayName = displayName.trim();
				};

				var password = null;
				var chooseMyOwn = $display.find('.choosePassword').is(':checked');
				if( chooseMyOwn ) {
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
					
					password = password1;
					
				} else {
					if( password3 ){
						password3 = password3.trim();
					};
					password = password3;
				};
				
				if( !displayName ){
					alert( _loc('You must provide a display name') );
					return;
				};
				
				_this._createUser(displayName, password, sendEmailPasswordReminder, userAgreement);
			});

		displayGeneratedPassword();
		this._refreshUserAgreement();

		function displayGeneratedPassword(){
			var $display = _this._getDiv();
			var $passwordSection = $display.find('.passwordSection');
			$passwordSection.empty();
			$display.find('.tokenCreationForm')
				.addClass('display_generated_password')
				.removeClass('display_own_password');

			_this.userService.generatePassword({
				onSuccess: function(password){
					$passwordSection.empty();

					// Password
					var $line = $('<div>')
						.addClass('line')
						.addClass('passwordEntry')
						.appendTo($passwordSection);
					$('<div>')
						.addClass('label')
						.text( _loc('Password') )
						.appendTo($line);
					var $value = $('<div>')
						.addClass('value')
						.appendTo($line);
					$('<input class="password3" type="text"/>')
						.val(password)
						.attr('readonly',true)
						.appendTo($value);

					// Change Password
					var $line = $('<div>')
						.addClass('line')
						.addClass('changePassword')
						.appendTo($passwordSection);
					$('<div>')
						.addClass('label')
						.appendTo($line);
					var $value = $('<div>')
						.addClass('value')
						.appendTo($line);
					$('<button>')
						.text( _loc('Get a different password') )
						.appendTo($value)
						.click(function(){
							displayGeneratedPassword();
							return false;
						});
				}
			});
		};

		function displayChoosePassword(){
			var $display = _this._getDiv();
			var $passwordSection = $display.find('.passwordSection');
			$passwordSection.empty();
			$display.find('.tokenCreationForm')
				.removeClass('display_generated_password')
				.addClass('display_own_password');

			// Password
			var $line = $('<div>')
				.addClass('line')
				.addClass('passwordEntry')
				.appendTo($passwordSection);
			$('<div>')
				.addClass('label')
				.text( _loc('Password') )
				.appendTo($line);
			$('<div class="value"><input class="password1" type="password"/></div>')
				.appendTo($line);

			// Verify Password
			var $line = $('<div>')
				.addClass('line')
				.addClass('passwordEntry')
				.appendTo($passwordSection);
			$('<div>')
				.addClass('label')
				.text( _loc('Verify Password') )
				.appendTo($line);
			$('<div class="value"><input class="password2" type="password"/></div>')
				.appendTo($line);
		};

		function showOwnPassword(flag){
			var $display = _this._getDiv();
			var $passwordSection = $display.find('.passwordSection');

			// Password 1
			var $input1 = $passwordSection.find('.password1');
			var val1 = $input1.val();
			var $replace1 = null;
			if( flag ){
				$replace1 = $('<input type="text" class="password1">');
			} else {
				$replace1 = $('<input type="password" class="password1">');
			};
			$replace1.val(val1);
			$input1
				.before($replace1)
				.remove();

			// Password 2
			var $input2 = $passwordSection.find('.password2');
			var val2 = $input2.val();
			var $replace2 = null;
			if( flag ){
				$replace2 = $('<input type="text" class="password2">');
			} else {
				$replace2 = $('<input type="password" class="password2">');
			};
			$replace2.val(val2);
			$input2
				.before($replace2)
				.remove();
		};
	}
	
	,_isUserAgreementEnabled: function(){
		var enabled = false;

		if( this.userAgreementDoc
		 && this.userAgreementDoc.nunaliit_user_agreement
	     && this.userAgreementDoc.nunaliit_user_agreement.enabled ){
			enabled = true;
		};
		
		return enabled;
	}
	
	,_getUserAgreementContent: function(){
		var agreementContent = null;
		if( this.userAgreementDoc
		 && this.userAgreementDoc.nunaliit_user_agreement
	     && this.userAgreementDoc.nunaliit_user_agreement.content
	     && this.userAgreementDoc.nunaliit_user_agreement.enabled ){
			agreementContent = this.userAgreementDoc.nunaliit_user_agreement.content;
		};
		
		if( null !== agreementContent 
		 && typeof agreementContent === 'object' 
		 && agreementContent.nunaliit_type === 'localized' ){
			agreementContent = _loc(agreementContent);
		};
		
		return agreementContent;
	}
	
	,_refreshUserAgreement: function(){
		var $display = this._getDiv();
		var $agreementSection = $display.find('.user_agreement')
			.empty();
		
		var agreementContent = this._getUserAgreementContent();
		if( agreementContent ){
			$('<div>')
				.addClass('user_agreement_label')
				.text( _loc('User Agreement') )
				.appendTo($agreementSection);

			$('<textarea>')
				.addClass('user_agreement_content')
				.val( agreementContent )
				.attr('readonly','readonly')
				.appendTo($agreementSection);

			var $buttons = $('<div>')
				.addClass('user_agreement_buttons')
				.appendTo($agreementSection);

			var elemId = $n2.getUniqueId();
			$('<label>')
				.attr('for',elemId)
				.text( _loc('Accept User Agreement') )
				.appendTo($buttons);
			$('<input class="user_agreement_accept" type="checkbox"/>')
				.attr('id',elemId)
				.appendTo($buttons);
		};
	}
	
	,_createUser: function(displayName, password, sendEmailPasswordReminder, userAgreement){

		var _this = this;
		
		userAgreement = userAgreement ? userAgreement : '';
		
		this.userService.completeUserCreation({
			token: this.token
			,displayName: displayName
			,password: password
			,sendEmailPasswordReminder: sendEmailPasswordReminder
			,userAgreement: userAgreement
			,onSuccess: function(result){
				$n2.log('user created',result);
				var emailAdress = result.emailAddress;
				_this._userCreated(emailAdress,password);
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
	
	,_userCreated: function(emailAdress,password){
		var $display = this._getDiv();
		$display.empty();

		$('<div>')
			.addClass('userCreationSuccess')
			.text( _loc('User created successfully.') )
			.appendTo($display);

		var text = _loc('Click here to return to main site: ');
		var link = _loc('main site');
		var $redirect = $('<div>')
			.addClass('userCreationRedirect')
			.text(text)
			.appendTo($display);
		
		$('<a>')
			.attr('href','../index.html')
			.text(link)
			.appendTo($redirect);
		
		// Log in user
		if( this.authService ){
			this.authService.login({
				username: emailAdress
				,password: password
				,onSuccess: redirectToMainSite
				,onError: redirectToMainSite
			});
		};
		
		function redirectToMainSite(){
			var nextUrl = null;
			
			var currentUrl = window.location.href;
			if( currentUrl ){
				var toolsIndex = currentUrl.indexOf('/tools/');
				if( toolsIndex > 0 ){
					nextUrl = currentUrl.substr(0,toolsIndex) + '/index.html';
				};
			};
			
			if( nextUrl ){
				window.location.href = nextUrl;
			};
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

		// Password section
		var $passwordSection = $('<div>')
			.addClass('passwordSection')
			.appendTo($form);

		// Choose my own password
		var $line = $('<div>')
			.addClass('line')
			.addClass('chooseOwnPassword')
			.appendTo($form);
		$('<div>')
			.addClass('label')
			.text( _loc('I want to choose my own password') )
			.appendTo($line);
		$('<div class="value"><input class="choosePassword" type="checkbox"/></div>')
			.appendTo($line)
			.change(function(){
				var $display = _this._getDiv();
				var $choose = $display.find('.choosePassword');
				var chooseMyOwn = $choose.is(':checked');
				if( chooseMyOwn ) {
					displayChoosePassword();
				} else {
					displayGeneratedPassword();
				};
			});

		// E-mail Password
		var $line = $('<div>')
			.addClass('line')
			.addClass('emailPassword')
			.appendTo($form);
		$('<div>')
			.addClass('label')
			.text( _loc('E-mail me my password') )
			.appendTo($line);
		$('<div class="value"><input class="emailPassword" type="checkbox"/></div>')
			.appendTo($line);
		
		$('<button>')
			.addClass('createUser')
			.appendTo($form)
			.text( _loc('Set Password') )
			.click(function(){
				var $display = _this._getDiv();
				var password1 = $display.find('.password1').val();
				var password2 = $display.find('.password2').val();
				var password3 = $display.find('.password3').val();
				var sendEmailPasswordReminder = $display.find('.emailPassword').is(':checked');

				var password = null;
				var chooseMyOwn = $display.find('.choosePassword').is(':checked');
				if( chooseMyOwn ) {
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
					
					password = password1;
					
				} else {
					if( password3 ){
						password3 = password3.trim();
					};
					password = password3;
				};

				_this._recoverPassword(password, sendEmailPasswordReminder);
			});

		displayGeneratedPassword();

		function displayGeneratedPassword(){
			var $display = _this._getDiv();
			var $passwordSection = $display.find('.passwordSection');
			$passwordSection.empty();

			_this.userService.generatePassword({
				onSuccess: function(password){
					$passwordSection.empty();

					// Password
					var $line = $('<div>')
						.addClass('line')
						.addClass('passwordEntry')
						.appendTo($passwordSection);
					$('<div>')
						.addClass('label')
						.text( _loc('Password') )
						.appendTo($line);
					var $value = $('<div>')
						.addClass('value')
						.appendTo($line);
					$('<input class="password3" type="text"/>')
						.val(password)
						.attr('readonly',true)
						.appendTo($value);

					// Change Password
					var $line = $('<div>')
						.addClass('line')
						.addClass('changePassword')
						.appendTo($passwordSection);
					$('<div>')
						.addClass('label')
						.appendTo($line);
					var $value = $('<div>')
						.addClass('value')
						.appendTo($line);
					$('<button>')
						.text( _loc('Get a different password') )
						.appendTo($value)
						.click(function(){
							displayGeneratedPassword();
							return false;
						});
				}
			});
		};

		function displayChoosePassword(){
			var $display = _this._getDiv();
			var $passwordSection = $display.find('.passwordSection');
			$passwordSection.empty();

			// Password
			var $line = $('<div>')
				.addClass('line')
				.addClass('passwordEntry')
				.appendTo($passwordSection);
			$('<div>')
				.addClass('label')
				.text( _loc('Password') )
				.appendTo($line);
			$('<div class="value"><input class="password1" type="password"/></div>')
				.appendTo($line);

			// Verify Password
			var $line = $('<div>')
				.addClass('line')
				.addClass('passwordEntry')
				.appendTo($passwordSection);
			$('<div>')
				.addClass('label')
				.text( _loc('Verify Password') )
				.appendTo($line);
			$('<div class="value"><input class="password2" type="password"/></div>')
				.appendTo($line);
		};
	}
	
	,_recoverPassword: function(password, sendEmailPasswordReminder){

		var _this = this;
		
		this.userService.completePasswordRecovery({
			token: this.token
			,password: password
			,sendEmailPasswordReminder: sendEmailPasswordReminder
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
