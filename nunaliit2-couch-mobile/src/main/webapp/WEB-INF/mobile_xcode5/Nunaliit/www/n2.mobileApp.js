
		var config = null;
		var mainPage = null;

		// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
		function jqmRefreshPage(){
			if( $.mobile.fixedToolbars ) {
				window.setTimeout(function(){
					//$page.fixHeaderFooter();
					//$.mobile.fixedToolbars.hide(true);
					$.mobile.fixedToolbars.show(true);
				},100);
			};
		};
		
		// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
		function waitForConfiguration(callbackFunction){
			if( null == config ) {
				window.setTimeout(callbackFunction,200);
				return true;
			};
			
			return false;
		};
		
		// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
		function settingsPageSetCurrent(){
			var $input = $(this);

			var connectionId = $input.val();
			
			config.getConnection({
				connectionId: connectionId
				,onSuccess: setConnection
				,onError: function(){
					alert('Unable to retrieve connection');
					settingsPageRefresh();
				}
			});
			
			function setConnection(connection){
				config.setCurrentDb({
					connection: connection
					,onSuccess: settingsPageRefresh
					,onError: function(){
						alert('Unable to set current connection');
						settingsPageRefresh();
					}
				});
			};
		};
		
		// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
		function settingsPageDeleteCurrent(){
			config.deleteCurrentConnection({
				onSuccess: settingsPageRefresh
				,onError: function(){
					alert('Unable to delete current connection');
					settingsPageRefresh();
				}
			});
		};
	
		// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
		function settingsPageRefresh(){
			
			var $list = $('#mobileSettingsPage').find('#mobileSettingsList');
			$list.empty();
			
			var connections = null;
			var currentDb = null;
			
			if( waitForConfiguration(settingsPageRefresh) ) return;
			
			config.getConnections({
				onSuccess: function(conns){
					connections = conns;
					
					if( connections.length < 1 ) {
						$list.html('<p>No servers configured.</p>');
						$list.trigger('create');
						jqmRefreshPage();
						
					} else {
						getCurrent();
					};
				}
			});
			
			function getCurrent() {
				config.getCurrentDb({
					onSuccess: function(currentDb_){
						currentDb = currentDb_;
						display();
					}
					,onError: display
				});
			};
			
			function display(){
				$list.html('<form><div data-role="fieldcontain">'
						+'<fieldset data-role="controlgroup">'
						+'<legend>Database:</legend>'
						+'<fieldset class="mobileSettingsField" data-role="controlgroup"></fieldset>'
						+'</fieldset>'
						+'</fieldset>'
						+'</div></form>');
				var $field = $list.find('.mobileSettingsField');
				
				var currentConnectionId = null;
				if(currentDb) {
					currentConnectionId = currentDb.getConnection().getConnectionId();
				};
				
				var radioName = $n2.getUniqueId();
				for(var i=0,e=connections.length; i<e; ++i){
					var connection = connections[i];
					var connectionId = connection.getConnectionId();
					var connectionLabel = connection.getLabel();
					var isCurrent = ( connectionId === currentConnectionId );
					var radioId = $n2.getUniqueId();
					
					$field.append( $('<input class="mobileSettingsRadio" type="radio" name="'+radioName
							+'" id="'+radioId
							+'" value="'+connectionId+'"'
							+(isCurrent?' checked="checked"':'')
							+'/><label for="'+radioId+'">'
							+connectionLabel+'</label>') );
				};
				
				$list.find('.mobileSettingsRadio').bind('change',settingsPageSetCurrent);
				$list.trigger('create');
				jqmRefreshPage();
			};
		};
		
		// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
		function removeDatabasePageRefresh(){

			if( waitForConfiguration(removeDatabasePageRefresh) ) return;
			
			config.getCurrentConnection({
				onSuccess: function(currentConnection){
					var $span = $('#mobileRemoveDbPage').find('.mobileRemoveDbName');
					$span.text(currentConnection.getLabel());					
				}
			});
		};
		
		// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
		function removeCurrentDatabase(btn_){
			var $okButton = $(btn_);
			var $dialog = $okButton.parents('.ui-dialog');

			$n2.mobile.ShowWaitScreen('Removing Database');

			config.deleteCurrentConnection({
				onSuccess: function(){
					$n2.mobile.HideWaitScreen();
					$dialog.dialog('close');
				}
				,onError: function(err){
					alert('Unable to delete connection: '+err);
					$n2.mobile.HideWaitScreen();
				}
				,onProgress: function(str){
					$n2.mobile.SetWaitMessage(str);
				}
			});
		};
		
		// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
		function synchronizeCurrentDatabase(btn_){
			var $syncButton = $(btn_);
			var $page = $syncButton.parents('.ui-page');

			$n2.mobile.ShowWaitScreen('Synchronizing');
			
			config.syncCurrentConnection({
				onSuccess: function(){
					$n2.mobile.HideWaitScreen();
				}
				,onError: function(err){
					alert('Unable to synchronize connection: '+err);
					$n2.mobile.HideWaitScreen();
				}
				,onProgress: function(str){
					$n2.mobile.SetWaitMessage(str);
				}
			});
		};
		
		// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
		function addDatabasePageRefresh(){
			$('#database_name').focus();
			jqmRefreshPage();
		};

		// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
		function addDatabase(btn_) {
			var $dialog = $('#mobileAddDatabase');

			var dbName = $dialog.find('#database_name').val();
			var serverUrl = $dialog.find('#server_url').val();
			var userName = $dialog.find('#user_name').val();
			var userPassword = $dialog.find('#password').val();

			$n2.mobile.ShowWaitScreen('Adding Database');
			
			config.addDatabase({
				serverUrl: serverUrl
				,remoteDbName: dbName
				,remoteUserName: userName
				,remoteUserPassword: userPassword
				,onSuccess: function(dbConfig){
					$n2.mobile.HideWaitScreen();
					$dialog.dialog('close');
				}
				,onError: function(err){
					alert('Unable to connect to database: '+err);
					$n2.mobile.HideWaitScreen();
				}
				,onProgress: function(str){
					$n2.mobile.SetWaitMessage(str);
				}
			});
			
			return false;
		};

		// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
		function showDebugPage(btn_){
			var $button = $(btn_);
			
			new $n2.mobile.MobileDebugPage({
				config: config
			});
		};
	
		// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
		function main(config_) {
			$n2.log('main',config_);
			config = config_;
			
			mainPage = new $n2.mobile.MainPage({
				config: config
				,pageId: 'mobileMainPage'
			});
		};
		
		// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
		jQuery(document).ready(function() {
			runConfiguration(main);
		});

//		$('#mobileSettingsPage').live('pagebeforeshow',settingsPageRefresh);
//		$('#mobileAddDatabase').live('pagebeforeshow',addDatabasePageRefresh);
//		$('#mobileRemoveDbPage').live('pagebeforeshow',removeDatabasePageRefresh);
		
		$(document).bind('pagebeforeshow',function(e,data){
			var $toPage = $(e.target);
			var id = $toPage.attr('id');

			if( id === 'mobileSettingsPage') {
				settingsPageRefresh(e,data);
			} else if( id === 'mobileAddDatabase') {
				addDatabasePageRefresh(e,data);
			} else if( id === 'mobileRemoveDbPage') {
				removeDatabasePageRefresh(e,data);
			};
		});
		
		// Listen for any attempts to call changePage().
		var viewDocRe = /^.*\/([^\/]*)$/;
		$(document).bind( 'pagebeforechange', function( e, data ) {
			if( typeof(data.toPage) === 'string' ) {
				// Get last portion of URL
				var viewMatched = data.toPage.match(viewDocRe);
				if( viewMatched ) {
					// Is it a 'view document' url?
					var docId = $n2.mobile.MobileViewer.ComputeIdFromUrl(viewMatched[1]);
					if( docId ) {
						// In this mobile app, the only hash changes come
						// from "back buttons. Force the reverse transition.
						if( data 
						 && data.options 
						 && data.options.fromHashChange ) {
							data.options.reverse = true;
						};
	
						config.getCurrentDb({
							onSuccess: function(currentDb_){
								new $n2.mobile.MobileViewer({
									currentDb: currentDb_
									,docId: docId
									,pageOptions: data.options
								});
							}
							,onError: function(){
								alert('Unable to display page. Can not access current DB');
							}
						});
	
						// Prevent default. Viewer will change page
						e.preventDefault();
					};
				};
			};
		});


//  		var loggedPageEvents = [
//  			'pageinit'
//  			,'pagebeforeshow'
//  			,'pageshow'
//  			,'pagebeforecreate'
//  			,'pagecreate'
//  			,'pageload'
//  			,'pagebeforeload'
//  		];
//  		$(':jqmData(role=page)').live(loggedPageEvents.join(' '),function(e){
//  			var $page = $(e.target);
//  			$n2.log('event: '+e.type+' '+$page.attr('id'));
//  		});
