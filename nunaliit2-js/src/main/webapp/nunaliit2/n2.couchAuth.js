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
	var _loc = function(str){ return $n2.loc(str,'nunaliit2-couch'); };

// === AUTH ====================================	

	var index = 0;
	var loginStateListeners = [];
	var lastAuthSessionCookie = null;

	var addListeners = function(listeners) {
		var cUser = getCurrentUser();
		
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
			_dispatch({
				type: 'login'
				,user: user
			});
		} else {
			_dispatch({
				type: 'logout'
			});
		};
		
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
		var loginRetries = 0
			,loginRetryLimit = 3;
		
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

			var context = $n2.couch.getSession().getContext();

			log("Login successful",context,options);
			
			if( context && context.name ) {
			
				clearLoginForm();
				options.onSuccess(context,options);
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
		,prompt: _loc('Please login')
		,userString: _loc('user name')
		,directory: null
	};

	/**
	 * This function should be called when a page is first loading.
	 * This allows to adjust the internal settings based on the 
	 * current authentication cookie.
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
		
		initOptions = $.extend(
			{}
			,defaultOptions
			,{
				autoRefresh: true
				,refreshIntervalInSec: 120 // 2 minutes
			}
			,options_
		);
		
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

		$n2.couch.getSession().refreshContext({
			onSuccess: onSuccess
			,onError: onError
		});		

		$n2.couch.getSession().addChangedContextListener(notifyListeners);
		
		if( initOptions.autoRefresh
		 && initOptions.refreshIntervalInSec > 0
		 && typeof(setInterval) === 'function' ) {
			setInterval(
				function(){
					$n2.couch.getSession().refreshContext({
						onError: function(){} // ignore
					});
				}
				,(1000 * initOptions.refreshIntervalInSec) // expressed in ms
			);
			
			
			setInterval(
				function(){
					var cookie = $n2.cookie.getCookie('NunaliitAuth');
					if( cookie !== lastAuthSessionCookie ) {
						lastAuthSessionCookie = cookie;
						$n2.couch.getSession().refreshContext({
							onError: function(){} // ignore
						});
					};
				}
				,2000 // 2 seconds
			);
		};

		function onSuccess(context) {
			$n2.log("Login(adjustCookies) successful", context, initOptions);
			if( !context.name && initOptions.autoAnonymousLogin ) {
				/*
				 * auto login will do notifications when appropriate so it is alright
				 * to skip notifyListeners() in this case.
				 */
				_userLogin(optWithCallbacks, true);
			} else {
				initOnSuccess(context, optWithCallbacks);
				notifyListeners();
			};
		};
		
		function onError(error) {
			log('Login(adjustCookies) error: '+error);
			
			if (initOptions.autoAnonymousLogin) { // auto login will do notifications when appropriate
				_userLogin(optWithCallbacks, true);
			} else {
				var err = {
					message: 'Problem initializing authentication library'
					,cause: {
						message: error
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
	
	function createLoginDialog(dialogId, options){
		var $dialog = $('#'+dialogId);
		
		$dialog.html( ['<div class="n2Auth_login">'
			,'<div class="n2Auth_login_user_line">'
			,'<div class="n2Auth_login_label"></div>'
			,'<div class="n2Auth_login_input"><input class="n2Auth_user_input n2Auth_input_field" type="text"/></div>'
			,'<div class="n2Auth_login_end"></div>'
			,'</div>'
			,'<div class="n2Auth_login_pw_line">'
			,'<div class="n2Auth_login_label"></div>'
			,'<div class="n2Auth_login_input"><input class="n2Auth_pw_input n2Auth_input_field" type="password"/></div>'
			,'<div class="n2Auth_login_end"></div>'
			,'</div>'
			,'<div class="n2Auth_login_button_line">'
			,'<button class="n2Auth_button_login"></button>'
			,'<button class="n2Auth_button_cancel"></button>'
			,'<div class="n2Auth_login_end"></div>'
			,'</div>'
			,'<div class="n2Auth_login_create_line">'
			,'<a class="n2Auth_button_createUser" href="#"></a>'
			,'<div class="n2Auth_login_end"></div>'
			,'</div>'
			,'</div>'].join('') );
		
		$dialog.find('.n2Auth_login_user_line .n2Auth_login_label').text( _loc('user name') );
		$dialog.find('.n2Auth_login_pw_line .n2Auth_login_label').text( _loc('password') );
		
		$dialog.find('.n2Auth_button_login')
			.text( _loc('Login') )
			.button({icons:{primary:'ui-icon-check'}})
			.click(function(){
				performLogin();
				return false;
			});
		$dialog.find('.n2Auth_button_cancel')
			.text( _loc('Cancel') )
			.button({icons:{primary:'ui-icon-cancel'}})
			.click(function(){
				var $dialog = $('#'+dialogId);
				$dialog.dialog('close');
			});
		$dialog.find('.n2Auth_button_createUser')
			.text( _loc('Create a new user') )
			.click(function(){
				createUserCreationDialog(dialogId, options);
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
				performLogin();
			};
		});
		
		if( options.prompt ) {
			$dialog.dialog('option','title',options.prompt);
		} else {
			$dialog.dialog('option','title',_loc('Please login'));
		};
		
		function performLogin(){
			var $dialog = $('#'+dialogId);
			var user = $dialog.find('.n2Auth_user_input').val();
			var password = $dialog.find('.n2Auth_pw_input').val();
			_userLogin(options, false, user, password);
		};
	};
	
	function createUserCreationDialog(dialogId, options){
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
				createLoginDialog(dialogId, options);
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
					_userLogin(options, false, user, password);
				}
				,onError: function(err){
					alert( _loc('Unable to create user: ')+err);
				}
			});
		};
	};
		
	var showLoginForm = function(options_) {
		var options = $.extend({}, defaultOptions, initOptions, options_);

		var myIndex = index;
		++index;
		options.index = myIndex;
		
		var dialogId = $n2.getUniqueId();
		var $dialog = $('<div id="'+dialogId+'"></div>');
		options.dialog = $dialog;
		$(document.body).append($dialog);
		
		createLoginDialog(dialogId, options);
		
		var dialogOptions = {
			autoOpen: true
			,modal: true
			,width: 'auto'
			,close: function(event, ui){
				var diag = $('#'+dialogId);
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

		$n2.couch.getSession().logout({
			onSuccess: onSuccess
		});
		
		function onSuccess(result) {

			log("Logout successful",result,options);
			
			options.onSuccess(result,options);
		
			notifyListeners();
		};
	};
	
	var getCurrentUser = function() {
		var context = getAuthContext();

		if( null == context.name ) {
			return null;
		}
		if( context.userDoc ) {
			return context.userDoc;
		}

		return context;
	};

	var getAuthContext = function() {
		return $n2.couch.getSession().getContext();
	};
	
	function isDeleteAllowed() {
		return isAdmin(); 
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
		if( authContext && authContext.name ) {
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
		if( !user.roles ) return false;

		// Check if _admin role is present
		for(var i=0,e=user.roles.length; i<e; ++i) {
			if( user.roles[i] === '_admin' ) {
				return true;
			};
		};		
		
		return false;
	};
	
	var isAnonymous = function() {
		if( !isLoggedIn() ) return false;
		
		var user = getCurrentUser();

		// Check if anonymous role is present
		for(var i=0,e=user.roles.length; i<e; ++i) {
			if( user.roles[i] === 'anonymous' ) {
				return true;
			};
		};		
		
		return false;
	};
    
	function userLoggedInAndNotAnonymous() {
		if( !isLoggedIn() ) return false;
		if( isAnonymous() ) return false;

		return true;
	}
	
	function autoAnonymousBehaviour() {
		return(isDefined(initOptions.autoAnonymousLogin) && initOptions.autoAnonymousLogin);
	}
	
	function _getDispatcher(){
		var d = null;
		if( initOptions.directory ){
			d = initOptions.directory.dispatchService;
		};
		return d;
	};
	
	function _dispatch(m){
		var dispatcher = _getDispatcher();
		if( dispatcher ){
			var h = dispatcher.getHandle('n2.couchAuth');
			dispatcher.send(h,m);
		};
	};
	
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

