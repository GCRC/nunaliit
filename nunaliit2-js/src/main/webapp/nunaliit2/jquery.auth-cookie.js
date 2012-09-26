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

$Id: jquery.auth-cookie.js 8165 2012-05-31 13:14:37Z jpfiset $
*/

// @requires n2.utils.js
// @requires n2.form.js

;(function($,$n2){

	// Localization
	var _loc = function(str){ return $n2.loc(str,'nunaliit2-couch'); };

// === AUTH ====================================	

	var loginFormSchema = new $n2.form.Schema({
		attributes: [
			{
				name: 'user'
				,label: _loc('E-mail')
				,type: 'text'
			}
			,{
				name: 'password'
				,label: _loc('Password')
				,type: 'password'
			}
		]
		,buttons: [
			{ name: 'ok', label: _loc('OK') }
			,{ name: 'cancel', label: _loc('Cancel') }
		]
	});

	var loginFormSchemaWithGuest = new $n2.form.Schema({
		attributes: [
			{
				name: 'user'
				,label: _loc('E-mail')
				,type: 'text'
			}
			,{
				name: 'password'
				,label: _loc('Password')
				,type: 'password'
			}
		]
		,buttons: [
			{ name: 'ok', label: _loc('OK') }
			,{ name: 'cancel', label: _loc('Cancel') }
			,{ name: 'anonym', label: _loc('Guest Login') }
		]
	});

	var index = 0;
	var loginStateListeners = [];

	var addListeners = function(listeners) {
		var cUser = getCurrentUser();
		
		if( typeof listeners == "function" ) {
			addListener(listeners);
			
		} else if( listeners.constructor == Array ) {
			for(var loop=0; loop<listeners.length; ++loop) {
				var listener = listeners[loop];
				addListener(listener);
			};
		};
		
		function addListener(listener) {
			loginStateListeners.push(listener);
			try {
				listener(cUser);
			} catch(e) {
				log('$.NUNALIIT_AUTH: EXCEPTION caught in listener (add): '+e);
			};
		};
	};

	var notifyListeners = function() {
		var user = getCurrentUser();
		for(var loop=0; loop<loginStateListeners.length; ++loop) {
			var listener = loginStateListeners[loop];
			if( listener ) {
				try {
					listener(user);
				} catch(e) {
					log('$.NUNALIIT_AUTH: EXCEPTION caught in listener (notify): '+e);
				};
			};
		};
	};
	
	var _userLogin = function(options, anonymousFlag, username, password) {
		
		function doLogin() {
			$.ajax({
				type: 'GET'
				,url: options.url + '/login'
				,dataType: 'json'
				,data: {
					name: username
					,password: password
				}
				,async: true
				,success: onSuccess
				,error: onError
			});
		};
		
		var loginRetries = 0;
		var loginRetryLimit = 3;
		/*
		 * @return: true => login retry initiated.
		 */
		function retryLogin() {
			loginRetries++;
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
				message: 'Invalid e-mail and/or password'
			};
			if (null != causeObj) {
				err.cause = causeObj;
			};
			clearLoginForm();
			options.onError(err,options);
			notifyListeners();
		};
		
		function onSuccess(result) {

			log("Login successful",result,options);
			
			if( result && result.logged ) {
			
				clearLoginForm();
				options.onSuccess(result,options);
				notifyListeners();

			} else {
				doErrorNotification(null);
			};
		};
		
		function onError(xmlHttpRequest, textStatus, errorThrown) {
			log("Login error", xmlHttpRequest, textStatus, errorThrown);
			doErrorNotification({ message: textStatus });
		};
		
		if( anonymousFlag ) {
			username = options.anonymousUser;
			password = options.anonymousPw;
		};
		doLogin();
	};
	
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
			acc.push('<Unknown error>');
		};
		
		alert(acc.join(''));
	};
	
	var initOptions = {};
	var defaultOptions = {
		onSuccess: function(result,options) {}
		,onError: defaultError
		,anonymousLoginAllowed: false
		,anonymousUser: 'anonymous'
		,anonymousPw: 'anonymous'
		,autoAnonymousLogin: false
		,prompt: 'Please login'
		,url: './auth'
	};

	/**
	 * This function should be called when a page is first loading.
	 * It performs a special version of 'login' where 401 is never
	 * returned. This allows to adjust the cookie in case the authentication
	 * was lost but the cookie was not. This happens in certain cases
	 * where the browser crashes.
	 *
	 * In the case of autoAnonymousLogin, this function also ensures that the
	 * identified anonymous user is logged in before returning.  This is used to ensure
	 * that the application has basic access to the server database before full application
	 * initialization is launched.  Technically, this could be done in the callback but
	 * that would mean every application desiring that service would need to write a
	 * callback to initiate a login and this seems like a useful service to provide
	 * here.  To make autoAnonymousLogin behave as if the user has not logged in, because
	 * they are unaware that it has happened, this needs to retain some logic concerning
	 * the option anyway (e.g., whether or not to show the guest login button which serves
	 * no purpose if auto anonymous login is being maintained) so it may
	 * as well live here.
	 *
	 * Note that the callbacks (onSuccess, onError) in the initOptions are
	 * really specific to the init (for example, in many cases triggering application
	 * initilization once database access is ready) and should NOT be maintained
	 * as callbacks for use by all auth interactions.  So on a init completion, 
	 * these callback options are deleted.  The other auth interfaces (login,
	 * logout) can include context specific callbacks as parameters when needed.
	 * 
	 * Similarly, once auth listeners are added, they are deleted from the initOptions.
	 *
	 * The interface to the auth package is still flexible enough:
	 * 1) Other interfaces include options and can include call-specific callbacks as
	 *    needed.
	 * 2) Listeners can be added post-initialization using the addListener() interface.
	 */
	var init = function(options_) {
		
		initOptions = $.extend({},defaultOptions,options_);
		
		// Install login state listeners - don't retain as stored options.
		if( initOptions.listeners ) {
			addListeners(initOptions.listeners);
			delete initOptions.listeners;
		};
		
		/*
		 * carry either default or provided fns for onSuccess or onError
		 * and remove these from the stored options ... they are usually
		 * not appropriate for use as login and logout callbacks.
		 */
		var initOnSuccess = initOptions.onSuccess;
		delete initOptions.onSuccess;
		var initOnError = initOptions.onError;
		delete initOptions.onError;
		
		var optWithCallbacks = $.extend({}, // use this as init callback
			initOptions,
			{
				onSuccess: initOnSuccess
				,onError: initOnError
			}
		);
		
		$.ajax({
			type: 'GET'
			,url: initOptions.url + '/adjust'
			,dataType: 'json'
			,async: true
			,success: onSuccess
			,error: onError
		});
				
		function onSuccess(result) {
			$n2.log("Login(adjustCookies) successful", result, initOptions);
			if( false == result.logged && initOptions.autoAnonymousLogin ) {
				/*
				 * auto login will do notifications when appropriate so it is alright
				 * to skip notifyListeners() in this case.
				 */
				_userLogin(optWithCallbacks, true);
			} else {
				initOnSuccess(result, optWithCallbacks);
				notifyListeners();
			};
		};
		
		function onError(xmlHttpRequest, textStatus, errorThrown) {
			log("Login(adjustCookies) error", xmlHttpRequest, textStatus, errorThrown);
			
			if (initOptions.autoAnonymousLogin) { // auto login will do notifications when appropriate
				_userLogin(optWithCallbacks, true);
			} else {
				var err = {
					message: 'Problem initializing authentication library'
					,cause: {
						message: textStatus
					}
				};
				initOnError(err, optWithCallbacks);
				notifyListeners();
			};
		};
	};
	
	var autoAnonLogin = function(options_) {
		var options = $.extend({}, defaultOptions, initOptions, options_);
		_userLogin(options, true);
	};
		
	var showLoginForm = function(options_) {
		
		var options = $.extend({}, defaultOptions, initOptions, options_);
		
		var myIndex = index;
		++index;
		options.index = myIndex;
		
		var $dialog = $('<div></div>');
		options.dialog = $dialog;
		$(document.body).append($dialog);

		var formOptions = {
			buttonPressed: function(loginForm, buttonName){
				if( 'ok' === buttonName ) {
					var user = loginForm.getInputFromName('user').getCurrentValue();
					var password = loginForm.getInputFromName('password').getCurrentValue();

					_userLogin(options, false, user, password);

				} else if( 'cancel' === buttonName ) {
					$dialog.dialog('close');

				} else if( 'anonym' === buttonName ) {
					_userLogin(options, true);
				}
			}
		};

		if( options.anonymousLoginAllowed 
		 && !options.autoAnonymousLogin ) { // no need for guest button if auto logged in
			var $n2Form = loginFormSchemaWithGuest.createForm($dialog,{},formOptions);
		} else {
			var $n2Form = loginFormSchema.createForm($dialog,{},formOptions);
		};
		
		var dialogOptions = {
			autoOpen: true
			,modal: true
			,width: 'auto'
			,close: function(event, ui){
				var diag = $(event.target);
				diag.dialog('destroy');
				diag.remove();
			}
		};
		if( options.prompt ) {
			dialogOptions.title = options.prompt;
		}
		$dialog.dialog(dialogOptions);
	};
	
	var logout = function(options_) {
		
		var options = $.extend({}, defaultOptions, initOptions, options_);

		// Provide bogus credentials in order to wipe the valid
		// ones stored in the browser.
		$.ajax({
			type: 'GET'
			,url: options.url + '/logout'
			,username: '_'
			,password: '_'
			,dataType: 'json'
			,data: {
				name: '_'
			}
			,async: true
			,success: onSuccess
			,error: onError
		});
		
		function onSuccess(result) {

			log("Logout successful",result,options);
			
			if( result && !result.logged ) {
				
				options.onSuccess(result,options);
		
				notifyListeners();

			} else {
				var err = {message:'Error on logout'};
				options.onError(err,options);
				
				notifyListeners();
			};
		};
		
		function onError(xmlHttpRequest, textStatus, errorThrown) {
			log("Logout error", xmlHttpRequest, textStatus, errorThrown);
			
			var err = {
				message:'Error on logout'
				,cause: {
					message: textStatus
				}
			};
			options.onError(err,options);
			
			notifyListeners();
		};
	};
	
	var getCurrentUser = function() {
		var user = null;

		var authContext = getAuthContext();
		if( authContext && authContext.logged ) {
			user = authContext.user;
		};

		return user;
	};

	var getAuthContext = function() {
		var context = null;
		var cookie = $.cookie('nunaliit-auth');

		if( cookie ) {
			eval('context = '+cookie+';');
		};
		
		if( !context ) {
			context = {
				logged: false	
			};
		};
		
		return context;
	};
	
	function isDeleteAllowed() {
		var user = getCurrentUser();
		return(null != user && user.admin); 
	}
	
	function isUpdateAllowed(contribCreatorDisplayName) {
		var allowed = false;
		var user = getCurrentUser();
		if (null != user) {
			if (user.admin) {
				allowed = true;
			} else if (!user.anonymous &&
				"" != contribCreatorDisplayName && // specific case for undefined contributor info
				user.display == contribCreatorDisplayName) {
				allowed = true;
			}
		}
		return(allowed); 
	}
	
	var isLoggedIn = function() {
		var authContext = getAuthContext();
		if( authContext && authContext.logged ) {
			return true;
		};

		return false;
	};
	
	var isUser = function() {
		if( !isLoggedIn() ) return false;
		
		var user = getCurrentUser();
		if( user.anonymous ) return false;
		
		return true;
	};
	
	var isAdmin = function() {
		if( !isLoggedIn() ) return false;
		
		var user = getCurrentUser();
		if( user.admin ) return true;
		
		return false;
	};
	
	var isAnonymous = function() {
		if( !isLoggedIn() ) return false;
		
		var user = getCurrentUser();
		if( user.anonymous ) return true;
		
		return false;
	};
    
	function userLoggedInAndNotAnonymous() {
		var user = getCurrentUser();
		return(null != user && !user.anonymous);
	}
	
	function autoAnonymousBehaviour() {
		return(isDefined(initOptions.autoAnonymousLogin) && initOptions.autoAnonymousLogin);
	}
	
	$.NUNALIIT_AUTH = {
		getUser: getCurrentUser

		,getAuthContext: getAuthContext
		
		,init: init
	
		,login: showLoginForm
		
		,logout: logout
		
		,addListener: addListeners
		
		,isDeleteAllowed: isDeleteAllowed
		
		,isUpdateAllowed: isUpdateAllowed
		
		,isLoggedIn: isLoggedIn
		
		,isUser: isUser
		
		,isAdmin: isAdmin
		
		,isAnonymous: isAnonymous
		
		,userLoggedInAndNotAnonymous: userLoggedInAndNotAnonymous
		
		,autoAnonymousBehaviour: autoAnonymousBehaviour
		
		,autoAnonLogin: autoAnonLogin
	};
})(jQuery,nunaliit2);

