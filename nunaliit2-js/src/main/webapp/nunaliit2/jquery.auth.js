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

$Id: jquery.auth.js 8165 2012-05-31 13:14:37Z jpfiset $
*/

// @requires n2.utils.js

;(function($,$n2){
// === AUTH ====================================	

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
				// Ignore
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
					// Ignore
				};
			};
		};
	};
	
	var userLogin = function(options,anonymous) {
		var username, password;
		
		function doLogin() {
			$.ajax({
				type: 'GET'
				,url: options.url + '/login'
				,username: username
				,password: password
				,dataType: 'json'
				,data: {
					name: username
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
		
		function doErrorNotification(causeObj) {
			if (options.autoAnonymousLogin) {
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
			options.onError(err,options);
			notifyListeners();
		};
		
		function onSuccess(result) {

			log("Login successful",result,options);
			
			if( result && result.logged ) {
			
				if (!options.autoAnonymousLogin) { // hide user-visible form...
					$options.dialog.dialog('close');
				};
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
		
		if( anonymous ) {
			username = options.anonymousUser;
			password = options.anonymousPw;
		} else {
			username = $('#nunaliit_auth_name_'+options.index).val();
			password = $('#nunaliit_auth_pw_'+options.index).val();
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
	 */
	var init = function(options_) {
		
		var options = $.extend({},defaultOptions,options_);
		
		// Install login state listeners
		if( options.listeners ) {
			addListeners(options.listeners);
		};
		
		$.ajax({
			type: 'GET'
			,url: options.url + '/login'
			,dataType: 'json'
			,data: {
				adjustCookies: 1
			}
			,async: true
			,success: onSuccess
			,error: onError
		});
		
		function onSuccess(result) {

			log("Login(adjustCookies) successful",result,options);
			if( false == result.logged && options.autoAnonymousLogin ) { // auto login will do notifications when appropriate
				userLogin(options, true);
			} else {
				options.onSuccess(result,options);
				notifyListeners();
			};
		};
		
		function onError(xmlHttpRequest, textStatus, errorThrown) {
			log("Login(adjustCookies) error", xmlHttpRequest, textStatus, errorThrown);
			
			if (options.autoAnonymousLogin) { // auto login will do notifications when appropriate
				userLogin(options, true);
			} else {
				var err = {
					message: 'Problem initializing authentication library'
					,cause: {
						message: textStatus
					}
				};
				options.onError(err,options);
				notifyListeners();
			};
		};
	};
	
	var showLoginForm = function(options_) {
		
		var options = $.extend({},defaultOptions,options_);
		
		var myIndex = index;
		++index;
		options.index = myIndex;
		
		var $dialog = $('<div></div>');
		options.dialog = $dialog;
		
		var data = [];

		data.push('<div class="nunaliit-auth-form">');
		if( options.prompt ) {
			data.push(options.prompt);
		}
		data.push('<br/>E-mail:<input type="text" id="nunaliit_auth_name_'+options.index+'"/>');
		data.push('<br/>Password:<input type="password" id="nunaliit_auth_pw_'+options.index+'"/>');
		data.push('<br/><input type="button" id="nunaliit_auth_login_'+options.index+'" value="Login"/>');
		data.push('<input type="button" id="nunaliit_auth_cancel_'+options.index+'" value="Cancel"/>');
		if( options.anonymousLoginAllowed ) {
			data.push('<br/>Guest login allowed');
			data.push('<br/><input type="button" id="nunaliit_auth_anon_'+options.index+'" value="Guest Login"/>');
		}
		data.push('</div>');
						
		var form = $( data.join('') );
		options.form = form;
		$dialog.append(form);
		
		$('#nunaliit_auth_login_'+options.index).click(function(evt){
			userLogin(options, false);
		});
		$('#nunaliit_auth_cancel_'+options.index).click(function(evt){
			$dialog.dialog('close');
		});
		$('#nunaliit_auth_anon_'+options.index).click(function(evt){
			userLogin(options, true);
		});

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
		
		var options = $.extend({},defaultOptions,options_);

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
	
	/**
	 * This call test accessing a protected resource on the server.
	 * It is not a method that should be used in production systems.
	 */
	var performTest = function(options_) {
		
		var options = $.extend({},defaultOptions,options_);

		$.ajax({
			type: 'GET'
			,url: options.url + '/test'
			,dataType: 'json'
			,async: true
			,success: onSuccess
			,error: onError
		});
		
		function onSuccess(result) {

			log("Test successful",result,options);
			
			if( result && result.logged ) {
				
				options.onSuccess(result,options);
		
				notifyListeners();

			} else {
				var err = {message: 'Test failure'};
				options.onError(err,options);
				
				notifyListeners();
			};
		};
		
		function onError(xmlHttpRequest, textStatus, errorThrown) {
			log("Test error", xmlHttpRequest, textStatus, errorThrown);
			
			var err = {
				message: 'Test failure'
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
	
	function userLoggedInAndNotAnonymous() {
		var user = getCurrentUser();
		return(null != user && !user.anonymous);
	}
	
	$.NUNALIIT_AUTH = {
		getUser: getCurrentUser

		,getAuthContext: getAuthContext
		
		,init: init
	
		,login: showLoginForm
		
		,logout: logout
		
		,test: performTest
		
		,addListener: addListeners
		
		,isDeleteAllowed: isDeleteAllowed
		
		,isUpdateAllowed: isUpdateAllowed
		
		,userLoggedInAndNotAnonymous: userLoggedInAndNotAnonymous
	};
})(jQuery,nunaliit2);