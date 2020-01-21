;(function($,$n2){
"use strict";
	
	// Localization
	var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };
	
	var uploadDiv = null;
	var config = null;
	var atlasDb = null;
	var atlasDesign = null;
	var serverDesign = null;
	var dispatcher = null;
	var requestService = null;
	var attachmentService = null;
	var currentView = 'approval';
	var limit = 10;
	var currentlyViewedMedia = [];
	var currentDocumentsShowing = {};
	
	function selectionChanged() {
		var $select = $(this).find('li.mdc-list-item--selected');
		currentView = $select.attr('data-value');
		refreshView();
	};
	
	function limitChanged(){
		var $select = $(this).find('li.mdc-list-item--selected');
		var limitStr = $select.attr('data-value');
		limit = 1 * limitStr;
		refreshView();
	}
	
	function markMedia(doc, attachmentName, status) {
		
		var att = attachmentService.getAttachment(doc, attachmentName);
		if( att ){
			att.changeStatus(status);
			$n2.couchDocument.adjustDocument(doc);
		};
	};
	
	function _getSelectedUploads(){
		var $table = $('.uploadsTable');
	
		// Find work to be done
		var selected = {};
		$table.find('.upload_selected').each(function(){
			var $cb = $(this);
			var checked = $cb.is(':checked');
			if( checked ){
				var $tr = $cb.parents('.upload_line');
				var docId = $tr.attr("data-docid");
				var attachmentName = $tr.attr('data-att');
				
				if( !selected[docId] ) {
					selected[docId] = {};
				};
				if( !selected[docId][attachmentName] ) {
					selected[docId][attachmentName] = true;
				};
			};
		});
		
		return selected;
	};
	
	function _approveDenySelection(selected,status){
		
		$('.uploadButton').attr('disabled','disabled');
	
		// Get all documents to approve
		var docIds = [];
		for(var docId in selected){
			docIds.push(docId);
		};
		
		if( docIds.length < 1 ){
			$('.uploadButton').removeAttr('disabled');
			return;
		};
	
		atlasDb.getDocuments({
			docIds: docIds
			,onSuccess: function(docs){
				markAllMedia(docs, selected);
			}
			,onError: function(err){
				alert('Unable to retrieve documents for approval/denial: '+err);
				$('.uploadButton').removeAttr('disabled');
			}
		});
		
		return false;
		
		function markAllMedia(docs, selected){
			// Create document dictionary
			var docsById = {};
			for(var i=0,e=docs.length; i<e; ++i){
				var doc = docs[i];
				docsById[doc._id] = doc;
			};
	
			for(var docId in selected){
				var attachments = selected[docId];
				var doc = docsById[docId];
				for(var attachmentName in attachments){
					markMedia(doc, attachmentName, status);
				};
			};
			
			// Clean up documents
			docs.forEach(function(doc){
				var keysToDelete = [];
				for(var key in doc){
					if( key.length >= 2 
					 && key[0] === '_' 
					 && key[1] === '_' ){
						keysToDelete.push(key);
					};
				};
				keysToDelete.forEach(function(key){
					delete doc[key];
				});
			});
			
			atlasDb.bulkDocuments(docs, {
				onSuccess: function(docInfos){
					// done
					$('.uploadButton').removeAttr('disabled');
					refreshView();
					if( docInfos && docInfos.length ) {
						for(var i=0,e=docInfos.length; i<e; ++i){
							var docInfo = docInfos[i];
							if( docInfo.error ) {
								alert('Error saving documents: '+docInfo.error);
								break;
							};
						};
					};
				}
				,onError: function(err){
					alert('Error saving documents: '+err);
					$('.uploadButton').removeAttr('disabled');
					refreshView();
				}
			});
		};
	};
	
	function _selectAll(){
		
		var $table = $('.uploadsTable');
		
		var allChecked = true;
		$table.find('.upload_selected').each(function(){
			var $cb = $(this);
			var checked = $cb.is(':checked');
			if( !checked ){
				allChecked = false;
			};
		});
		
		if( allChecked ) {
			// uncheck all
			$table.find('.upload_selected').each(function(){
				var $cb = $(this);
				$cb.removeAttr('checked');
			});
		} else {
			// check all
			$table.find('.upload_selected').each(function(){
				var $cb = $(this);
				$cb.attr('checked','checked');
			});
		};
		
		refreshToolbar();
		
		return false;
	};
	
	function refreshToolbar(){
		var btnLineId = $n2.getUniqueId();
		var $btnLine = $('.uploadButtonLine')
			.attr('id', btnLineId);
	
		var $select = $btnLine.find('.uploadViewSelect');
		if( $select.length < 1 ) {
			
			var uploadTypeSelect = new $n2.mdc.MDCSelect({
				parentElem: $btnLine,
				menuChgFunction: selectionChanged,
				menuLabel: 'Upload Type',
				menuOpts: [
					{
						value: "approval",
						text: "Pending Approval"
					}, 
					{
						value: "denied",
						text: "Already Denied"
					}
				]
			});
	
			$('#' + uploadTypeSelect.getSelectId()).addClass('uploadViewSelect');
		};
	
		var $limit = $btnLine.find('.uploadLimitSelect');
		if( $limit.length < 1 ){
	
			var limitSelect = new $n2.mdc.MDCSelect({
				parentElem: $btnLine,
				menuChgFunction: limitChanged,
				menuLabel: 'Limit',
				menuOpts: [
					{
						value: "10",
						text: "Limit 10"
					},
					{
						value: "25",
						text: "Limit 25"
					},
					{
						value: "50",
						text: "Limit 50"
					},
					{
						value: "100",
						text: "Limit 100"
					},
					{
						value: "-1",
						text: "No Limit"
					}
				]
			});
	
			$('#' + limitSelect.getSelectId()).addClass('uploadLimitSelect');
		};
	
		var $approveSelected = $btnLine.find('.uploadApproveSelectedButton');
		if( $approveSelected.length < 1 ) {
			new $n2.mdc.MDCButton({
				parentElem: $btnLine,
				mdcClasses: ['uploadButton', 'uploadApproveSelectedButton'],
				btnLabel: 'Approve Selected',
				btnRaised: true,
				onBtnClick: function(){
					var selection = _getSelectedUploads();
					_approveDenySelection(selection, 'approved');
					return false;
				}
			});
		};
	
		var $denySelected = $btnLine.find('.uploadDenySelectedButton');
		if( $denySelected.length < 1 ) {
			new $n2.mdc.MDCButton({
				parentElem: $btnLine,
				mdcClasses: ['uploadButton', 'uploadDenySelectedButton'],
				btnLabel: 'Deny Selected',
				btnRaised: true,
				onBtnClick: function(){
					var selection = _getSelectedUploads();
					_approveDenySelection(selection, 'denied');
					return false;
				}
			});
		};
	
		var $selectAllButton = $btnLine.find('.uploadSelectAllButton');
		if( $selectAllButton.length < 1 ) {
			new $n2.mdc.MDCButton({
				parentElem: $btnLine,
				mdcClasses: ['uploadButton', 'uploadSelectAllButton'],
				btnLabel: 'Selected All',
				btnRaised: true,
				onBtnClick: _selectAll
			});
		};
	
		// Update selection button
		var $table = $('.uploadsTable');
		var anyCheckBox = false;
		var anyChecked = false;
		var allChecked = true;
		$table.find('.upload_selected').each(function(){
			var $cb = $(this);
			
			anyCheckBox = true;
			
			var checked = $cb.is(':checked');
			if( checked ){
				anyChecked = true;
			} else {
				allChecked = false;
			};
		});
		if( anyCheckBox ){
			$selectAllButton.removeAttr('disabled');
		} else {
			$selectAllButton.attr('disabled','disabled');
		};
		if( anyCheckBox && allChecked ) {
			$selectAllButton.text('Deselect All');
		} else {
			$selectAllButton.text('Select All');
		};
		if( anyChecked ){
			$approveSelected.removeAttr('disabled');
			$denySelected.removeAttr('disabled');
		} else {
			$approveSelected.attr('disabled','disabled');
			$denySelected.attr('disabled','disabled');
		};
	};
	
	function displayRowFromDocument(trId, doc, attachmentName){
		var $tr = $('#'+trId);
		
		var docId = doc._id;
		
		var att = attachmentService.getAttachment(doc, attachmentName);
		
		// Details
		var $td = $tr.find('td.upload_body');
		if( $td.length > 0 ) {
			$td.empty();
			
			var $div = $('<div></div>');
			$div.text(docId);
			$td.append($div);
			
			$div = $('<div></div>');
			$td.append($div);
			new $n2.tree.ObjectTree($div, doc);
		};
		
		if( att ) {
	
			// Media
			var $td = $tr.find('td.upload_att');
			$td.empty();
	
			var $spanName = $('<span></span>');
			$spanName.text(attachmentName);
			$td.append( $spanName );
			$td.append( $('<br/>') );
	
			var attOriginal = att.getOriginalAttachment();
			if( attOriginal && attOriginal.getMediaFileUrl() ) {
				$('<a>')
					.attr('href',attOriginal.getMediaFileUrl())
					.text( _loc('Original') )
					.appendTo($td);
				$('<br>').appendTo($td);
			}
			
			if( att.getMediaFileUrl() ) {
				$('<a>')
					.attr('href',att.getMediaFileUrl())
					.text( _loc('Converted') )
					.appendTo($td);
				$('<br>').appendTo($td);
			}
	
			var attThumb = att.getThumbnailAttachment();
			if( attThumb && attThumb.getMediaFileUrl() ) {
				$('<img>')
					.attr('src',attThumb.getMediaFileUrl())
					.appendTo($td);
				$('<br>').appendTo($td);
			}
		} else {
			// Can not find the attachment
			$tr.remove();
		};
	};
	
	function displayRowFromDocId(trId, docId, attachmentName){
		requestService.requestDocument(docId,function(doc){
			displayRowFromDocument(trId, doc, attachmentName);
		});
	};
	
	function showUploads(arr) {
		
		// Create table if it does not exist
		var $table = $('.uploadsTable');
		if( $table.length < 1 ) {
			var $table = $('<table class="uploadsTable"></table>');
			$('.uploadData').empty().append($table);
			
			$table.append('<tr class="upload_header"><th>Details</th><th>Media</th><td class="upload_header_buttons"></td></tr>');
		};
		
		// Remove no media warning
		$table.find('.uploadNoMedia').remove();
		
		// Compile what we should be showing
		currentDocumentsShowing = {};
		for(var i=0,e=arr.length; i<e; ++i) {
			var row = arr[i];
			var docId = row.id;		
			var attachmentName = row.key;
			
			if( !currentDocumentsShowing[docId] ){
				currentDocumentsShowing[docId] = {};
			};
			if( !currentDocumentsShowing[docId][attachmentName] ){
				currentDocumentsShowing[docId][attachmentName] = true;
			};
		};
		
		// Remove entries that should no longer be shown
		var count = 0;
		$table.find('.upload_line').each(function(){
			var $tr = $(this);
			var docId = $tr.attr('data-docid');
			var attachmentName = $tr.attr('data-att');
			
			if( !currentDocumentsShowing[docId] ){
				$tr.remove();
			} else if( !currentDocumentsShowing[docId][attachmentName] ){
				$tr.remove();
			} else {
				++count;
			};
		});
		
		// Add entries that should be shown
		for(var docId in currentDocumentsShowing){
			var attachments = currentDocumentsShowing[docId];
			for(var attachmentName in attachments){
				var $entries = $table.find(
					'.upload_'+$n2.utils.stringToHtmlId(docId)+'_'+$n2.utils.stringToHtmlId(attachmentName)
				);
				if( $entries.length < 1 ){
					// Add this one
					var trId = $n2.getUniqueId();
					var $tr = $('<tr id="'+trId
						+'" class="upload_line upload_doc_'+$n2.utils.stringToHtmlId(docId)
						+' upload_'+$n2.utils.stringToHtmlId(docId)+'_'+$n2.utils.stringToHtmlId(attachmentName)
						+'"></tr>');
					$tr.attr('data-docid',docId);
					$tr.attr('data-att',attachmentName);
					$table.append($tr);
					
					var $td = $('<td class="upload_body"></td>');
					$td.text(docId);
					$tr.append($td);
					
					$td = $('<td class="upload_att"></td>');
					$td.text(attachmentName);
					$tr.append($td);
					
					$td = $('<td class="upload_buttons"></td>');
					$tr.append($td);
					
					$td = $('<td class="upload_checkbox"></td>');
					var $cb = $('<input class="upload_selected" type="checkbox"/>');
					$cb.appendTo($td);
					$cb.change(function(){
						refreshToolbar();
						return true;
					});
					$tr.append($td);
					
					// Display document
					displayRowFromDocId(trId, docId, attachmentName);
					
					++count;
				};
			};
		};
		
		if( count < 1 ){
			$table.append( $('<tr class="uploadNoMedia"><td>No pending media returned</td></tr>') );
		};
		
		refreshToolbar();
	};
	
	function refreshView() {
		// Fetch all pending requests
		var query = {
			viewName: currentView
			,onSuccess: showUploads
			,onError: function(err) {
				alert('Unable to fetch list: '+err);
			}
		};
		
		if( limit > 0 ){
			query.limit = limit;
		};
		
		serverDesign.queryView(query);
		
		$('.uploadButton').removeAttr('disabled');
	};
	
	function uploadMain( $display ) {
		$display.empty();
		
		var $btnLine = $('<div class="uploadButtonLine"></div>');
		$display.append($btnLine);
	
		var $uploadData = $('<div class="uploadData"></div>');
		$display.append($uploadData);
	
		refreshToolbar();
		refreshView();
	};
	
	function _handleDispatch(m){
		var type = m.type;
		
		if( 'documentCreated' === type ) {
			refreshView();
			
		} else if( 'documentUpdated' === type ) {
			refreshView();
			
		} else if( 'documentDeleted' === type ) {
			var docId = m.docId;
			$('.upload_doc_'+$n2.utils.stringToHtmlId(docId)).remove();
			
		} else if( 'login' === type ) {
			
		} else if( 'logout' === type ) {
			
		};
	};
	
	function uploadMainInit(opts_) {
		uploadDiv = opts_.div;
		config = opts_.config;
		atlasDb = opts_.config.atlasDb;
		atlasDesign = opts_.config.atlasDesign;
		serverDesign = atlasDb.getDesignDoc({ddName:'server'});
		
		$n2.log('config', config);
		
		if( config.directory ) {
			dispatcher = config.directory.dispatchService;
			requestService = config.directory.requestService;
			attachmentService = config.directory.attachmentService;
		};
	
		if( config.directory && config.directory.authService ) {
			config.directory.authService.createAuthWidget({
				elemId: 'login'
			});
		};
		
		if( dispatcher ){
	$n2.log('dispatcher',dispatcher);		
			var h = dispatcher.getHandle('upload.js');
			dispatcher.register(h, 'documentCreated', _handleDispatch);
			dispatcher.register(h, 'documentUpdated', _handleDispatch);
			dispatcher.register(h, 'documentDeleted', _handleDispatch);
			dispatcher.register(h, 'login', _handleDispatch);
			dispatcher.register(h, 'logout', _handleDispatch);
		};
		
		uploadMain( $(uploadDiv) );
	};

	function addHamburgerMenu(){
		// Top-App-Bar
		new $n2.mdc.MDCTopAppBar({
			barTitle: 'Upload Approvals'
		});

		// Tools Drawer
		new $n2.mdc.MDCDrawer({	
			anchorBtnId: 'hamburger_menu_btn',
			navHeaderTitle: 'Nunaliit Tools',
			navItems: [
				{"text": "User Management", "href": "./users.html"},
				{"text": "Approval for Uploaded Files", "href": "./upload.html", "activated": true},
				{"text": "Data Browser", "href": "./browse.html"},
				{"text": "Localization", "href": "./translation.html"},
				{"text": "Data Export", "href": "./export.html"},
				{"text": "Data Modification", "href": "./select.html"},
				{"text": "Schemas", "href": "./schemas.html"},
				{"text": "Restore Tool", "href": "./restore.html"},
				{"text": "Submission Tool", "href": "./submission.html"},
				{"text": "Import Tool", "href": "./import.html"},
				{"text": "Debug Tool", "href": "./debug.html"},
				{"text": "Schema Editor", "href": "./schema_editor.html"}
			]	
		});
	};
	
	$n2.uploadApp = {
		uploadMainInit: uploadMainInit
		,addHamburgerMenu: addHamburgerMenu
	};
})(jQuery,nunaliit2);
