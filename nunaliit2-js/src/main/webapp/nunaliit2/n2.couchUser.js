/*
Copyright (c) 2013, Geomatics and Cartographic Research Centre, Carleton 
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
;(function($,$n2){

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };

function isKeyEditingAllowed(obj, selectors, data) {
	
	if( !selectors ) return false;
	
	if( selectors[0] === '_id' ) return false;
	if( selectors[0] === '_rev' ) return false;
	
	return true;
}

function isValueEditingAllowed(obj, selectors, data) {
	
	if( !selectors ) return false;

	if( selectors[0] === '_id' ) return false;
	if( selectors[0] === '_rev' ) return false;
	
	return true;
};

function isKeyDeletionAllowed(obj, selectors, data) {
	
	if( !selectors ) return false;

	if( selectors[0] === '_id' ) return false;
	if( selectors[0] === '_rev' ) return false;
	
	return true;
};


/*
 * ==============================================================================
 * User Editor
 */
var UserEditor = $n2.Class({
	
	userDoc: null
	
	,userSchema: null
	
	,schemaEditorService: null
	
	,originalDoc: null
	
	,userDb: null
	
	,elemId: null
	
	,schemaEditor: null
	
	,treeEditor: null
	
	,onPreSaveFn: null
	
	,onSavedFn: null

	,onPreDeleteFn: null
	
	,onDeletedFn: null
	
	,onCancelledFn: null
	
	,onFinishedFn: null
	
	,initialize: function(opts_){
		var opts = $n2.extend({
			userDoc: null
			,userDb: null
			,elem: null
			,elemId: null
			,userSchema: null
			,schemaRepository: null
			,schemaEditorService: null
			,onPreSaveFn: function(userDoc){ return true; }
			,onSavedFn: function(userDoc){}
			,onPreDeleteFn: function(userDoc){ return true; }
			,onDeletedFn: function(userDoc){}
			,onCancelledFn: function(userDoc){}
			,onFinishedFn: function(userDoc){}
		},opts_);
		
		var _this = this;
		
		this.userDoc = opts.userDoc;
		this.userDb = opts.userDb;
		this.onPreSaveFn = opts.onPreSaveFn;
		this.onSavedFn = opts.onSavedFn;
		this.onPreDeleteFn = opts.onPreDeleteFn;
		this.onDeletedFn = opts.onDeletedFn;
		this.onCancelledFn = opts.onCancelledFn;
		this.onFinishedFn = opts.onFinishedFn;
		this.schemaEditorService = opts.schemaEditorService;
		
		// Keep version of original document
		this.originalDoc = $n2.extend(true,{},this.userDoc);
		
		// Fix user document
		if( !this.userDoc.nunaliit_emails ){
			this.userDoc.nunaliit_emails = [];
		};
		
		// id
		this.elemId = opts.elemId;
		if( opts.elem ){
			var $elem = $(opts.elem);
			var id = $elem.attr('id');
			if( !id ){
				id = $n2.getUniqueId();
				$elem.attr('id',id);
			};
			this.elemId = id;
		};
		
		// User schema
		if( opts.userSchema ){
			userSchemaLoaded(opts.userSchema);
			
		} else if( opts.schemaRepository ){
			opts.schemaRepository.getSchema({
				name: 'user'
				,onSuccess: function(schema){
					userSchemaLoaded(schema);
				}
				,onError: function(){
					userSchemaLoaded(null);
				}
			});

		} else {
			userSchemaLoaded(null);
		};
		
		function userSchemaLoaded(userSchema){
			_this.userSchema = userSchema;
			
			_this._display();
		};
	}

	,documentUpdated: function(){
		this._refresh();
	}

	,_getElem: function(){
		return $('#'+this.elemId);
	}
	
	,_getCouchServer: function(){
		return this.userDb.server;
	}

	,_display: function(){
		var _this = this;
		
		var doc = this.userDoc;
		
		var $elem = this._getElem();
		$elem.empty();
		
		var $editor = $('<div class="n2UserEdit_editor"></div>')
			.appendTo($elem);
		
		var $editorsContainer = $('<div class="n2UserEdit_editorContainer"></div>')
			.appendTo($editor);
		
		var usingAccordion = false;
		
		if( this.userSchema && this.schemaEditorService ){
			usingAccordion = true;
			$n2.schema.GlobalAttributes.disableKeyUpEvents = true;

			$('<h3><a href="#">'+_loc('Form View')+'</a></h3>').appendTo($editorsContainer);
			var $schemaContainer = $('<div class="n2UserEdit_schemaEditor"></div>')
				.appendTo($editorsContainer);

			this.schemaEditor = this.schemaEditorService.editDocument({
				doc: doc
				,schema: this.userSchema
				,$div: $schemaContainer
				,onChanged: function(){
					if( _this.treeEditor ) {
						_this.treeEditor.refresh();
					};
				}
			});
		};
		
		// Tree editor
		if( usingAccordion ){
			$('<h3><a href="#">'+_loc('Tree View')+'</a></h3>').appendTo($editorsContainer);
		};
		var $treeContainer = $('<div class="n2UserEdit_treeEditor"></div>')
			.appendTo($editorsContainer);
		var objectTree = new $n2.tree.ObjectTree($treeContainer,doc);
		this.treeEditor = new $n2.tree.ObjectTreeEditor(objectTree,doc,{
			onObjectChanged: function() {
				if( _this.schemaEditor ) {
					_this.schemaEditor.refresh();
				};
			}
			,isKeyEditingAllowed: isKeyEditingAllowed
			,isValueEditingAllowed: isValueEditingAllowed
			,isKeyDeletionAllowed: isKeyDeletionAllowed
		});

		if( usingAccordion ){
			$editorsContainer.accordion({
				heightStyle: 'content',
	            autoHeight: false,
		        clearStyle: true	
			});
		};

		var $buttons = $('<div class="n2UserEdit_buttons"></div>')
			.appendTo($editor);

		// Save button
		$('<input type="button"/>')
			.val( _loc('Save') )
			.appendTo($buttons)
			.click(function(){
				_this._save();
				return false;
			});

		// Delete button
		$('<input type="button"/>')
			.val( _loc('Delete') )
			.appendTo($buttons)
			.click(function(){
				_this._delete();
				return false;
			});

		// Roles button
		$('<input type="button"/>')
			.val( _loc('Roles') )
			.appendTo($buttons)
			.click(function(e){
				_this._rolesDialog(doc,function(roles){
					if( roles.length > 0 ){
						doc.roles = roles;
					} else if( doc.roles ) {
						delete doc.roles;
					};
					_this.treeEditor.refresh();
				});
				return false;
			});

		// Password button
		$('<input type="button"/>')
			.val( _loc('Set Password') )
			.appendTo($buttons)
			.click(function(e){
				_this._passwordDialog();
				return false;
			});

		// Cancel button
		$('<input type="button"/>')
			.val( _loc('Cancel') )
			.appendTo($buttons)
			.click(function(e){
				_this._cancel();
				return false;
			});
	}
	
	,_refresh: function(){
		this.treeEditor.refresh();
	}
	
	,_rolesDialog: function(userDoc, selectedRolesFn){
		var diagId = $n2.getUniqueId();
		var $rolesDialog = $('<div id="'+diagId+'" class="n2_roles_dialog"></div>');

		$('<div class="n2_roles_list"></div>')
			.appendTo($rolesDialog)
			.append( $('<div class="olkit_wait"></div>') )
			;

		var $buttons = $('<div class="n2_roles_buttons"></div>')
			.appendTo($rolesDialog)
			;

		// OK button
		$('<input type="button"/>')
			.val( _loc('OK') )
			.appendTo($buttons)
			.click(function(){
				var $dialog = $('#'+diagId);
				
				var roles = [];
				$dialog.find('input[type=checkbox]:checked').each(function(){
					var $input = $(this);
					roles.push( $input.attr('name') );
				});
				
				selectedRolesFn(roles);
				
				$dialog.dialog('close');
			})
			;

		// Cancel button
		$('<input type="button"/>')
			.val( _loc('Cancel') )
			.appendTo($buttons)
			.click(function(){
				$('#'+diagId).dialog('close');
			})
			;
		
		var dialogOptions = {
			autoOpen: true
			,title: _loc('Select Roles')
			,modal: true
			,width: 740
			,close: function(event, ui){
				var diag = $(event.target);
				diag.dialog('destroy');
				diag.remove();
			}
		};
		$rolesDialog.dialog(dialogOptions);
		
		$n2.couchMap.getAllServerRoles({
			couchServer: this._getCouchServer()
			,include_layer_roles: true
			,onSuccess: loadedRoles
			,onError: function(msg){
				loadedRoles([]);
			}
		});
		
		function loadedRoles(roles){
			var roleMap = {};
			for(var i=0,e=roles.length;i<e;++i){
				roleMap[roles[i]] = false;
			};
			
			if( userDoc.roles ){
				for(var i=0,e=userDoc.roles.length;i<e;++i){
					roleMap[userDoc.roles[i]] = true;
				};
			};
			
			roles = [];
			for(var role in roleMap){
				roles.push(role);
			};
			roles.sort();
			
			var $list = $('#'+diagId).find('.n2_roles_list');
			$list.empty();
			
			for(var i=0,e=roles.length;i<e;++i){
				var role = roles[i];
				
				var $div = $('<div></div>');
				
				var id = $n2.getUniqueId();
				
				var $input = $('<input type="checkbox"/>')
					.attr('name',role)
					.attr('id',id)
					.appendTo($div)
					;
				if( roleMap[role] ){
					$input.attr('checked',"checked");
				};
				
				$('<label/>')
					.attr('for',id)
					.text(role)
					.appendTo($div)
					;
				
				$list.append($div);
			};
		};
	}
	
	,_passwordDialog: function(){
		var _this = this;
		
		var diagId = $n2.getUniqueId();
		var $passwordDialog = $('<div id="'+diagId+'" class="n2User_setPassword_dialog"></div>');

		var $passwordInputs = $('<div class="n2User_setPassword_inputs"></div>')
			.appendTo($passwordDialog);
		
		// Password
		var id = $n2.getUniqueId();
		var $div = $('<div></div>')
			.appendTo($passwordInputs);
		$('<label/>')
			.attr('for',id)
			.text( _loc('Enter password:') )
			.appendTo($div);
		$('<input type="password" name="password"/>')
			.attr('id',id)
			.appendTo($div);

		// Confirm
		var id = $n2.getUniqueId();
		var $div = $('<div></div>')
			.appendTo($passwordInputs);
		$('<label/>')
			.attr('for',id)
			.text( _loc('Confirm password:') )
			.appendTo($div);
		$('<input type="password" name="confirm"/>')
			.attr('id',id)
			.appendTo($div);

		// Buttons
		var $buttons = $('<div class="n2User_setPassword_buttons"></div>')
			.appendTo($passwordDialog);

		// OK button
		$('<input type="button"/>')
			.val( _loc('OK') )
			.appendTo($buttons)
			.click(function(){
				var $dialog = $('#'+diagId);
				
				var pw1 = $dialog.find('input[name=password]').val();
				var pw2 = $dialog.find('input[name=confirm]').val();
				
				if( pw1 != pw2 ) {
					alert( _loc('Passwords do not match') );
				} else if( pw1.length < 6 ) {
					alert( _loc('Password is too short') );
				} else {
					_this.userDb.computeUserPassword({
						userDoc: _this.userDoc
						,password: pw1
						,onSuccess: function() {
							_this._refresh();
							$dialog.dialog('close');
						} 
						,onError: function(errMsg){
							alert( _loc('Unable to set password: ') + errMsg);
						}
					});
				};
			});

		// Cancel button
		$('<input type="button"/>')
			.val( _loc('Cancel') )
			.appendTo($buttons)
			.click(function(){
				$('#'+diagId).dialog('close');
			})
			;
		
		var dialogOptions = {
			autoOpen: true
			,title: _loc('Change Password')
			,modal: true
			,width: 740
			,close: function(event, ui){
				var diag = $(event.target);
				diag.dialog('destroy');
				diag.remove();
			}
		};
		$passwordDialog.dialog(dialogOptions);
	}
	
	,_save: function(){
		var _this = this;
		
		this.onPreSaveFn(this.userDoc);

		this.userDb.updateUser({
			user: this.userDoc
			,onSuccess: function(docInfo) {
				_this.userDoc._rev = docInfo.rev;
				
				_this.originalDoc = $n2.extend(true,{},_this.userDoc);
				
				_this._refresh();
				_this.onSavedFn(_this.userDoc);
				_this.onFinishedFn(_this.userDoc);
			} 
			,onError: function(errMsg) {
				alert( _loc('Unable to save user document: ') + errMsg );
			}
		});
	}
	
	,_delete: function(){
		var _this = this;

		if( false == confirm('You are about delete a user configuration object. Do you wish to proceed?') ) {
			return;
		};
		this.onPreDeleteFn(this.userDoc);
		this.userDb.deleteUser({
			user: this.userDoc
			,onSuccess: function() {
				var $elem = _this._getElem();
				$elem.empty();
				_this.onDeletedFn(_this.userDoc);
				_this.onFinishedFn(_this.userDoc);
			} 
			,onError: function(errMsg) {
				alert( _loc('Unable to delete user document: ') + errMsg );
			}
		});
	}
	
	,_cancel: function(){
		// Check if there are changes
		var patch = patcher.computePatch(this.originalDoc,this.userDoc);
		if( patch ){
			// Document was changed
			if( false == confirm( _loc('Document was modified and changes will be lost. Do you wish to continue?') ) ){
				return;
			};
		};
		
		var $elem = this._getElem();
		$elem.empty();

		this.onCancelledFn(this.userDoc);
		this.onFinishedFn(this.userDoc);
	}
});

/*
 * ==============================================================================
 * User Service
 */
var UserService = $n2.Class({
	
	userDb: null
	
	,userServerUrl: null

	,userSchema: null
	
	,schemaRepository: null
	
	,schemaEditorService: null
	
	,initialize: function(opts_){
		var opts = $n2.extend({
			userDb: null
			,userServerUrl: null
			,userSchema: null // optional
			,schemaRepository: null // optional
			,schemaEditorService: null // optional
		},opts_);
		
		this.userDb = opts.userDb;
		this.userServerUrl = opts.userServerUrl;
		this.userSchema = opts.userSchema;
		this.schemaRepository = opts.schemaRepository;
		this.schemaEditorService = opts.schemaEditorService;
	}

	,startEdit: function(opts_){
		var opts = $n2.extend(
			{
				userSchema: this.userSchema
				,schemaRepository: this.schemaRepository
				,schemaEditorService: this.schemaEditorService
			}
			,opts_
			,{
				userDb: this.userDb
			}
		);
		
		return new UserEditor(opts);
	}
	
	,initiateUserCreation: function(opts_){
		var opts = $n2.extend({
			emailAddress: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);

		var url = this.userServerUrl + 'initUserCreation';
		
		$.ajax({
	    	url: url
	    	,type: 'GET'
	    	,async: true
	    	,traditional: true
	    	,data: {
	    		email: opts.emailAddress
	    	}
	    	,dataType: 'json'
	    	,success: function(result) {
	    		if( result.error ) {
	    			opts.onError(result.error);
	    		} else {
	    			opts.onSuccess(result);
	    		};
	    	}
	    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
	    		opts.onError(textStatus);
	    	}
		});
	}
	
	,validateUserCreation: function(opts_){
		var opts = $n2.extend({
			token: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);

		var url = this.userServerUrl + 'validateUserCreation';
		
		$.ajax({
	    	url: url
	    	,type: 'GET'
	    	,async: true
	    	,traditional: true
	    	,data: {
	    		token: opts.token
	    	}
	    	,dataType: 'json'
	    	,success: function(result) {
	    		if( result.error ) {
	    			opts.onError(result.error);
	    		} else {
	    			opts.onSuccess(result);
	    		};
	    	}
	    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
	    		opts.onError(textStatus);
	    	}
		});
	}
	
	,completeUserCreation: function(opts_){
		var opts = $n2.extend({
			token: null
			,displayName: null
			,password: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);

		var url = this.userServerUrl + 'completeUserCreation';
		
		$.ajax({
	    	url: url
	    	,type: 'GET'
	    	,async: true
	    	,traditional: true
	    	,data: {
	    		token: opts.token
				,display: opts.displayName
				,password: opts.password
	    	}
	    	,dataType: 'json'
	    	,success: function(result) {
	    		if( result.error ) {
	    			opts.onError(result.error);
	    		} else {
	    			opts.onSuccess(result);
	    		};
	    	}
	    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
	    		opts.onError(textStatus);
	    	}
		});
	}
});

$n2.couchUser = {
	UserEditor: UserEditor
	,UserService: UserService
};

})(jQuery,nunaliit2);
