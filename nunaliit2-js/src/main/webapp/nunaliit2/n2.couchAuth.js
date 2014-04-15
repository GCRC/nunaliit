/*
Copyright (c) 2010, Geomatics and Cartographic Research Centre, Carleton 
University
All rights reserved.

Redistribution and use in source and binary forms, with or without 
modification, are permitted provided that the following conditions are met:

 - Redistributions of source code must retain the above copyright notice, 
   this list of conditions and the following disclaimer.
 - Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.
 - Neither the name of the Geomatics and Cartographic Research Centre, 
   Carleton University nor the names of its contributors may be used to 
   endorse or promote products derived from this software without specific 
   prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE 
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE 
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE 
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF 
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS 
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN 
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) 
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE 
POSSIBILITY OF SUCH DAMAGE.

$Id: n2.couchAuth.js 8445 2012-08-22 19:11:38Z jpfiset $
*/

// @ requires n2.utils.js
// @ requires n2.form.js
// @ requires n2.couch.js

;(function($,$n2){

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };

var DH = 'n2.couchAuth';

// ===================================================================================

var defaultError = function(err, options) {
	var acc = [];
	
	if( err ) {
		acc.push(''+err.message);
		var cause = err.cause;
		while( cause ) {
			acc.push('\n>'+cause.message);
			cause = cause.cause;
		};
	} else {
		acc.push( _loc('<Unknown error>') );
	};
	
	alert(acc.join(''));
};

var AuthService = $n2.Class({
	options: null

	,loginStateListeners: null
	
	,lastAuthSessionCookie: null
	
	,autoRegistrationAvailable: null
	
	,initialize: function(options_){
		var _this = this;
		
		this.options = $n2.extend(
			{
				onSuccess: function(result,options) {}
				,onError: defaultError
				,atlasDb: null
				,anonymousLoginAllowed: false
				,anonymousUser: 'anonymous'
				,anonymousPw: 'anonymous'
				,autoAnonymousLogin: false
				,disableCreateUserButton: false
				,directory: null
				,listeners: null
				,autoRefresh: true
				,prompt: _loc('Please login')
				,refreshIntervalInSec: 120 // 2 minutes
				,userServerUrl: null
			}
			,options_
		);
		
		if( ! $n2.couchAuth._defaultAuthService ){
			$n2.couchAuth._defaultAuthService = this;
		};
		
		this.loginStateListeners = [];
		this.lastAuthSessionCookie = null;
		this.autoRegistrationAvailable = false;
		
		// Install login state listeners - don't retain as stored options.
		if( this.options.listeners ) {
			this.addListeners(this.options.listeners);
			delete this.options.listeners;
		};
		
		/*
		 * carry either default or provided fns for onSuccess or onError
		 * and remove these from the stored options ... they are usually
		 * not appropriate for use as login and logout callbacks.
		 */
		var initOnSuccess = this.options.onSuccess;
		delete this.options.onSuccess;
		var initOnError = this.options.onError;
		delete this.options.onError;
		
		var optWithCallbacks = $n2.extend({}, // use this as init callback
			this.options,
			{
				onSuccess: initOnSuccess
				,onError: initOnError
			}
		);

		$n2.couch.getSession().refreshContext({
			onSuccess: onSuccess
			,onError: onError
		});		

		$n2.couch.getSession().addChangedContextListener(function(){
			_this.notifyListeners();
			_this._updateUserWithLoggedIn();
		});
		
		if( this.options.autoRefresh
		 && this.options.refreshIntervalInSec > 0
		 && typeof(setInterval) === 'function' ) {
			setInterval(
				function(){
					$n2.couch.getSession().refreshContext({
						onError: function(){} // ignore
					});
				}
				,(1000 * this.options.refreshIntervalInSec) // expressed in ms
			);

			setInterval(
				function(){
					var cookie = $n2.cookie.getCookie('NunaliitAuth');
					if( cookie !== _this.lastAuthSessionCookie ) {
						_this.lastAuthSessionCookie = cookie;
						$n2.couch.getSession().refreshContext({
							onError: function(){} // ignore
						});
					};
				}
				,2000 // 2 seconds
			);
		};
		
		// Listen to events
		var dispatcher = this._getDispatcher();
		if( dispatcher ){
			var fn = function(m){
				_this._handleEvent(m);
			};
			dispatcher.register(DH,'login',fn);
			dispatcher.register(DH,'loginShowForm',fn);
			dispatcher.register(DH,'logout',fn);
		};
		
		// Detect if auto registration is available
		if( this.options.userServerUrl ){
			var url = this.options.userServerUrl;
			
			$.ajax({
		    	url: url
		    	,type: 'GET'
		    	,async: true
		    	,traditional: true
		    	,data: null
		    	,dataType: 'json'
		    	,success: function(result) {
		    		if( result.autoRegistration ) {
		    			_this.autoRegistrationAvailable = true;
		    		};
		    	}
		    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
		    		// Ignore
		    	}
			});
		};

		function onSuccess(context) {
			$n2.log("Login(adjustCookies) successful", context, _this.options);
			if( !context.name && _this.options.autoAnonymousLogin ) {
				/*
				 * auto login will do notifications when appropriate so it is alright
				 * to skip notifyListeners() in this case.
				 */
				_this._userLogin(optWithCallbacks, true);
			} else {
				initOnSuccess(context, optWithCallbacks);
				_this.notifyListeners();
			};
		};
		
		function onError(error) {
			$n2.log('Login(adjustCookies) error: '+error);
			
			if (_this.options.autoAnonymousLogin) { // auto login will do notifications when appropriate
				_this._userLogin(optWithCallbacks, true);
			} else {
				var err = {
					message: 'Problem initializing authentication library'
					,cause: {
						message: error
					}
				};
				initOnError(err, optWithCallbacks);
				_this.notifyListeners();
			};
		};
	}

	,addListeners: function(listeners) {
		var _this = this;
		var cUser = this.getCurrentUser();
		
		if( typeof(listeners) == 'function' ) {
			addListener(listeners);
			
		} else if( $n2.isArray(listeners) ) {
			for(var loop=0; loop<listeners.length; ++loop) {
				var listener = listeners[loop];
				if( typeof(listener) === 'function' ) {
					addListener(listener);
				};
			};
		};
		
		function addListener(listener) {
			_this.loginStateListeners.push(listener);
			try {
				listener(cUser);
			} catch(e) {
				$n2.log('CouchAuthService: EXCEPTION caught in listener (add): '+e);
			};
		};
	}
	
	,notifyListeners: function() {
		var user = this.getCurrentUser();
		
		// Notify other instances of atlas in browser
		var userName = null;
		if( user ) {
			userName = user.name;
		};
		$n2.cookie.setCookie({
			name: 'NunaliitAuth'
			,value: userName
			,path: '/'
		});
		
		// Notify via dispatcher
		if( user ){
			this._dispatch({
				type: 'authLoggedIn'
				,user: user
			});
		} else {
			this._dispatch({
				type: 'authLoggedOut'
			});
		};
		
		for(var loop=0; loop<this.loginStateListeners.length; ++loop) {
			var listener = this.loginStateListeners[loop];
			if( listener ) {
				try {
					listener(user);
				} catch(e) {
					$n2.log('CouchAuthService: EXCEPTION caught in listener (notify): '+e);
				};
			};
		};
	}
	
	,login: function(opts_) {
		var opts = $n2.extend({
			username: null
			,password: null
			,onSuccess: function(context){}
			,onError: function(errMsg){}
		},opts_);

		var _this = this;
		var username = opts.username;
		var password = opts.password;
		
		if( typeof(username) !== 'string'
		 || typeof(password) !== 'string' ){
			opts.onError('Name and password must be provided when logging in');
			return;
		};

		if( this.autoRegistrationAvailable ){
			var url = this.options.userServerUrl + 'getUser';
			
			$.ajax({
		    	url: url
		    	,type: 'GET'
		    	,async: true
		    	,traditional: true
		    	,data: {
		    		email: username
		    	}
		    	,dataType: 'json'
		    	,success: function(userDoc) {
		    		if( userDoc.name ) {
		    			username = userDoc.name;
		    		};
					doLogin();
		    	}
		    	,error: doLogin
			});
		} else {
			doLogin();
		};
		
		function doLogin() {
			$n2.couch.getSession().login({
				name: username
				,password: password
				,onSuccess: checkUserAgreement
				,onError: function(err){
					$n2.log('Unable to log in: '+err);
					onError( _loc('Invalid e-mail and/or password') );
				}
			});
		};
		
		function checkUserAgreement(sessionResult){
			$n2.couch.getUserDb().getUser({
				name: username
				,onSuccess: function(userDoc){
					// If the user agreement was acepted, the user
					// servlet add a role to the user which is
					// "nunaliit_agreement_" + name-of-atlas
					var atlasName = 'atlas';
					if( typeof n2atlas === 'object' 
					 && n2atlas.name ){
						atlasName = n2atlas.name;
					};
					var agreementRole = 'nunaliit_agreement_'+atlasName;
					if( userDoc
					 && userDoc.roles ){
						for(var i=0,e=userDoc.roles.length; i<e; ++i){
							var role = userDoc.roles[i];
							if( role === agreementRole ){
								onSuccess(sessionResult);
								return;
							};
						};
					};
					
					// At this point, a new user agreement must be accepted
					proposeNewUserAgreement(sessionResult);
				}
				,onError: function(err){
					var isAdmin = false;
					if( sessionResult && sessionResult.roles ){
						for(var i=0,e=sessionResult.roles.length; i<e; ++i){
							var role = sessionResult.roles[i];
							if( '_admin' === role ){
								isAdmin = true;
								break;
							};
						};
					};
					
					if( isAdmin ){
						onSuccess(sessionResult);
					} else {
						$n2.log('Unable to obtain user information: '+err);
						onError( _loc('Unable to obtain information about user') );
					};
				}
			});
		};
		
		function proposeNewUserAgreement(sessionResult){
			_this.options.atlasDb.getDocument({
				docId: 'org.nunaliit.user_agreement'
				,onSuccess: function(doc){
					if( doc 
					 && doc.nunaliit_user_agreement 
					 && doc.nunaliit_user_agreement.content
					 && doc.nunaliit_user_agreement.enabled ){
						
						var agreementContent = doc.nunaliit_user_agreement.content;
						if( typeof doc.nunaliit_user_agreement.content === 'object'
						 && doc.nunaliit_user_agreement.content.nunaliit_type === 'localized' ){
							agreementContent = _loc(doc.nunaliit_user_agreement.content);
						};
						
						var accepted = false;
						
						var diagId = $n2.getUniqueId();
						var $diag = $('<div>')
							.attr('id',diagId);
						
						var $content = $('<div>')
							.addClass('n2Auth_user_agreement_dialog')
							.appendTo($diag);
						
						$('<div>')
							.addClass('n2Auth_user_agreement_label')
							.text( _loc('User agreement has changed. You must accept before you can authenticate with atlas.') )
							.appendTo($content);
						
						$('<textarea>')
							.addClass('n2Auth_user_agreement_content')
							.val( agreementContent )
							.appendTo($content);

						var $buttons = $('<div>')
							.addClass('n2Auth_user_agreement_buttons')
							.appendTo($content);
						
						$('<button>')
							.addClass('n2_button_ok')
							.text( _loc('Accept') )
							.click(function(){
								accepted = true;
								var $diag = $('#'+diagId);
								$diag.dialog('close');
								acceptUserAgreement(agreementContent, sessionResult);
							})
							.appendTo($buttons);
						
						$('<button>')
							.addClass('n2_button_cancel')
							.text( _loc('Reject') )
							.click(function(){
								var $diag = $('#'+diagId);
								$diag.dialog('close');
							})
							.appendTo($buttons);
					
						$diag.dialog({
							autoOpen: true
							,title: _loc('User Agreement and Terms of Service')
							,modal: true
							,width: 'auto'
							,close: function(event, ui){
								var $diag = $('#'+diagId);
								$diag.remove();
								if( !accepted ){
									onError( _loc('User refused agreement') );
								};
							}
						});
					} else {
						// If the user agreement is not enabled, accept anything and
						// the service will enable the role
						acceptUserAgreement('', sessionResult);
					};
				}
				,onError: function(err){
					$n2.log('Error getting user agreement: '+err);
					onError( _loc('Unable to obtain user agreement') );
				}
			});
		};
		
		function acceptUserAgreement(userAgreement, sessionResult){
			var url = _this.options.userServerUrl + 'acceptUserAgreement';
			
			$.ajax({
		    	url: url
		    	,type: 'POST'
		    	,async: true
		    	,traditional: true
		    	,data: {
		    		userAgreement: userAgreement
		    	}
		    	,dataType: 'json'
		    	,success: function() {
		    		onSuccess(sessionResult);
		    	}
		    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
					onError( _loc('Error attempting to accept user agreement') );
				}	
			});
		};
		
		function onSuccess(result) {

			var context = $n2.couch.getSession().getContext();

			$n2.log('Login successful',context,opts);
			
			if( context && context.name ) {
				opts.onSuccess(context);
				_this.notifyListeners();

			} else {
				doErrorNotification();
			};
		};
		
		function onError(err) {
			$n2.couch.getSession().logout({
				onError: function(){}
			});			
			$n2.log('Login error', err);
			doErrorNotification(err);
		};

		function doErrorNotification(err) {
			if( err ) {
				opts.onError( err );
			} else {
				opts.onError( _loc('Invalid e-mail and/or password') );
			};
			_this.notifyListeners();
		};
	}
	
	,_userLogin: function(options, anonymousFlag, username, password) {
		var loginRetries = 0
			,loginRetryLimit = 3
			,_this = this;
		
		function doLogin() {
			$n2.couch.getSession().login({
				name: username
				,password: password
				,onSuccess: onSuccess
				,onError: onError
			});
		};
		
		/*
		 * @return: true => login retry initiated.
		 */
		function retryLogin() {
			++loginRetries;
			if (loginRetries <= loginRetryLimit) {
				doLogin();
				return(true);
			};
			return(false);
		};
		
		function clearLoginForm() {
			if (!options.autoAnonymousLogin || !anonymousFlag) { // hide user-visible form...
				options.dialog.dialog('close');
			};
		};
		
		function doErrorNotification(causeObj) {
			if (options.autoAnonymousLogin && anonymousFlag) {
				/*
				 * if autoAnonymousLogin in process, attempt to suppress error notification
				 * and retry the login.  If limit reached, notification is sent.
				 */
				var retrying = retryLogin();
				if (retrying) {
					return;
				};
			};
				
			var err = {
				message: _loc('Invalid e-mail and/or password')
			};

			clearLoginForm();
			options.onError(err,options);
			_this.notifyListeners();
		};
		
		function onSuccess(result) {

			var context = $n2.couch.getSession().getContext();

			$n2.log('Login successful',context,options);
			
			if( context && context.name ) {
			
				clearLoginForm();
				options.onSuccess(context,options);
				_this.notifyListeners();

			} else {
				doErrorNotification(null);
			};
		};
		
		function onError(err) {
			$n2.log('User login error', err);
			doErrorNotification({ message: err });
		};
		
		if( anonymousFlag ) {
			username = options.anonymousUser;
			password = options.anonymousPw;
		};
		doLogin();
	}
	
	,autoAnonLogin: function(options_) {
		var options = $n2.extend({}, this.options, options_);
		this._userLogin(options, true);
	}
	
	,_fillDialogWithLogin: function(dialogId, opts_){
		var opts = $n2.extend({
			prompt: null
			,userName: null
			,onSuccess: function(context){}
			,onError: function(err){}
		},opts_);
		
		var _this = this;
		var $dialog = $('#'+dialogId);
		
		var $authDiag = $('<div class="n2Auth_login"></div>');
		
		var $authForm = $('<form></form>')
			.appendTo($authDiag);

		// User Line
		var $userLine = $('<div class="n2Auth_login_user_line"></div>')
			.appendTo($authForm);
		
		var nameLabel = _loc('user name');
		if( this.autoRegistrationAvailable ){
			nameLabel = _loc('e-mail address');
		};
		var nameValue = '';
		if( opts.userName ){
			nameValue = opts.userName;
		};
		$('<div class="n2Auth_login_label"></div>')
			.text(nameLabel)
			.appendTo($userLine);
		
		var $labelDiv = $('<div class="n2Auth_login_input"></div>')
			.appendTo($userLine);

		$('<input class="n2Auth_user_input n2Auth_input_field" type="text" name="username"/>')
			.val(nameValue)
			.appendTo($labelDiv);
		
		$('<div class="n2Auth_login_end"></div>')
			.appendTo($userLine);
		
		// Password line
		var $pwLine = $('<div class="n2Auth_login_pw_line"></div>')
			.appendTo($authForm);
		
		$('<div class="n2Auth_login_label"></div>')
			.text(_loc('password'))
			.appendTo($pwLine);

		$('<div class="n2Auth_login_input"><input class="n2Auth_pw_input n2Auth_input_field" type="password" name="password"/></div>')
			.appendTo($pwLine);

		$('<div class="n2Auth_login_end"></div>')
			.appendTo($pwLine);

		// Button line
		var $buttonLine = $('<div class="n2Auth_login_button_line"></div>')
			.appendTo($authForm);

		$('<input type="submit" class="n2Auth_button_login"></input>')
			.appendTo($buttonLine)
			.val( _loc('Login') )
			.click(function(){
				performLogin();
				return false;
			});
		
		$('<input type="button" class="n2Auth_button_cancel"></input>')
			.appendTo($buttonLine)
			.val( _loc('Cancel') )
			.click(function(){
				var $dialog = $('#'+dialogId);
				$dialog.dialog('close');
			});
			
		$('<div class="n2Auth_login_end"></div>')
			.appendTo($buttonLine);

		// Create user line
		if( ! this._shouldDisableCreateUserButton() ) {
			var $createLine = $('<div class="n2Auth_login_create_line"></div>')
				.appendTo($authDiag);
	
			$('<a class="n2Auth_button_createUser" href="#"></a>')
				.appendTo($createLine)
				.text( _loc('Create a new user') )
				.click(function(){
					var $dialog = $('#'+dialogId);
					var userName = $dialog.find('.n2Auth_user_input').val();
					opts.userName = userName;
					_this._fillDialogWithUserCreation(dialogId, opts);
					return false;
				});
			
			$('<div class="n2Auth_login_end"></div>')
				.appendTo($createLine);
		};

		// Recover password line
		if( this.autoRegistrationAvailable ){
			var $recoverLine = $('<div class="n2Auth_login_recover_line"></div>')
				.appendTo($authDiag);
	
			$('<a class="n2Auth_button_recoverPassword" href="#"></a>')
				.appendTo($recoverLine)
				.text( _loc('I have forgotten my password') )
				.click(function(){
					var $dialog = $('#'+dialogId);
					var userName = $dialog.find('.n2Auth_user_input').val();
					opts.userName = userName;
					_this._fillDialogWithPasswordRecovery(dialogId, opts);
					return false;
				});
			
			$('<div class="n2Auth_login_end"></div>')
				.appendTo($recoverLine);
		};

		
		// Populate current dialog div
		$dialog.empty().append($authDiag);
		
		// Capture enter key (not needed since enter key triggers submit in a
		// form)
//		$dialog.find('.n2Auth_input_field').keydown(function(e){
//			var charCode = null;
//			if( null === e ) {
//				e = window.event; // IE
//			};
//			if( null !== e ) {
//				if( e.keyCode ) {
//					charCode = e.keyCode;
//				};
//			};
//			
//			if( 13 === charCode ) {
//				performLogin();
//			};
//		});
		
		// Adjust dialog title
		if( opts.prompt ) {
			$dialog.dialog('option','title',opts.prompt);
		} else {
			$dialog.dialog('option','title',_loc('Please login'));
		};
		
		function performLogin(){
			var $dialog = $('#'+dialogId);
			var user = $dialog.find('.n2Auth_user_input').val();
			var password = $dialog.find('.n2Auth_pw_input').val();
			_this.login({
				username: user
				,password: password
				,onSuccess: opts.onSuccess
				,onError: opts.onError
			});
		};
	}
	
	,_fillDialogWithUserCreation: function(dialogId, opts_){
		if( this.autoRegistrationAvailable ){
			this._fillDialogWithUserAutoRegistration(dialogId, opts_);
			return;
		};
		
		var opts = $n2.extend({
			prompt: null
			,userName: null
			,onSuccess: function(context){}
			,onError: function(err){}
		},opts_);
		
		var _this = this;
		var $dialog = $('#'+dialogId);
		
		$dialog.html( ['<div class="n2Auth_create">'
			,'<div class="n2Auth_create_user_line">'
			,'<div class="n2Auth_create_label"></div>'
			,'<div class="n2Auth_create_input"><input class="n2Auth_user_input n2Auth_input_field" type="text"/></div>'
			,'<div class="n2Auth_create_end"></div>'
			,'</div>'
			,'<div class="n2Auth_create_display_line">'
			,'<div class="n2Auth_create_label"></div>'
			,'<div class="n2Auth_create_input"><input class="n2Auth_display_input n2Auth_input_field" type="text"/></div>'
			,'<div class="n2Auth_create_end"></div>'
			,'</div>'
			,'<div class="n2Auth_create_pw_line">'
			,'<div class="n2Auth_create_label"></div>'
			,'<div class="n2Auth_create_input"><input class="n2Auth_pw_input n2Auth_input_field" type="password"/></div>'
			,'<div class="n2Auth_create_end"></div>'
			,'</div>'
			,'<div class="n2Auth_create_pw2_line">'
			,'<div class="n2Auth_create_label"></div>'
			,'<div class="n2Auth_create_input"><input class="n2Auth_pw_input2 n2Auth_input_field" type="password"/></div>'
			,'<div class="n2Auth_create_end"></div>'
			,'</div>'
			,'<div class="n2Auth_create_button_line">'
			,'<button class="n2Auth_button_create"></button>'
			,'<button class="n2Auth_button_cancel"></button>'
			,'</div>'
			,'</div>'].join('') );
		
		$dialog.find('.n2Auth_create_user_line .n2Auth_create_label').text( _loc('user name') );
		$dialog.find('.n2Auth_create_display_line .n2Auth_create_label').text( _loc('display name') );
		$dialog.find('.n2Auth_create_pw_line .n2Auth_create_label').text( _loc('password') );
		$dialog.find('.n2Auth_create_pw2_line .n2Auth_create_label').text( _loc('confirm password') );
		
		if( opts.userName ){
			$dialog.find('.n2Auth_user_input').val( opts.userName );
		};
		
		$dialog.find('.n2Auth_button_create')
			.text( _loc('Create User') )
			.button({icons:{primary:'ui-icon-check'}})
			.click(function(){
				performUserCreation();
				return false;
			});
		$dialog.find('.n2Auth_button_cancel')
			.text( _loc('Cancel') )
			.button({icons:{primary:'ui-icon-cancel'}})
			.click(function(){
				var $dialog = $('#'+dialogId);
				var userName = $dialog.find('.n2Auth_user_input').val();
				opts.userName = userName;
				_this._fillDialogWithLogin(dialogId, opts);
				return false;
			});
		$dialog.find('.n2Auth_input_field').keydown(function(e){
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
				performUserCreation();
			};
		});
		
		$dialog.dialog('option','title',_loc('User Creation'));
		
		function performUserCreation(){
			var $dialog = $('#'+dialogId);

			var user = $dialog.find('.n2Auth_user_input').val();
			var display = $dialog.find('.n2Auth_display_input').val();
			var password = $dialog.find('.n2Auth_pw_input').val();
			var password2 = $dialog.find('.n2Auth_pw_input2').val();
			
			if( null == user || user.length < 3 ) {
				alert( _loc('User name should have at least 3 characters') );
				return false;
			};

			if( password != password2 ) {
				alert( _loc('The two passwords should match') );
				return false;
			};
			
			if( null == password 
			 || password.length < 6 ) {
				alert( _loc('Password should have at least 6 characters') );
				return false;
			};
			
			if( null == display || display.length < 1 ) {
				display = user;
			};
			
			$n2.couch.getUserDb().createUser({
				name: user
				,password: password
				,display: display
				,onSuccess: function() { 
					_this.login({
						username: user
						,password: password
						,onSuccess: opts.onSuccess
						,onError: function(err){
							alert( _loc('User created but unable to log in: ')+err);
						}
					});
				}
				,onError: function(err){
					alert( _loc('Unable to create user: ')+err);
				}
			});
		};
	}
	
	,_fillDialogWithUserAutoRegistration: function(dialogId, opts_){
		var opts = $n2.extend({
			prompt: null
			,userName: null
			,onSuccess: function(context){}
			,onError: function(err){}
		},opts_);

		var _this = this;
		var $dialog = $('#'+dialogId);
		
		$dialog.empty();
		
		var $form = $('<div>')
			.addClass('n2Auth_create')
			.appendTo($dialog);
		
		// User name
		var emailValue = '';
		if( opts.userName ){
			emailValue = opts.userName;
		};
		
		// E-mail address
		var $line = $('<div>')
			.addClass('n2Auth_create_email_line')
			.appendTo($form);
		$('<div>')
			.addClass('n2Auth_create_label')
			.text( _loc('e-mail address') )
			.appendTo($line);
		var $input = $('<div>')
			.addClass('n2Auth_create_input')
			.appendTo($line);
		$('<input type="text">')
			.addClass('n2Auth_email_input n2Auth_input_field')
			.appendTo($input)
			.val(emailValue)
			.keydown(function(e){
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
					performUserRegistration();
				};
			});
		$('<div>')
			.addClass('n2Auth_create_end')
			.appendTo($line);
		
		// Buttons
		var $line = $('<div>')
			.addClass('n2Auth_create_button_line')
			.appendTo($form);
		$('<button>')
			.addClass('n2Auth_button_create')
			.text( _loc('Create User') )
			.appendTo($line)
			.button({icons:{primary:'ui-icon-check'}})
			.click(function(){
				performUserRegistration();
				return false;
			});
		$('<button>')
			.addClass('n2Auth_button_cancel')
			.text( _loc('Cancel') )
			.appendTo($line)
			.button({icons:{primary:'ui-icon-cancel'}})
			.click(function(){
				var $dialog = $('#'+dialogId);
				var email = $dialog.find('.n2Auth_email_input').val();
				opts.userName = email;
				_this._fillDialogWithLogin(dialogId, opts);
				return false;
			});

		$dialog.dialog('option','title',_loc('User Registration'));
		
		function performUserRegistration(){
			var $dialog = $('#'+dialogId);

			var email = $dialog.find('.n2Auth_email_input').val();
			
			if( email ) {
				email = $n2.trim(email);
			};
			if( !email ) {
				alert( _loc('E-Mail address must be specified') );
				return false;
			};
			
			var url = _this.options.userServerUrl + 'initUserCreation';
			
			$.ajax({
		    	url: url
		    	,type: 'GET'
		    	,async: true
		    	,traditional: true
		    	,data: {
		    		email: email
		    	}
		    	,dataType: 'json'
		    	,success: function(result) {
		    		if( result.error ) {
						alert( _loc('Unable to register user: ')+result.error);
		    		} else {
		    			reportSuccess();
		    		};
		    	}
		    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
					alert( _loc('Unable to register user: ')+textStatus);
				}	
			});
		};
		
		function reportSuccess(){
			var $dialog = $('#'+dialogId);

			$dialog.empty();
			
			var $form = $('<div>')
				.addClass('n2Auth_registered')
				.appendTo($dialog);
			
			// E-mail address
			var $line = $('<div>')
				.addClass('n2Auth_registered_line')
				.appendTo($form)
				.text( _loc('User registration initiated. Check for e-mail to complete user creation') );
			
			// Buttons
			var $line = $('<div>')
				.addClass('n2Auth_registered_button_line')
				.appendTo($form);
			$('<button>')
				.addClass('n2Auth_button_ok')
				.text( _loc('OK') )
				.appendTo($line)
				.button({icons:{primary:'ui-icon-check'}})
				.click(function(){
					opts.onSuccess();
					return false;
				});

			$dialog.dialog('option','title',_loc('Registration Initiated'));
		};
	}
	
	,_fillDialogWithPasswordRecovery: function(dialogId, opts_){
		var opts = $n2.extend({
			prompt: null
			,userName: null
			,onSuccess: function(context){}
			,onError: function(err){}
		},opts_);

		var _this = this;
		var $dialog = $('#'+dialogId);
		
		$dialog.empty();
		
		var $form = $('<div>')
			.addClass('n2Auth_recoverPassword')
			.appendTo($dialog);
		
		var userName = '';
		if( opts.userName ){
			userName = opts.userName;
		};
		
		// E-mail address
		var $line = $('<div>')
			.addClass('n2Auth_recoverPassword_email_line')
			.appendTo($form);
		$('<div>')
			.addClass('n2Auth_recoverPassword_label')
			.text( _loc('e-mail address') )
			.appendTo($line);
		var $input = $('<div>')
			.addClass('n2Auth_recoverPassword_input')
			.appendTo($line);
		$('<input type="text">')
			.addClass('n2Auth_email_input n2Auth_input_field')
			.appendTo($input)
			.val(userName)
			.keydown(function(e){
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
					performPasswordRecovery();
				};
			});
		$('<div>')
			.addClass('n2Auth_recoverPassword_end')
			.appendTo($line);
		
		// Buttons
		var $line = $('<div>')
			.addClass('n2Auth_recoverPassword_button_line')
			.appendTo($form);
		$('<button>')
			.addClass('n2Auth_button_recover')
			.text( _loc('Reset Password') )
			.appendTo($line)
			.button({icons:{primary:'ui-icon-check'}})
			.click(function(){
				performPasswordRecovery();
				return false;
			});
		$('<button>')
			.addClass('n2Auth_button_cancel')
			.text( _loc('Cancel') )
			.appendTo($line)
			.button({icons:{primary:'ui-icon-cancel'}})
			.click(function(){
				var $dialog = $('#'+dialogId);
				var email = $dialog.find('.n2Auth_email_input').val();
				opts.userName = email;
				_this._fillDialogWithLogin(dialogId, opts);
				return false;
			});

		$dialog.dialog('option','title',_loc('Recover Password'));
		
		function performPasswordRecovery(){
			var $dialog = $('#'+dialogId);

			var email = $dialog.find('.n2Auth_email_input').val();
			
			if( email ) {
				email = $n2.trim(email);
			};
			if( !email ) {
				alert( _loc('E-Mail address must be specified') );
				return false;
			};
			
			var url = _this.options.userServerUrl + 'initPasswordRecovery';
			
			$.ajax({
		    	url: url
		    	,type: 'GET'
		    	,async: true
		    	,traditional: true
		    	,data: {
		    		email: email
		    	}
		    	,dataType: 'json'
		    	,success: function(result) {
		    		if( result.error ) {
						alert( _loc('Unable to recover password: ')+result.error);
		    		} else {
		    			reportSuccess();
		    		};
		    	}
		    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
					alert( _loc('Unable to recover password: ')+textStatus);
				}	
			});
		};
		
		function reportSuccess(){
			var $dialog = $('#'+dialogId);

			$dialog.empty();
			
			var $form = $('<div>')
				.addClass('n2Auth_registered')
				.appendTo($dialog);
			
			// E-mail address
			var $line = $('<div>')
				.addClass('n2Auth_registered_line')
				.appendTo($form)
				.text( _loc('Password recovery initiated. Check for an e-mail to complete password recovery') );
			
			// Buttons
			var $line = $('<div>')
				.addClass('n2Auth_registered_button_line')
				.appendTo($form);
			$('<button>')
				.addClass('n2Auth_button_ok')
				.text( _loc('OK') )
				.appendTo($line)
				.button({icons:{primary:'ui-icon-check'}})
				.click(function(){
					opts.onSuccess();
					return false;
				});

			$dialog.dialog('option','title',_loc('Password Recovery Initiated'));
		};
	}

	,showLoginForm: function(opts_) {
		var opts = $.extend({
			prompt: this.options.prompt
			,onSuccess: function(context){}
			,onError: $n2.reportErrorForced
		}, opts_);

		var dialogId = $n2.getUniqueId();
		var $dialog = $('<div id="'+dialogId+'"></div>');
		$(document.body).append($dialog);
		
		this._fillDialogWithLogin(dialogId, {
			prompt: opts.prompt
			,onSuccess: function(context){
				$('#'+dialogId).dialog('close');
				opts.onSuccess(context);
			}
			,onError: function(err){
				$('#'+dialogId).dialog('close');
				opts.onError(err);
			}
		});
		
		var dialogOptions = {
			autoOpen: true
			,modal: true
			,width: 'auto'
			,close: function(event, ui){
				var diag = $('#'+dialogId);
				diag.remove();
			}
		};
		if( opts.prompt ) {
			dialogOptions.title = opts.prompt;
		}
		$dialog.dialog(dialogOptions);
	}
	
	,logout: function(opts_) {
		var opts = $n2.extend({
			onSuccess: function(context){}
			,onError: function(err){}
		},opts_);
		
		var _this = this;

		$n2.couch.getSession().logout({
			onSuccess: onSuccess
			,onError: opts.onError
		});
		
		function onSuccess(result) {

			$n2.log("Logout successful",result);
			
			opts.onSuccess(result);
		
			_this.notifyListeners();
		};
	}
	
	,editUser: function(opts_){
		var opts = $n2.extend({
			userName: null // null means current user
			,onSuccess: function(context){}
			,onError: function(err){}
		},opts_);
		
		var _this = this;
		
		var userName = opts.userName;
		if( !userName ){
			var currentUser = this.getCurrentUser();
			if( currentUser._id ) {
				// This is the user document
				userDocLoaded(currentUser);
				return;
			} else {
				// All we have is a name
				userName = currentUser.name;
			};
		};
		
		// Get document
		$n2.couch.getUserDb().getUser({
			name: userName
			,onSuccess: userDocLoaded
			,onError: function(err){
				// Create a document.. Should really be done by editor
				var userDoc = {
					_id: 'org.couchdb.user:'+userName
					,name: userName
					,display: ''
					,nunaliit_emails: []
					,roles: []
					,type: 'user'
				};
				userDocLoaded(userDoc);
			}
		});
		
		function userDocLoaded(userDoc){
			var userService = _this._getUserService();
			if( userService ){
				var dialogId = $n2.getUniqueId();
				var $dialog = $('<div id="'+dialogId+'" class="n2Auth_userEdit"></div>');
				$(document.body).append($dialog);
				
				userService.startEdit({
					userDoc: userDoc
					,elem: $dialog
					,onSavedFn: function(userDoc){
						var requestService = _this._getRequestService();
						if( requestService && userDoc && userDoc.name ){
							requestService.requestUser(userDoc.name);
						};
					}
					,onFinishedFn: function(){
						var diag = $('#'+dialogId);
						diag.dialog('close');
					}
				});
	
				var dialogOptions = {
					autoOpen: true
					,modal: true
					,width: 'auto'
					,title: _loc('Edit User')
					,close: function(event, ui){
						var diag = $('#'+dialogId);
						diag.remove();
					}
				};
				$dialog.dialog(dialogOptions);
			};
		};
	}
	
	,getCurrentUser: function() {
		var context = this.getAuthContext();

		if( null == context.name ) {
			return null;
		} else if( context.userDoc ) {
			return context.userDoc;
		};

		return context;
	}

	,getAuthContext: function() {
		return $n2.couch.getSession().getContext();
	}
	
	,isDeleteAllowed: function() {
		return this.isAdmin(); 
	}
	
	,isUpdateAllowed: function(contribCreatorDisplayName) {
		var allowed = false;
		var user = this.getCurrentUser();
		if (null != user) {
			if (user.admin) {
				allowed = true;
			} else if (!user.anonymous &&
				'' != contribCreatorDisplayName && // specific case for undefined contributor info
				user.display == contribCreatorDisplayName) {
				allowed = true;
			}
		}
		return(allowed); 
	}
	
	,isLoggedIn: function() {
		var authContext = this.getAuthContext();
		if( authContext && authContext.name ) {
			return true;
		};

		return false;
	}
	
	,isUser: function() {
		if( !this.isLoggedIn() ) return false;
		
		var user = this.getCurrentUser();
		if( user.anonymous ) return false;
		
		return true;
	}
	
	,isAdmin: function() {
		if( !this.isLoggedIn() ) return false;

		var user = this.getCurrentUser();
		if( !user.roles ) return false;

		// Check if _admin role is present
		for(var i=0,e=user.roles.length; i<e; ++i) {
			if( user.roles[i] === '_admin' ) {
				return true;
			};
		};		
		
		return false;
	}
	
	,isAnonymous: function() {
		if( !this.isLoggedIn() ) return false;
		
		var user = this.getCurrentUser();

		// Check if anonymous role is present
		for(var i=0,e=user.roles.length; i<e; ++i) {
			if( user.roles[i] === 'anonymous' ) {
				return true;
			};
		};		
		
		return false;
	}
    
	,userLoggedInAndNotAnonymous: function() {
		if( !this.isLoggedIn() ) return false;
		if( this.isAnonymous() ) return false;

		return true;
	}
	
	,autoAnonymousBehaviour: function() {
		return(isDefined(this.options.autoAnonymousLogin) && this.options.autoAnonymousLogin);
	}
	
	,createAuthWidget: function(opts_){
		var showService = null;
		var dispatchService = null;
		if( this.options.directory ){
			showService = this.options.directory.showService;
			dispatchService = this.options.directory.dispatchService;
		};
		
		var opts = $n2.extend({
			elemId: null
			,elem: null
			,authService: this
			,showService: showService
			,dispatchService: dispatchService
		},opts_);
		
		return new AuthWidget(opts);
	}
	
	,_getDispatcher: function(){
		var d = null;
		if( this.options.directory ){
			d = this.options.directory.dispatchService;
		};
		return d;
	}

	,_getUserService: function(){
		var us = null;
		if( this.options.directory ){
			us = this.options.directory.userService;
		};
		return us;
	}
	
	,_getRequestService: function(){
		var rs = null;
		if( this.options.directory ){
			rs = this.options.directory.requestService;
		};
		return rs;
	}
	
	,_dispatch: function(m){
		var dispatcher = this._getDispatcher();
		if( dispatcher ){
			var h = dispatcher.getHandle('n2.couchAuth');
			dispatcher.send(h,m);
		};
	}
	
	,_handleEvent: function(m){
		if( m && m.type === 'login' ){
			this.login({
				username: m.username
				,password: m.password
			});
			
		} else if( m && m.type === 'loginShowForm' ){
			this.showLoginForm();
			
		} else if( m && m.type === 'logout' ){
			this.logout();
		};
	}
	
	,_getCustomService: function(){
		var cs = null;
		if( this.options.directory ){
			cs = this.options.directory.customService;
		};
		return cs;
	}
	
	,_shouldDisableCreateUserButton: function(){
		var flag = this.options.disableCreateUserButton;
		
		var customService = this._getCustomService();
		if( customService && !flag ){
			var o = customService.getOption('disableCreateUserButton');
			if( typeof(o) !== 'undefined' ){
				flag = o;
			};
		};

		return flag;
	}
	
	,_updateUserWithLoggedIn: function(){
		// This function verifies if a user is logged in and if so,
		// updates the user's document to reflect that the user
		// is accessing the current atlas
		var authContext = this.getAuthContext();
		if( authContext
		 && authContext.userDoc // logged in and userDoc available 
		 && n2atlas
		 && n2atlas.name ){
			var userDoc = authContext.userDoc;
			if( userDoc.nunaliit_atlases
			 && userDoc.nunaliit_atlases[n2atlas.name] 
			 && userDoc.nunaliit_atlases[n2atlas.name].auth ) {
				// OK
			} else {
				// Needs updating
				if( !userDoc.nunaliit_atlases ){
					userDoc.nunaliit_atlases = {};
				};
				if( !userDoc.nunaliit_atlases[n2atlas.name] ){
					userDoc.nunaliit_atlases[n2atlas.name] = {
						name: n2atlas.name
					};
				};
				userDoc.nunaliit_atlases[n2atlas.name].auth = true;
				
				$n2.couch.getUserDb().updateDocument({
					data: userDoc
					,onSuccess: function() { 
						// Just fine
					}
					,onError: function(err){
						$n2.log('Unable to save user\'s authentication flag to user db',err);
					}
				});
			};
		};
	}
});	

//===================================================================================

var AuthWidget = $n2.Class({
	
	authService: null
	
	,showService: null

	,elemId: null
	
	,lastCurrentUser: null
	
	,initialize: function(options_){
		var opts = $n2.extend({
			elemId: null
			,elem: null
			,authService: null
			,showService: null
			,dispatchService: null
		},options_);
		
		var _this = this;
	
		this.authService = opts.authService;
		this.showService = opts.showService;
		this.dispatchService = opts.dispatchService;
		this.elemId = opts.elemId;
		if( !this.elemId && opts.elem ){
			this.elemId = opts.elem.attr('id');
			if( !this.elemId ){
				this.elemId = $n2.getUniqueId();
				opts.elem.attr('id',this.elemId);
			};
		};
		
		var authService = this.getAuthService();
		if( authService ){
			authService.addListeners(function(currentUser){
				_this.lastCurrentUser = currentUser;
				_this._loginStateChanged(currentUser);
			});
		};
		
		var dispatchService = this.getDispatchService();
		if( dispatchService ){
			dispatchService.register(DH,'userDocument',function(m){
				if( m 
				 && m.userDoc 
				 && _this.lastCurrentUser 
				 && _this.lastCurrentUser._id === m.userDoc._id ){
					_this.lastCurrentUser = m.userDoc;
					_this._loginStateChanged(m.userDoc);
				};
			});
		};
	}

	,getWidgetElem: function(){
		if( this.elemId ){
			return $('#'+this.elemId);
		};
		
		return $('#n2AuthDummy'); // return empty set
	}

	,getAuthService: function(){
		return this.authService;
	}

	,getShowService: function(){
		return this.showService;
	}

	,getDispatchService: function(){
		return this.dispatchService;
	}

	,_loginStateChanged: function(currentUser) {

		var $login = this.getWidgetElem();
		if( $login.length < 1 ) return;
		$login.empty();
		
		var authService = this.getAuthService();
		if( authService ) {
			var href = null;
			var displayName = null;
			var buttonText = null;
			var clickFn = null;
			var greetingFn = null;
			var greetingClass = null;
			if( currentUser ){
				href = 'javascript:Logout';
				displayName = currentUser.display;
				if( !displayName ) displayName = currentUser.name;
				greetingClass = 'nunaliit_login_greeting_name';
				buttonText = _loc('Logout');
				clickFn = function(){
					authService.logout();
					return false;
				};
				greetingFn = function(){
					authService.editUser({
						userName: null // current user
					});
					return false;
				};
			} else {
				href = 'javascript:Login';
				displayName = _loc('Welcome');
				greetingClass = 'nunaliit_login_greeting_welcome';
				buttonText = _loc('Login');
				clickFn = function(){
					authService.showLoginForm();
					return false;
				};
			};
			
			var aElem = $('<a class="nunaliit_login_link"></a>')
				.attr("href",href)
				.text(buttonText);
			var linkInnerContainer = $('<div class="nunaliit_login_link_inner_container"></div>')
				.append(aElem);
			var linkOuterContainer = $('<div class="nunaliit_login_link_outer_container"></div>')
				.append(linkInnerContainer)
				.click(clickFn);

			var nameElem = $('<span></span>')
				.text(displayName);
			var greetingInner = $('<div class="nunaliit_login_greeting_inner_container"></div>')
				.append(nameElem);
			var greetingOuter = $('<div class="nunaliit_login_greeting_outer_container"></div>')
				.addClass(greetingClass)
				.append(greetingInner);
			if( greetingFn ){
				greetingOuter
					.addClass('nunaliit_login_greeting_with_editor')
					.click(greetingFn);
			};
			
			$login.empty().append(greetingOuter).append(linkOuterContainer);
		};
	}
});

//===================================================================================

$n2.couchAuth = {
	AuthService: AuthService
	,AuthWidget: AuthWidget
	,_defaultAuthService: null
};

$.NUNALIIT_AUTH = {
	getUser: function(){
		return $n2.couchAuth._defaultAuthService.getCurrentUser();
	}

	,getAuthContext: function() {
		return $n2.couchAuth._defaultAuthService.getAuthContext();
	}
	
	,init: function(opts_){
		$n2.couchAuth._defaultAuthService = new AuthService(opts_);
		return $n2.couchAuth._defaultAuthService;
	}

	,login: function(opts_){
		$n2.couchAuth._defaultAuthService.showLoginForm(opts_);
	}
	
	,logout: function(opts_){
		$n2.couchAuth._defaultAuthService.logout(opts_);
	}
	
	,addListener: function(opts_){
		$n2.couchAuth._defaultAuthService.addListeners(opts_);
	}
	
	,isDeleteAllowed: function(){
		return $n2.couchAuth._defaultAuthService.isDeleteAllowed();
	}
	
	,isUpdateAllowed: function(){
		return $n2.couchAuth._defaultAuthService.isUpdateAllowed();
	}
	
	,isLoggedIn: function(){
		return $n2.couchAuth._defaultAuthService.isLoggedIn();
	}
	
	,isUser: function(){
		return $n2.couchAuth._defaultAuthService.isUser();
	}
	
	,isAdmin: function(){
		return $n2.couchAuth._defaultAuthService.isAdmin();
	}
	
	,isAnonymous: function(){
		return $n2.couchAuth._defaultAuthService.isAnonymous();
	}
	
	,userLoggedInAndNotAnonymous: function(){
		return $n2.couchAuth._defaultAuthService.userLoggedInAndNotAnonymous();
	}
	
	,autoAnonymousBehaviour: function(){
		return $n2.couchAuth._defaultAuthService.autoAnonymousBehaviour();
	}
	
	,autoAnonLogin: function(opts_){
		$n2.couchAuth._defaultAuthService.autoAnonLogin(opts_);
	}
};

})(jQuery,nunaliit2);

