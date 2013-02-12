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
	
var AuthService = $n2.Class({
	options: null

	,loginStateListeners: null
	
	,lastAuthSessionCookie: null
	
	,initialize: function(options_){
		var _this = this;
		
		this.options = $n2.extend(
			{}
			,defaultOptions
			,{
				autoRefresh: true
				,refreshIntervalInSec: 120 // 2 minutes
			}
			,options_
		);
		
		this.loginStateListeners = [];
		this.lastAuthSessionCookie = null;
		
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
			_this.notifyListeners()
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
				type: 'login'
				,user: user
			});
		} else {
			this._dispatch({
				type: 'logout'
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
		
		function onError(xmlHttpRequest, textStatus, errorThrown) {
			$n2.log('Login error', xmlHttpRequest, textStatus, errorThrown);
			doErrorNotification({ message: textStatus });
		};
		
		if( anonymousFlag ) {
			username = options.anonymousUser;
			password = options.anonymousPw;
		};
		doLogin();
	}
	
	,autoAnonLogin: function(options_) {
		var options = $n2.extend({}, defaultOptions, this.options, options_);
		this._userLogin(options, true);
	}
	
	,createLoginDialog: function(dialogId, options){
		var _this = this;
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
				_this.createUserCreationDialog(dialogId, options);
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
			_this._userLogin(options, false, user, password);
		};
	}
	
	,createUserCreationDialog: function(dialogId, options){
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
				_this.createLoginDialog(dialogId, options);
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
					_this._userLogin(options, false, user, password);
				}
				,onError: function(err){
					alert( _loc('Unable to create user: ')+err);
				}
			});
		};
	}
		
	,showLoginForm: function(options_) {
		var options = $.extend({}, defaultOptions, this.options, options_);

		var dialogId = $n2.getUniqueId();
		var $dialog = $('<div id="'+dialogId+'"></div>');
		options.dialog = $dialog;
		$(document.body).append($dialog);
		
		this.createLoginDialog(dialogId, options);
		
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
		
	}
	
	,logout: function(options_) {
		var _this = this;
		var options = $.extend({}, defaultOptions, this.options, options_);

		$n2.couch.getSession().logout({
			onSuccess: onSuccess
		});
		
		function onSuccess(result) {

			$n2.log("Logout successful",result,options);
			
			options.onSuccess(result,options);
		
			_this.notifyListeners();
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
		if( this.options.directory ){
			showService = this.options.directory.showService;
		};
		
		var opts = $n2.extend({
			elemId: null
			,authService: this
			,showService: showService
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
	
	,_dispatch: function(m){
		var dispatcher = this._getDispatcher();
		if( dispatcher ){
			var h = dispatcher.getHandle('n2.couchAuth');
			dispatcher.send(h,m);
		};
	}
});	

//===================================================================================

var AuthWidget = $n2.Class({
	options: null
	
	,initialize: function(options_){
		this.options = $n2.extend({
			elemId: null
			,authService: null
			,showService: null
		},options_);
		
		var _this = this;
		
		var authService = this.getAuthService();
		if( authService ){
			authService.addListeners(function(currentUser){
				_this._loginStateChanged(currentUser);
			});
		};
	}

	,getWidgetElem: function(){
		if( this.options.elemId ){
			return $('#'+this.options.elemId);
		};
		
		return $('#n2AuthDummy'); // return empty set
	}

	,getAuthService: function(){
		return this.options.authService;
	}

	,getShowService: function(){
		return this.options.showService;
	}

	,_loginStateChanged: function(currentUser) {

		var $login = this.getWidgetElem();
		if( $login.length < 1 ) return;
		$login.empty();
		
		var showService = this.getShowService();
		
		var authService = this.getAuthService();
		if( authService ) {
			if( null == currentUser ) {
				var aElem = $('<a class="loginLink" href="javascript:Login"></a>');
				aElem.text( _loc('Login') );
				aElem.click(function(){
					authService.showLoginForm();
					return false;
				});
				var nameElem = $('<span class="loginGreeting"></span>');
				nameElem.text( _loc('Welcome') );
				$login.append(aElem).append(nameElem);
	
			} else {
				var aElem = $('<a class="loginLink" href="javascript:Logout"></a>');
				aElem.text( _loc('Logout') );
				aElem.click(function(){
					authService.logout();
					return false;
				});
				var display = currentUser.display;
				if( !display ) display = currentUser.name;
				var nameElem = $('<span class="loginGreeting"></span>');
				nameElem.text( display );
				$login.append(aElem).append(nameElem);
			};
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
		return $n2.couchAuth._defaultAuthService.getAuthContext()
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

