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
*/

// @ requires n2.utils.js
// @ requires n2.form.js
// @ requires n2.couch.js

;(function($,$n2){
"use strict";

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
	
	,couchServer: null

	,loginStateListeners: null
	
	,lastAuthSessionCookie: null
	
	,lastSessionContext: null
	
	,userServiceAvailable: null
	
	,autoRegistrationAvailable: null
	
	,currentUserDoc: null
	
	,initialize: function(options_){
		var _this = this;
		
		this.options = $n2.extend(
			{
				onSuccess: function(result,options) {}
				,onError: defaultError
				,atlasDb: null
				,schemaRepository: null
				,disableCreateUserButton: false
				,directory: null
				,listeners: null
				,autoRefresh: true
				,prompt: _loc('Please login')
				,refreshIntervalInSec: 2 // 120 // 2 minutes
				,userServerUrl: null
			}
			,options_
		);
		
		this.loginStateListeners = [];
		this.lastAuthSessionCookie = null;
		this.lastSessionContext = null;
		this.userServiceAvailable = false;
		this.autoRegistrationAvailable = false;
		
		this.couchServer = undefined;
		if( this.options.directory ){
			this.couchServer = this.options.directory.couchServer;
		};
		if( !this.couchServer ){
			$n2.log('Couch Server must be specified for CouchDb AuthService');
			this.options.onError( _loc('Server must be specified for CouchDb AuthService') );
			return;
		};
		
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

		this.couchServer.getSession().refreshContext({
			onSuccess: onSuccess
			,onError: onError
		});		

		this.couchServer.getSession().addChangedContextListener(function(sessionContext){
			_this._handleSessionContextChange(sessionContext);
		});
		
		if( this.options.autoRefresh
		 && this.options.refreshIntervalInSec > 0
		 && typeof(setInterval) === 'function' ) {
			setInterval(
				function(){
					_this.couchServer.getSession().refreshContext({
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
						_this.couchServer.getSession().refreshContext({
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
			dispatcher.register(DH,'authIsLoggedIn',fn);
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
		    		_this.userServiceAvailable = true;
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
			initOnSuccess(context, optWithCallbacks);
			_this._notifyListeners();
		};
		
		function onError(error) {
			$n2.log('Login(adjustCookies) error: '+error);
			
			var err = {
				message: 'Problem initializing authentication library'
				,cause: {
					message: error
				}
			};
			initOnError(err, optWithCallbacks);
			_this._notifyListeners();
		};
	}

	,addListeners: function(listeners) {
		var _this = this;
		var cUser = this._getCurrentListenerInfo();
		
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
				$n2.log('CouchAuthService: EXCEPTION caught in listener (add)',e);
			};
		};
	}
	
	,_notifyListeners: function() {
		var context = this._getAuthContext();
		
		var userName = null;
		if( context ) {
			userName = context.name;
		};
		
		var isAdmin = false;
		if( context 
		 && context.roles 
		 && this.doRolesContainAdmin(context.roles) ){
			isAdmin = true;
		};

		// Notify other instances of atlas in browser
		$n2.cookie.setCookie({
			name: 'NunaliitAuth'
			,value: userName
			,path: '/'
		});
		
		// Notify via DOM classes
		var $body = $('body');
		if( userName ){
			$body.removeClass('nunaliit_logged_out');
			$body.addClass('nunaliit_logged_in');
		} else {
			$body.removeClass('nunaliit_logged_in');
			$body.removeClass('nunaliit_user_advanced');
			$body.addClass('nunaliit_logged_out');
		};
		if( isAdmin ) {
			$body.addClass('nunaliit_user_administrator');
		} else {
			$body.removeClass('nunaliit_user_administrator');
		};
		
		// Notify via dispatcher
		if( userName ){
			this._dispatch({
				type: 'authLoggedIn'
				,user: context
			});
		} else {
			this._dispatch({
				type: 'authLoggedOut'
			});
		};
		
		var cUser = this._getCurrentListenerInfo();
		for(var loop=0; loop<this.loginStateListeners.length; ++loop) {
			var listener = this.loginStateListeners[loop];
			if( listener ) {
				try {
					listener(cUser);
				} catch(e) {
					$n2.log('CouchAuthService: EXCEPTION caught in listener (notify)',e);
				};
			};
		};
	}
	
	,_getCurrentListenerInfo: function(){
		var context = this._getAuthContext();
		
		var info = null;
		if( context && context.name ){
			info = {
				name: context.name
				,roles: context.roles
			};
		};
		
		return info;
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

		if( this.userServiceAvailable ){
			var url = this.options.userServerUrl + 'getUser';
			
			$.ajax({
		    	url: url
		    	,type: 'GET'
		    	,async: true
		    	,traditional: true
		    	,data: {
		    		email: username.toLowerCase()
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
			_this.couchServer.getSession().login({
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
			_this.couchServer.getUserDb().getUser({
				name: username
				,onSuccess: function(userDoc){
					// If the user agreement was accepted, the user
					// servlet add a role to the user which is
					// "nunaliit_agreement_" + name-of-atlas
					var atlasName = _this._getAtlasName();
					var agreementRole = 'nunaliit_agreement_'+atlasName;
					if( userDoc
					 && userDoc.roles ){
						for(var i=0,e=userDoc.roles.length; i<e; ++i){
							var role = userDoc.roles[i];
							if( role === agreementRole ){
								checkUserQuestionnaire(sessionResult, userDoc);
								return;
							};
						};
					};
					
					// At this point, a new user agreement must be accepted
					proposeNewUserAgreement(sessionResult, userDoc);
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
						checkUserQuestionnaire(sessionResult, null);
					} else {
						$n2.log('Unable to obtain user information: '+err);
						onError( _loc('Unable to obtain information about user') );
					};
				}
			});
		};
		
		function proposeNewUserAgreement(sessionResult, userDoc){
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
							.text( _loc('User agreement has changed. You must accept before you can authenticate.') )
							.appendTo($content);
						
						$('<textarea>')
							.addClass('n2Auth_user_agreement_content')
							.attr('readonly','readonly')
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
								acceptUserAgreement(agreementContent, sessionResult, userDoc);
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
						acceptUserAgreement('', sessionResult, userDoc);
					};
				}
				,onError: function(err){
					$n2.log('Error getting user agreement: '+err);
					onError( _loc('Unable to obtain user agreement') );
				}
			});
		};
		
		function acceptUserAgreement(userAgreement, sessionResult, userDoc){
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
		    		checkUserQuestionnaire(sessionResult, userDoc);
		    	}
		    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
					onError( _loc('Error attempting to accept user agreement') );
				}	
			});
		};
		
		function checkUserQuestionnaire(sessionResult, userDoc){
			// No user document. Probably an admin.
			// Anyway, nothing we can do. Skip questions.
			if( !userDoc ){
				onLoginCompleted(sessionResult, userDoc);
				return;
			};
			
			// Load user questionnaire
			if( _this.options.schemaRepository ){
				_this.options.schemaRepository.getSchema({
					name: 'nunaliit_user_questions'
					,onSuccess: function(schema){
						var defaultAnswers = schema.createObject();
						if( !defaultAnswers.version ){
							$n2.log('User questions found without a version number. Ignored.');
							onLoginCompleted(sessionResult, userDoc);
							return;
						};
						
						var atlasName = _this._getAtlasName();

						var answers = null;
						if( userDoc 
						 && userDoc.nunaliit_answers ){
							answers = userDoc.nunaliit_answers[atlasName];
						};
						
						var interventionRequired = false;
						if( !answers ){
							interventionRequired = true;
							answers = defaultAnswers;
						} else if( answers.version != defaultAnswers.version ){
							interventionRequired = true;
						};
						
						if( interventionRequired ){
							gatherUserAnswers(sessionResult, userDoc, schema, answers);
						} else {
							onLoginCompleted(sessionResult, userDoc);
						};
					}
					,onError: function(err){
						// Schema not found. No questions. Just continue
						// with login process
						onLoginCompleted(sessionResult, userDoc);
					}
				});
				
			} else {
				// No schema repository. No questions. Just continue
				// with login process
				onLoginCompleted(sessionResult, userDoc);
			};
		};
		
		function gatherUserAnswers(sessionResult, userDoc, schema, answers){
			var diagId = $n2.getUniqueId();
			var $diag = $('<div>')
				.attr('id',diagId);
			
			var $content = $('<div>')
				.addClass('n2Auth_user_questions_dialog')
				.appendTo($diag);
			
			var $elem = $('<div>')
				.addClass('n2Auth_user_questions_form')
				.appendTo($content);
			
			schema.form(answers, $elem);
			
			var $buttons = $('<div>')
				.addClass('n2Auth_user_questions_buttons')
				.appendTo($content);
			
			$('<button>')
				.addClass('n2_button_ok')
				.text( _loc('OK') )
				.click(function(){
					var $diag = $('#'+diagId);
					$diag.dialog('close');
					saveUserAnswers(sessionResult, userDoc, answers);
				})
				.appendTo($buttons);
			
			$('<button>')
				.addClass('n2_button_cancel')
				.text( _loc('Remind me later') )
				.click(function(){
					var $diag = $('#'+diagId);
					$diag.dialog('close');
					onLoginCompleted(sessionResult, userDoc);
				})
				.appendTo($buttons);
		
			$diag.dialog({
				autoOpen: true
				,title: _loc('User Questionnaire')
				,modal: true
				,width: 'auto'
				,close: function(event, ui){
					var $diag = $('#'+diagId);
					$diag.remove();
				}
			});
		};
		
		function saveUserAnswers(sessionResult, userDoc, answers){
    		// Must reload the user document since it might have changed
			_this.couchServer.getUserDb().getUser({
				name: userDoc.name
				,onSuccess: function(userDoc){
					var atlasName = _this._getAtlasName();

					if( !userDoc.nunaliit_answers ){
						userDoc.nunaliit_answers = {};
					};

					userDoc.nunaliit_answers[atlasName] = answers;
					
					_this.couchServer.getUserDb().updateDocument({
						data: userDoc
						,onSuccess: reloadUserDoc
						,onError: errorSavingAnswers
					});
				}
				,onError: errorSavingAnswers
			});
			
			function errorSavingAnswers(err){
				$n2.log('Error saving user answers',err);
				alert( _loc('There was a problem saving your answers. You will be prompted again next time you log in.') );
				onLoginCompleted(sessionResult);
			};
			
			function reloadUserDoc(){
				_this.couchServer.getUserDb().getUser({
					id: userDoc._id
					,onSuccess: function(updatedUserDoc){
						onLoginCompleted(sessionResult, updatedUserDoc);
					}
					,onError: function(err){
						$n2.log('Error retrieving updated version of user document',err);
						onLoginCompleted(sessionResult, userDoc);
					}
				});
			};
		};
		
		function onLoginCompleted(result, userDoc) {

			var context = _this.couchServer.getSession().getContext();

			$n2.log('Login successful',context,opts);
			
			if( context && context.name ) {
				opts.onSuccess(context);
				_this._notifyListeners();

			} else {
				doErrorNotification();
			};
		};
		
		function onError(err) {
			_this.couchServer.getSession().logout({
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
			_this._notifyListeners();
		};
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
		
		var $labelDiv = $('<div class="n2Auth_login_input"></div>')
			.appendTo($userLine);

		$('<input class="n2Auth_user_input n2Auth_input_field" type="text" name="username"/>')
			.val(nameValue)
			.appendTo($labelDiv);
		
		$('<div class="n2Auth_login_label"></div>')
			.text(nameLabel)
			.appendTo($labelDiv);
		
		// Password line
		var $pwLine = $('<div class="n2Auth_login_pw_line"></div>')
			.appendTo($authForm);
		
		var $pwDiv = $('<div class="n2Auth_login_input"></div>')
			.appendTo($pwLine);
		
		$('<input class="n2Auth_pw_input n2Auth_input_field" type="password" name="password"/>')
			.appendTo($pwDiv);
		
		$('<div class="n2Auth_login_label"></div>')
			.text(_loc('password'))
			.appendTo($pwDiv);
		
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
		};

		// Recover password line
		if( this.autoRegistrationAvailable ){
			var $recoverLine = $('<div class="n2Auth_login_recover_line"></div>')
				.appendTo($authDiag);
	
			$('<a class="n2Auth_button_recoverPassword" href="#"></a>')
				.appendTo($recoverLine)
				.text( _loc('Reset password?') )
				.click(function(){
					var $dialog = $('#'+dialogId);
					var userName = $dialog.find('.n2Auth_user_input').val();
					opts.userName = userName;
					_this._fillDialogWithPasswordRecovery(dialogId, opts);
					return false;
				});

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
		
		$dialog.empty();
		
		var $form = $('<div>')
			.addClass('n2Auth_create')
			.appendTo($dialog);
		
		// User name 
		var $userLine = $('<div>')
			.addClass('n2Auth_create_user_line')
			.appendTo($form);
		
		var $userInput = $('<div>')
			.addClass('n2Auth_create_input')
			.appendTo($userLine);
		
		$('<input type="text" autofocus>')
			.addClass('n2Auth_user_input n2Auth_input_field')
			.appendTo($userInput)
			
		$('<div>')
			.addClass('n2Auth_create_label')
			.text( _loc('user name') )
			.appendTo($userInput);
		
		// Display name 
		var $displayLine = $('<div>')
			.addClass('n2Auth_create_display_line')
			.appendTo($form);
		
		var $displayInput = $('<div>')
			.addClass('n2Auth_create_input')
			.appendTo($displayLine);
		
		$('<input type="text">')
			.addClass('n2Auth_display_input n2Auth_input_field')
			.appendTo($displayInput)
			
		$('<div>')
			.addClass('n2Auth_create_label')
			.text( _loc('display name') )
			.appendTo($displayInput);
		
		// Password 
		var $pwLine = $('<div>')
			.addClass('n2Auth_create_pw1_line')
			.appendTo($form);
		
		var $pwInput = $('<div>')
			.addClass('n2Auth_create_input')
			.appendTo($pwLine);
		
		$('<input type="password">')
			.addClass('n2Auth_pw_input n2Auth_input_field')
			.appendTo($pwInput)
			
		$('<div>')
			.addClass('n2Auth_create_label')
			.text( _loc('password') )
			.appendTo($pwInput);
		
		// Password confirmation
		var $pw2Line = $('<div>')
			.addClass('n2Auth_create_pw2_line')
			.appendTo($form);
		
		var $pw2Input = $('<div>')
			.addClass('n2Auth_create_input')
			.appendTo($pw2Line);
		
		$('<input type="password">')
			.addClass('n2Auth_pw_input2 n2Auth_input_field')
			.appendTo($pw2Input)
			
		$('<div>')
			.addClass('n2Auth_create_label')
			.text( _loc('confirm password') )
			.appendTo($pw2Input);
		
		if( opts.userName ){
			var $n2AuthUserInput = $dialog.find('.n2Auth_user_input');
			$n2AuthUserInput.val( opts.userName );
			$n2AuthUserInput.addClass('n2_input_detected');
		};
		
		// Create User Button
		var $line = $('<div>')
			.addClass('n2Auth_create_button_line')
			.appendTo($form);
		$('<button>')
			.addClass('n2Auth_button_create')
			.text( _loc('Create User') )
			.appendTo($line)
			.click(function(){
				performUserCreation();
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
			
			_this.couchServer.getUserDb().createUser({
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
		
		// E-mail address
		var $line = $('<div>')
			.addClass('n2Auth_create_email_line')
			.appendTo($form);

		var $input = $('<div>')
			.addClass('n2Auth_create_input')
			.appendTo($line);
		$('<input type="text" autofocus>')
			.addClass('n2Auth_email_input n2Auth_input_field')
			.appendTo($input)
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
		
		if( opts.userName ){
			var $n2AuthEmailInput = $dialog.find('.n2Auth_email_input');
			$n2AuthEmailInput.val( opts.userName );
			$n2AuthEmailInput.addClass('n2_input_detected');
		};

		$('<div>')
			.addClass('n2Auth_create_label')
			.text( _loc('e-mail address') )
			.appendTo($input);
		
		
		// Buttons
		var $line = $('<div>')
			.addClass('n2Auth_create_button_line')
			.appendTo($form);
		$('<button>')
			.addClass('n2Auth_button_create')
			.text( _loc('Create User') )
			.appendTo($line)
			.click(function(){
				performUserRegistration();
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
			userName: null
			,onSuccess: function(context){}
			,onError: function(err){}
		},opts_);

		var _this = this;
		var $dialog = $('#'+dialogId);

		$dialog.empty();

		var $form = $('<div>')
			.addClass('n2Auth_recoverPassword')
			.appendTo($dialog);

		// E-mail address
		var $line = $('<div>')
			.addClass('n2Auth_recoverPassword_email_line')
			.appendTo($form);

		var $input = $('<div>')
			.addClass('n2Auth_recoverPassword_input')
			.appendTo($line);
		$('<input type="text" autofocus>')
			.addClass('n2Auth_email_input n2Auth_input_field')
			.appendTo($input)
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

		if( opts.userName ){
			var $n2RecoverPasswordInput = $dialog.find('.n2Auth_email_input');
			$n2RecoverPasswordInput.val( opts.userName );
			$n2RecoverPasswordInput.addClass('n2_input_detected');
		};
		
		$('<div>')
			.addClass('n2Auth_recoverPassword_label')
			.text( _loc('e-mail address') )
			.appendTo($input);
		
		// Buttons
		var $line = $('<div>')
			.addClass('n2Auth_recoverPassword_button_line')
			.appendTo($form);
		$('<button>')
			.addClass('n2Auth_button_recover')
			.text( _loc('Reset Password') )
			.appendTo($line)
			.click(function(){
				performPasswordRecovery();
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
		    			reportError(result.error);
		    		} else {
		    			reportSuccess();
		    		};
		    	}
		    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
		    		var result = $n2.utils.parseHttpJsonError(XMLHttpRequest, undefined);
	    			reportError(result.error);
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
		
		function reportError(errorMessage){
			var $dialog = $('#'+dialogId);

			$dialog.empty();
			
			var $form = $('<div>')
				.addClass('n2Auth_recoverError')
				.appendTo($dialog);
			
			// Explanation
			$('<div>')
				.addClass('n2Auth_recoverError_line')
				.appendTo($form)
				.text( _loc('Unable to initiate password recovery. Contact your administrator to resolve this issue.') );
			
			// Reported Error
			if( errorMessage ){
				$('<div>')
					.addClass('n2Auth_recoverError_report')
					.appendTo($form)
					.text( errorMessage );
			};
			
			// Buttons
			var $line = $('<div>')
				.addClass('n2Auth_recoverError_button_line')
				.appendTo($form);
			$('<button>')
				.addClass('n2Auth_button_ok')
				.text( _loc('OK') )
				.appendTo($line)
				.button({icons:{primary:'ui-icon-check'}})
				.click(function(){
					_this._fillDialogWithLogin(dialogId, opts);
					return false;
				});

			$dialog.dialog('option','title',_loc('Password Recovery Failure'));
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

		this.couchServer.getSession().logout({
			onSuccess: onSuccess
			,onError: opts.onError
		});
		
		function onSuccess(result) {

			$n2.log("Logout successful",result);
			
			opts.onSuccess(result);
		
			_this._notifyListeners();
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
			var context = this._getAuthContext();
			if( context && context.name ){
				// All we have is a name
				userName = context.name;
			};
		};
		
		if( !userName ){
			opts.onError('No user name provided');
			return;
		};
		
		// Get document
		this.couchServer.getUserDb().getUser({
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
			var userEditDialog;
			var userService = _this._getUserService();
			if (userService) {

				userEditDialog = new $n2.mdc.MDCDialog({
					mdcClasses: ['n2Auth_userEdit'],
					dialogTitle: 'Edit User',
					closeBtn: true,
					closeBtnText: _loc("Close")
				});

				userService.startEdit({
					userDoc: userDoc
					,elem: $('#' + userEditDialog.getContentId())
					,onSavedFn: function(userDoc) {
						var requestService = _this._getRequestService();
						if (requestService
							&& userDoc
							&& userDoc.name) {
							requestService.requestUser(userDoc.name);
						}
					}
				});
			}
		}
	}

	,getCurrentUserName: function() {
		var context = this._getAuthContext();

		if( context && context.name ) {
			return context.name;
		};

		return null;
	}
	
	,getCurrentUserRoles: function() {
		var context = this._getAuthContext();

		if( context && context.roles ) {
			return context.roles;
		};

		return null;
	}
	
	,doRolesContainAdmin: function(roles) {
		var admin = false;
		
		if( roles && roles.length ) {
			if( $.inArray('_admin',roles) >= 0 ) {
				admin = true;
			};
			if( $.inArray('administrator',roles) >= 0 ) {
				admin = true;
			};
			if( typeof(n2atlas) === 'object' 
			 && typeof(n2atlas.name) === 'string' ) {
				var dbAdmin = n2atlas.name + '_administrator';
				if( $.inArray(dbAdmin,roles) >= 0 ) {
					admin = true;
				};
			};
		};

		return admin;
	},
	
	/*
	 * Returns context obtained from CouchDb session
	 */
	_getAuthContext: function() {
		return this.couchServer.getSession().getContext();
	}
	
	,isLoggedIn: function() {
		var authContext = this._getAuthContext();
		if( authContext && authContext.name ) {
			return true;
		};

		return false;
	}
	
	,createAuthWidget: function(opts_){
		var dispatchService = null;
		var customService = null;
		var showService = null;
		if( this.options.directory ){
			dispatchService = this.options.directory.dispatchService;
			customService = this.options.directory.customService;
			showService = this.options.directory.showService;
		};
		
		var widgetOptions = {
			elemId: null
			,elem: null
			,authService: this
			,dispatchService: dispatchService
		};
		
		if( customService ){
			var label = customService.getOption('authWidgetLoginLabel');
			if( label ) widgetOptions.labelLogin = label;

			label = customService.getOption('authWidgetLogoutLabel');
			if( label ) widgetOptions.labelLogout = label;

			label = customService.getOption('authWidgetWelcomeLabel');
			if( label ) widgetOptions.labelWelcome = label;
		};
		
		var opts = $n2.extend(widgetOptions,opts_);
		
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
	},
	
	/*
	 * This function is called everytime the CouchDb context is refreshed.
	 * This can happen often, since the CouchDb layer performs this at a set
	 * interval.
	 */
	_handleSessionContextChange: function(sessionContext){
		var _this = this;
		
		var same = $n2.couch.compareSessionContexts(this.lastSessionContext, sessionContext);
		if( !same ){
			this.lastSessionContext = sessionContext;
			this.currentUserDoc = null;
			
			this._notifyListeners();

			// Get current user doc
			if( sessionContext.name ){
				this.couchServer.getUserDb().getUser({
					name: sessionContext.name
					,onSuccess: function(userDoc){
						// Check that it is still valid
						if( userDoc.name === _this.lastSessionContext.name ) {
							_this._handleCurrentUserDoc(userDoc);
						};
					}
					,onError: function(err){
						// No document associated with this user
						// Check that request is still valid
						if( sessionContext.name === _this.lastSessionContext.name ) {
							_this._handleCurrentUserDoc(null);
						};
					}
				});
			};
		};
	},
	
	_handleCurrentUserDoc: function(userDoc){
		this.currentUserDoc = userDoc;

		// Notify DOM classes
		var $body = $('body');
		if( this.currentUserDoc
		 && this.currentUserDoc.nunaliit_options
		 && this.currentUserDoc.nunaliit_options.advanced ){
			$body.addClass('nunaliit_user_advanced');
		} else {
			$body.removeClass('nunaliit_user_advanced');
		};

		if( userDoc ) {
			this._dispatch({
				type: 'authCurrentUserDoc'
				,userDoc: userDoc
			});
		};
		
		// Perform updates to the user document, if needed
		this._updateUserDocWithLoggedIn();
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

		} else if( m && m.type === 'authIsLoggedIn' ){
			// Synchronous call
			if( this.isLoggedIn() ){
				m.isLoggedIn = true;
				m.context = this.lastSessionContext;
				m.userDoc = this.currentUserDoc;
			};
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
	},
	
	/*
	 * This function verifies if a user is logged in and if so,
	 * updates the user's document to reflect that the user
	 * is accessing the current atlas
	 */
	_updateUserDocWithLoggedIn: function(){
		var userDoc = this.currentUserDoc;
		if( userDoc // logged in and userDoc available 
		 && n2atlas
		 && n2atlas.name ){
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
				
				this.couchServer.getUserDb().updateDocument({
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
	
	,_getAtlasName: function(){
		var atlasName = 'atlas';
		
		if( typeof n2atlas === 'object' 
		 && n2atlas.name ){
			atlasName = n2atlas.name;
		};
		
		return atlasName;
	}
});	

// ===================================================================================

var AuthWidget = $n2.Class({
	
	authService: null
	
	,elemId: null
	
	,currentUserName: null
	
	,currentUserDisplay: null

	,labelLogin: null
	
	,labelLogout: null
	
	,labelWelcome: null

	,loginMenu: null
	
	,initialize: function(options_){
		var opts = $n2.extend({
			elemId: null
			,elem: null
			,authService: null
			,dispatchService: null
			,showService: null
			,labelLogin: null
			,labelLogout: null
			,labelWelcome: null
		},options_);
		
		var _this = this;
	
		this.authService = opts.authService;
		this.dispatchService = opts.dispatchService;
		this.labelLogin = opts.labelLogin;
		this.labelLogout = opts.labelLogout;
		this.labelWelcome = opts.labelWelcome;
		this.loginMenu = new $n2.couchAuth.AuthWidgetMenu(opts);
		
		this.elemId = opts.elemId;
		if( !this.elemId && opts.elem ){
			this.elemId = $n2.utils.getElementIdentifier(opts.elem);
		};
		
		if( this.dispatchService ){
			var f = function(m, addr, d){
				_this._handleDispatch(m, addr, d);
			};
			this.dispatchService.register(DH,'authLoggedIn',f);
			this.dispatchService.register(DH,'authLoggedOut',f);
			this.dispatchService.register(DH,'authCurrentUserDoc',f);
			this.dispatchService.register(DH,'userInfo',f);
			this.dispatchService.register(DH,'userDocument',f);
			this.dispatchService.register(DH,'openUserMenu',f);
			this.dispatchService.register(DH,'closeUserMenu',f);

			// Initialize State
			var m = {
				type: 'authIsLoggedIn'
				,isLoggedIn: false
			};
			this.dispatchService.synchronousCall(DH,m);
			if( m.isLoggedIn ){
				if( m.context && m.context.name ){
					this.currentUserName = m.context.name;
				};
				if( m.userDoc && m.userDoc.display ){
					this.currentUserDisplay = m.userDoc.display;
				};
				
			} else {
				this.currentUserName = null;
				this.currentUserDisplay = null;
			};
			
			this._loginStateChanged();
		};
	}

	,_getElem: function(){
		return $('#'+this.elemId);
	}
	
	,_handleDispatch: function(m, addr, dispatcher){
		// Check if widget still displayed
		var _this = this;
		var $elem = this._getElem();
		if( $elem.length < 1 ){
			// Deregister
			dispatcher.deregister(addr);
			return;
		};
		
		if( 'authLoggedIn' === m.type ){
			var ctxt = m.user;
			if( this.currentUserName !== ctxt.name ){
				this.currentUserName = ctxt.name;
				this.currentUserDisplay = null;

				this._loginStateChanged();
			};
			
		} else if( 'authLoggedOut' === m.type ){
			this.currentUserName = null;
			this.currentUserDisplay = null;
			this._loginStateChanged();
			
		} else if( 'authCurrentUserDoc' === m.type ){
			var userDoc = m.userDoc;
			if( userDoc
			 && userDoc.display !== this.currentUserDisplay ){
				this.currentUserDisplay = userDoc.display;
				this._loginStateChanged();
			};
			
		} else if( 'userInfo' === m.type ){
			if( m.userInfo 
			 && this.currentUserName === m.userInfo.name ){
				this.currentUserDisplay = m.userInfo.display;
				this._loginStateChanged();
			};

		} else if( 'userDocument' === m.type ){
			if( m.userDoc 
			 && this.currentUserName === m.userDoc.name ){
				this.currentUserDisplay = m.userDoc.display;
				this._loginStateChanged();
			};

		} else if( 'openUserMenu' === m.type ){
			_this.loginMenu.openUserMenu();

		} else if( 'closeUserMenu' === m.type ){
			_this.loginMenu.closeUserMenu();
		};
	}

	,_loginStateChanged: function() {

		var _this = this;
		var $login = this._getElem();
		if( $login.length < 1 ) return;
		$login.empty();
		
		var authService = this.authService;
		if( authService ) {
			var href = null;
			var displayName = null;
			var buttonText = null;
			var clickFn = null;
			var greetingFn = null;
			var greetingClass = null;
			if( this.currentUserName ){
				href = 'javascript:Logout';
				displayName = this.currentUserDisplay;
				if( !displayName ) displayName = this.currentUserName;
				greetingClass = 'nunaliit_login_greeting_name';
				buttonText = this.labelLogout ? this.labelLogout : _loc('Logout');
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
				displayName = this.labelWelcome ? this.labelWelcome : '';
				greetingClass = 'nunaliit_login_greeting_welcome';
				buttonText = this.labelLogin ? this.labelLogin : _loc('Login');
				clickFn = function(){
					authService.showLoginForm();
					return false;
				};
			};

			var nameElem = $('<button>')
				.addClass('nunaliit_login_link mdc-button n2s_attachMDCButton');

			$('<span>')
				.addClass('mdc-button__label')
				.text(displayName)
				.appendTo(nameElem);

			$('<span>')
				.addClass('nunalitt_login_profile_icon mdc-button__icon')
				.appendTo(nameElem);

			var greetingInner = $('<div class="nunaliit_login_greeting_inner_container"></div>')
				.append(nameElem);

			var greetingOuter = $('<div class="nunaliit_login_greeting_outer_container"></div>')
				.addClass(greetingClass)
				.append(greetingInner);

			$login.empty().append(greetingOuter);

			if( this.currentUserName ){

				greetingInner.click(function(){
					_this.dispatchService.synchronousCall(DH,{type: 'openUserMenu'});
				});

			} else {
				nameElem.attr("href",href)
					.text(buttonText);

				nameElem.click(clickFn);
			};
		};
	}
});

// ===================================================================================

var AuthWidgetMenu = $n2.Class({
	menuContainer: null
	,authLoginMenu: null
	,authLoginMenuList: null
	,dispatchService: null
	,showService: null
	,authService: null
	,currentUserName: null
	,currentUserDisplay: null

	,initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null
			,authService: null

		},opts_);

		var _this = this;

		if( $('body').hasClass('nunaliit_atlas') ){
			this.menuContainer = $('.nunaliit_atlas');

		} else if( $('body').hasClass('nunaliit_application') ){
			this.menuContainer = $('.nunaliit_application');

		} else {
			$n2.log('Invalid container available for user menu');
		};


		this.dispatchService = opts.dispatchService;
		this.showService = opts.showService;

		if( this.dispatchService ){

			var f = function(m, addr, d){
				_this._handleDispatch(m, addr, d);
			};
			this.dispatchService.register(DH,'authLoggedIn',f);
			this.dispatchService.register(DH,'authLoggedOut',f);
			this.dispatchService.register(DH,'authCurrentUserDoc',f);
			this.dispatchService.register(DH,'closeUserMenu',f);
		};

		if( opts.authService ){
			this.authService = opts.authService;
		};		

		// Generate Menu
		this._generateMenu();
	}

	,_handleDispatch: function(m){
		var _this = this;

		if( 'authLoggedIn' === m.type ){
			var ctxt = m.user;
			if( _this.currentUserName !== ctxt.name ){
				_this.currentUserName = ctxt.name;
				_this.currentUserDisplay = null;
			};

		} else if( 'authLoggedOut' === m.type ){
			this.currentUserName = null;
			this.currentUserDisplay = null;

		} else if( 'authCurrentUserDoc' === m.type ){
			var userDoc = m.userDoc;
			if( userDoc ){
				if( userDoc.display !== _this.currentUserDisplay ){
					_this.currentUserDisplay = userDoc.display;
				};
			};

		} else if( 'closeUserMenu' === m.type ){
			_this.closeUserMenu();
		};
	}
	,_addMenuMask: function(){
		var _this = this;

		if( $('.nunaliit_login_menu_mask').length > 0 ){
			$('.nunaliit_login_menu_mask').remove();
		};

		$('<div>')
			.addClass('nunaliit_login_menu_mask')
			.appendTo(_this.menuContainer)
			.click(function(){
				// Close the user menu
				_this.dispatchService.synchronousCall(DH,{type: 'closeUserMenu'});
				// Remove the menu mask div
				$('.nunaliit_login_menu_mask').remove();
			});

	}
	,_generateMenu: function(){

		// If login menu already exists, remove it before re-generating it
		if( $('.nunaliit_login_menu').length > 0 ){
			$('.nunaliit_login_menu').remove();
		};

		this.authLoginMenu = $('<div>')
			.addClass('nunaliit_login_menu')
			.appendTo(this.menuContainer);

		var menuListContainer = $('<div>')
			.addClass('nunaliit_login_menu_list_container')
			.appendTo(this.authLoginMenu);

		var menuUserProfileContainer = $('<div>')
			.addClass('nunaliit_login_menu_profile_container')
			.appendTo(this.authLoginMenu);

		this.authLoginMenuList = $('<ul>')
			.appendTo(menuListContainer);

		this._addMenuProfile();
		this._addMenuItems();
	}

	,_addMenuProfile: function(){
		var _this = this;

		// If login menu already exists, remove it before re-generating it
		if( $('.nunaliit_login_menu_profile_container').length > 0 ){
			$('.nunaliit_login_menu_profile_container').empty();
		};

		var profileImage = $('<div>')
			.appendTo('.nunaliit_login_menu_profile_container')
			.addClass('nunaliit_login_menu_profile_image');

		var userName = $('<span>')
			.addClass('n2s_insertUserName')
			.addClass('nunaliit_login_menu_profile_username')
			.attr('nunaliit-user',_this.currentUserName)
			.appendTo('.nunaliit_login_menu_profile_container');

		if( _this.showService ){
			var $loginMenu = $('.nunaliit_login_menu');
			_this.showService.fixElementAndChildren($loginMenu);
		};
	}

	,_addMenuItems: function(){
		var _this = this;

		var _logoutFn = function(){
			_this.authService.logout();
			return false;
		};

		var _editUserFn = function(){
			_this.authService.editUser({
				userName: null // current user
			});
			return false;
		};

		var _closeMenu = function(){
			_this.dispatchService.synchronousCall(DH,{type: 'closeUserMenu'});
		};

		// Add Edit Account Link
		$('<li>')
			.text(_loc('Edit Account'))
			.click(_closeMenu)
			.click(_editUserFn)
			.appendTo(this.authLoginMenuList);

		if( $('body').hasClass('nunaliit_user_advanced') || $('body').hasClass('nunaliit_user_administrator') ){

			// Add Tools Page Link if admin or advance user
			var toolsPageLink = $('<li></li>')
				.appendTo(this.authLoginMenuList);

			var protocol = window.location.protocol;
			var host = window.location.host;
			const subAtlas = window.location.pathname.slice(0, window.location.pathname.lastIndexOf("/"));
			$('<a>')
				.text(_loc('Tools'))
				.attr('href', protocol + '//' + host + subAtlas + '/tools/index.html')
				.appendTo(toolsPageLink);
		};

		// Add Logout Link
		var logoutLink = $('<li>')
			.appendTo(this.authLoginMenuList);

		$('<a>')
			.text(_loc('Logout'))
			.attr('href','javascript:Logout')
			.click(_closeMenu)
			.click(_logoutFn)
			.appendTo(logoutLink);
	}

	,openUserMenu: function(){
		// Retrieve login Information
		var m = {
			type: 'authCurrentUserDoc'
		};
		this.dispatchService.synchronousCall(DH,m);

		this._addMenuMask();
		this._generateMenu();
		$(this.authLoginMenu).addClass('show_menu');
	}

	,closeUserMenu: function(){
		if( $(this.authLoginMenu).hasClass('show_menu') ){
			$(this.authLoginMenu).removeClass('show_menu');
		};
	}
});

// ===================================================================================

$n2.couchAuth = {
	AuthService: AuthService
	,AuthWidget: AuthWidget
	,AuthWidgetMenu: AuthWidgetMenu
};

})(jQuery,nunaliit2);
