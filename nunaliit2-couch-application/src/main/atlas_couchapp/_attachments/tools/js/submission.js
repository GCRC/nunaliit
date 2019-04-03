;(function($,$n2){
	// Localization
	var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };
	
	var DH = 'submission_application';

	// -----------------------------------------------------------------
	var Logger = $n2.Class({
		
		divId: null
		
		,initialize: function(opts_){
			var opts = $n2.extend({
				div: null
			},opts_);
			
			var $div = $( opts.div );
			var divId = $div.attr('id');
			if( !divId ){
				divId = $n2.getUniqueId();
				$div.attr('id',divId);
			};
			this.divId = divId;

			this.clear();
		}
	
		,_getDiv: function(){
			return $('#'+this.divId);
		}
		
		,clear: function() {
			var _this = this;
			
			var $div = this._getDiv();
			
			$div.empty();

			var $buttonsLine = $('<div>')
				.addClass('n2LoggerButtons')
				.appendTo($div);

			$('<span>')
				.addClass('mdc-typography--headline6')
				.text(_loc('Logs '))
				.appendTo($buttonsLine);

			var clearBtnOpts = {
				parentId: $n2.utils.getElementIdentifier($buttonsLine),
				btnLabel: 'Clear',
				btnFunction: function(){
					_this.clear();
					return false;
				}
			};
			new $n2.mdc.MDCButton(clearBtnOpts);

			$('<div>')
				.addClass('n2LoggerEntries')
				.appendTo($div);
		}
		
		,error: function(err){
			var $e = this._getDiv().find('.n2LoggerEntries');
	
			var $d = $('<div class="error"></div>');
			$d.text(err);
			$e.append($d);
		}
		
		,log: function(msg){
			var $e = this._getDiv().find('.n2LoggerEntries');
	
			var $d = $('<div class="log"></div>');
			$d.text(msg);
			$e.append($d);
		}		
	});

	// -----------------------------------------------------------------
	var SubmissionApplication = $n2.Class({
		
		atlasDb: null
		,atlasDesign: null
		,submissionDb: null
		,serverDesign: null
		,schemaRepository: null
		,couchEditor: null
		,showService: null
		,schemaEditorService: null
		,dispatchService: null
		,attachmentService: null
		,divId: null
		,logger: null
		,mdcDialogComponent: null
		
		,initialize: function(opts_){
			var opts = $n2.extend({
		 		config: null
		 		,div: null
		 	},opts_);
			
			var _this = this;
			
			$n2.log('Options',opts);
			
			var config = opts.config;
			this.atlasDb = config.atlasDb;
			this.atlasDesign = config.atlasDesign;
			this.submissionDb = config.submissionDb;
			this.serverDesign = config.serverDesign;
			this.couchEditor = config.couchEditor;

			if( config.directory ) {
				this.schemaRepository = config.directory.schemaRepository;
				this.showService = config.directory.showService;
				this.schemaEditorService = config.directory.schemaEditorService;
				this.dispatchService = config.directory.dispatchService;
				this.attachmentService = config.directory.attachmentService;
			};

			var $div = $( opts.div );
			var divId = $div.attr('id');
			if( !divId ){
				divId = $n2.getUniqueId();
				$div.attr('id',divId);
			};
			this.divId = divId;
			
			// Handle dispatch event
			if( this.dispatchService ){
				var f = function(m, address, dispatcher){
					_this._handleMessage(m, address, dispatcher);
				};
				this.dispatchService.register(DH,'userDocument',f);
			};
			
			// Get changes from submission DB
			if( this.submissionDb ){
				this.submissionDb.getChangeNotifier({
					onSuccess: function(notifier){
						notifier.addListener(function(changes){
							_this._refreshSubmissions();
						});
					}				
				});
			};
			
			this._clear();
			
			var _this = this;
			function refresh(){
				_this._refreshSubmissions();
				var $div = _this._getDiv();
				if( $div.length > 0 ) {
					window.setTimeout(refresh,60000);
				};
			};
			refresh();

			// Attach Material Design Components
			$n2.mdc.attachMDCComponents();
		}
	
		,_getDiv: function(){
			return $('#'+this.divId);
		}
		
		,_clear: function(){
			var _this = this;
			
			var $appDiv = this._getDiv();
			$appDiv.empty();
			
			var $submissionListContainer = $('<div>')
				.addClass('mdc-card')
				.appendTo($appDiv);

			var $log = $('<div>')
				.addClass('submissionAppLog mdc-card')
				.appendTo($appDiv);
			
			this.logger = new Logger({div:$log});
			
			var $buttonsLine = $('<div>')
				.addClass('submissionAppButtons')
				.appendTo($submissionListContainer);

			$('<span>')
				.addClass('mdc-typography--headline6')
				.text(_loc('Submissions '))
				.appendTo($buttonsLine);

			var refreshBtnOpts = {
				parentId: $n2.utils.getElementIdentifier($buttonsLine),
				btnLabel: 'Refresh',
				btnFunction: function(){
					_this._refreshSubmissions();
					return false;
				}
			};
			new $n2.mdc.MDCButton(refreshBtnOpts);

			$('<div>')
				.addClass('submissionAppList')
				.appendTo($submissionListContainer);

			this._refreshSubmissions();
		}
		
		,_refreshSubmissions: function(){
			var _this = this;
			
			if( this.submissionDb ){
				var dd = this.submissionDb.getDesignDoc({ddName:'submission'});
				
				dd.queryView({
					viewName: 'submission-state'
					,keys: ['waiting_for_approval','collision']
					,include_docs: false
					,onSuccess: function(rows){
						var stateFromIds = {};
						for(var i=0,e=rows.length; i<e; ++i){
							var subDocId = rows[i].id;
							var state = rows[i].key;
							stateFromIds[subDocId] = state;
						};
						loadedSubDocIds(stateFromIds);
					}
					,onError: function(err){ 
						_this.logger.error('Unable to fetch submission information: '+err);
					}
				});
			};
			
			function loadedSubDocIds(stateFromIds){
				var $appDiv = _this._getDiv();
				
				var $list = $appDiv.find('.submissionAppList')
					.empty();

				var isEmpty = true;
				var subDocIds = [];
				for(var subDocId in stateFromIds){
					var state = stateFromIds[subDocId];
					
					isEmpty = false;
					
					var cName = 'submission_' + $n2.utils.stringToHtmlId(subDocId);
					$('<div>')
						.addClass('submission submission_state_' + state + ' ' + cName)
						.appendTo($list)
						.text(subDocId);
					
					subDocIds.push(subDocId);
				};

				if( isEmpty ){
					$('<div>')
						.addClass('submission')
						.appendTo($list)
						.text( _loc('No submission available') );
				};
				
				_this._fetchSubmissionDocs(subDocIds);
			};
		}
		
		,_fetchSubmissionDocs: function(docIds){
			if( !docIds.length ) return;
			
			var _this = this;
			
			this.submissionDb.getDocuments({
				docIds: docIds
				,onSuccess: function(docs){
					for(var i=0,e=docs.length; i<e; ++i){
						var subDoc = docs[i];
						_this._loadedSubmissionDoc(subDoc);
					};
				}
				,onError: function(err){}
			});
		}
		
		,_loadedSubmissionDoc: function(submissionDoc){
			var _this = this;

			this._getSubmittedDocument({
				subDoc: submissionDoc
				,onSuccess: function(submittedDoc, submissionDoc){
					// Refresh submission entry
					var subDocId = submissionDoc._id;
					var cName = 'submission_' + $n2.utils.stringToHtmlId(subDocId);
					var $entries = $('.'+cName);
					$entries.each(function(){
						var $entry = $(this);
						_this._displaySubmission($entry, submissionDoc, submittedDoc);
					});
				}
			});
		}

		,_approve: function(subDocId, approvedDoc){
			var _this = this;
			
			this._getSubmissionDocument({
				subDocId: subDocId
				,onSuccess: function(subDoc){
					subDoc.nunaliit_submission.state = 'approved';
					$n2.couchDocument.adjustDocument(subDoc);
					
					if( approvedDoc ){
						subDoc.nunaliit_submission.approved_doc = {};
						subDoc.nunaliit_submission.approved_reserved = {};
						for(var key in approvedDoc){
							if( key.length > 0 && key[0] === '_' ) {
								var effectiveKey = key.substr(1);
								subDoc.nunaliit_submission.approved_reserved[effectiveKey] =
									approvedDoc[key];
							} else {
								subDoc.nunaliit_submission.approved_doc[key] =
									approvedDoc[key];
							};
						};
					};
					
					_this.submissionDb.updateDocument({
						data: subDoc
						,onSuccess: function(docInfo){
							_this.logger.log( _loc('Submission approved') );
							_this._refreshSubmissions();
						}
						,onError: function(err){ 
							_this.logger.error( _loc('Unable to update submission document: {err}',{err:err}) ); 
						}
					});
				}
				,onError: function(err){
					_this.logger.error( _loc('Unable to obtain submission document: {err}',{err:err}) ); 
				}
			});
		}

		,_deny: function(subDocId, onDeniedFn){
			var _this = this;
			var mdcDenyDialogComponent;
			
			gatherDenyReason(function(reason,sendEmail){
				_this._getSubmissionDocument({
					subDocId: subDocId
					,onSuccess: function(subDoc){
						subDoc.nunaliit_submission.state = 'denied';
						
						if( reason && reason !== '' ){
							subDoc.nunaliit_submission.denied_reason = reason;
						};

						if( sendEmail ){
							subDoc.nunaliit_submission.denial_email = {
								requested: true
							};
						};

						$n2.couchDocument.adjustDocument(subDoc);
						
						_this.submissionDb.updateDocument({
							data: subDoc
							,onSuccess: function(docInfo){
								_this.logger.log( _loc('Submission denied') );
								
								if( typeof onDeniedFn === 'function' ){
									onDeniedFn();
								};
								
								_this._refreshSubmissions();
							}
							,onError: function(err){ 
								_this.logger.error( _loc('Unable to update submission document: {err}',{err:err}) ); 
							}
						});
					}
					,onError: function(err){
						_this.logger.error( _loc('Unable to obtain submission document: {err}',{err:err}) ); 
					}
				});
			});
			
			function gatherDenyReason(callback,sendEmail){
				var denyDialogId = $n2.getUniqueId();

				var $denyDialog = $('<div>')
					.attr('id',denyDialogId)
					.attr('role','alertdialog')
					.attr('aria-modal','true')
					.attr('aria-labelledby','my-dialog-title')
					.attr('aria-describedby','my-dialog-content')
					.attr('class','submission_deny_dialog mdc-dialog')
					.appendTo($('body'));
				
				var $dialogContainer = $('<div>')
					.attr('class','mdc-dialog__container')
					.appendTo($denyDialog);
				
				var $dialogSurface = $('<div>')
					.attr('class','mdc-dialog__surface')
					.appendTo($dialogContainer);
				
				$('<h2>')
					.attr('class','mdc-dialog__title')
					.text(_loc('Enter reason for rejecting submission'))
					.appendTo($dialogSurface);
		
				var $dialogContent = $('<div>')
					.attr('class','mdc-dialog__content')
					.appendTo($dialogSurface);

				// TextArea Rejection Reason
				var taId = $n2.getUniqueId();

				var $textareaDiv = $('<div>')
					.addClass('mdc-text-field mdc-text-field--textarea')
					.appendTo($dialogContent);

				$('<textarea>')
					.addClass('submission_deny_dialog_reason mdc-text-field__input')
					.attr('id',taId)
					.attr('rows','8')
					.attr('cols','40')
					.appendTo($textareaDiv);

				var $textareaDivOutline = $('<div>')
					.addClass('mdc-notched-outline')
					.appendTo($textareaDiv);

				$('<div>')
					.addClass('mdc-notched-outline__leading')
					.appendTo($textareaDivOutline);
			
				var $textareaDivOutlineNotch = $('<div>')
					.addClass('mdc-notched-outline__notch')
					.appendTo($textareaDivOutline);

				$('<label>')
					.attr('for',taId)
					.addClass('mdc-floating-label')
					.text('Rejection Reason')
					.appendTo($textareaDivOutlineNotch);

				$('<div>')
					.addClass('mdc-notched-outline__trailing')
					.appendTo($textareaDivOutline);

				// Email Checbox 
				var $options = $('<div>')
					.addClass('submission_deny_dialog_options mdc-form-field')
					.appendTo($dialogContent);

				var cbId = $n2.getUniqueId();

				var $checkboxDiv = $('<div>')
					.addClass('mdc-checkbox')
					.appendTo($options);

				$('<input>')
					.addClass('layer mdc-checkbox__native-control')
					.attr('type','checkbox')
					.attr('id',cbId)
					.attr('name','send_email')
					.appendTo($checkboxDiv);

				var $checkboxBackground = $('<div>')
					.addClass('mdc-checkbox__background')
					.appendTo($checkboxDiv);
	
				$('<svg class="mdc-checkbox__checkmark" viewBox="0 0 24 24"><path fill="none" stroke="white" class="mdc-checkbox__checkmark-path" d="M1.73,12.91 8.1,19.28 22.79,4.59" /></svg>')
					.appendTo($checkboxBackground);
	
				$('<div>')
					.addClass('mdc-checkbox__mixedmark')
					.appendTo($checkboxBackground);

				$('<label>')
					.attr('for',cbId)
					.text( _loc('Send e-mail to submitter with reason for rejection') )
					.appendTo($options);
				
				// Dialog Buttons
				var $buttons = $('<footer>')
					.addClass('submission_deny_dialog_buttons mdc-dialog__actions')
					.appendTo($dialogContent);

				var btnParentId = $n2.utils.getElementIdentifier($buttons);

				var okBtnOpts = {
					parentId: btnParentId,
					mdcClasses: ['n2_button_ok', 'mdc-dialog__button'],
					btnLabel: 'OK',
					btnFunction: function(){
						var $diag = $('#'+denyDialogId);
						
						var comment = $diag.find('textarea.submission_deny_dialog_reason').val();
						var email = $diag.find('input[name="send_email"]').is(':checked');
												
						mdcDenyDialogComponent.close();
						$denyDialog.remove();

						if( typeof callback === 'function' ){
							callback(comment,email);
						};
					}
				};
				new $n2.mdc.MDCButton(okBtnOpts);

				var cancelBtnOpts = {
					parentId: btnParentId,
					mdcClasses: ['n2_button_cancel', 'mdc-dialog__button'],
					btnLabel: 'Cancel',
					btnFunction: function(){
						mdcDenyDialogComponent.close();
						$denyDialog.remove();
						return false;
					}
				};
				new $n2.mdc.MDCButton(cancelBtnOpts);

				$('<div>')
					.addClass('mdc-dialog__scrim')
					.click(function(){						
						mdcDenyDialogComponent.close();
						$denyDialog.remove();
						return false;
					})
					.appendTo($denyDialog);
					
				// Attach MDC Components
				$n2.mdc.attachMDCComponents();
				
				// Attach mdc component to alert dialog
				mdcDenyDialogComponent = new mdc.dialog.MDCDialog($denyDialog[0]);
				mdcDenyDialogComponent.open();
			};
		}

		,_getSubmissionDocument: function(opts_){
			var opts = $n2.extend({
				subDocId: null
				,onSuccess: function(subDoc){}
				,onError: function(err){}
			},opts_);
			
			this.submissionDb.getDocument({
				docId: opts.subDocId
				,onSuccess: function(doc){
					if( doc.nunaliit_submission ){
						opts.onSuccess(doc);
					} else {
						opts.onError( _loc('Invalid submission document') );
					};
				}
				,onError: function(err){
					opts.onError(err);
				}
			});
		}

		,_getSubmittedDocument: function(opts_){
			var opts = $n2.extend({
				subDocId: null
				,subDoc: null
				,onSuccess: function(doc, subDoc){}
				,onError: function(err){}
			},opts_);
			
			if( opts.subDoc ) {
				subDocLoaded(opts.subDoc);
			} else {
				this._getSubmissionDocument({
					subDocId: opts.subDocId
					,onSuccess: subDocLoaded
					,onError: opts.onError
				});
			};
			
			function subDocLoaded(subDoc){
				var doc = null;
				if( subDoc.nunaliit_submission ){
					if( subDoc.nunaliit_submission.submitted_doc ){
						doc = {};
						for(var key in subDoc.nunaliit_submission.submitted_doc){
							var value = subDoc.nunaliit_submission.submitted_doc[key];
							doc[key] = value;
						};
					};
					if( subDoc.nunaliit_submission.submitted_reserved ){
						doc = doc ? doc : {};
						for(var key in subDoc.nunaliit_submission.submitted_reserved){
							var value = subDoc.nunaliit_submission.submitted_reserved[key];
							doc['_'+key] = value;
						};
					};
				};
				opts.onSuccess(doc,subDoc);
			};
		}

		,_getOriginalDocument: function(opts_){
			var opts = $n2.extend({
				subDocId: null
				,subDoc: null
				,onSuccess: function(doc, subDoc){}
				,onError: function(err){}
			},opts_);
			
			if( opts.subDoc ) {
				subDocLoaded(opts.subDoc);
			} else {
				this._getSubmissionDocument({
					subDocId: opts.subDocId
					,onSuccess: subDocLoaded
					,onError: opts.onError
				});
			};
			
			function subDocLoaded(subDoc){
				var doc = null;
				if( subDoc.nunaliit_submission ){
					if( subDoc.nunaliit_submission.original_doc ){
						doc = {};
						for(var key in subDoc.nunaliit_submission.original_doc){
							var value = subDoc.nunaliit_submission.original_doc[key];
							doc[key] = value;
						};
					};
					if( subDoc.nunaliit_submission.original_reserved ){
						doc = doc ? doc : {};
						for(var key in subDoc.nunaliit_submission.original_reserved){
							var value = subDoc.nunaliit_submission.original_reserved[key];
							doc['_'+key] = value;
						};
					};
				};
				opts.onSuccess(doc,subDoc);
			};
		}

		,_getCurrentDocument: function(opts_){
			var opts = $n2.extend({
				subDocId: null
				,subDoc: null
				,onSuccess: function(doc, subDoc){}
				,onError: function(err){}
			},opts_);
			
			var _this = this;
			
			if( opts.subDoc ) {
				subDocLoaded(opts.subDoc);
			} else {
				this._getSubmissionDocument({
					subDocId: opts.subDocId
					,onSuccess: subDocLoaded
					,onError: opts.onError
				});
			};
			
			function subDocLoaded(subDoc){
				if( subDoc.nunaliit_submission ){
					if( subDoc.nunaliit_submission.original_reserved
					 && subDoc.nunaliit_submission.original_reserved.id 
					 && subDoc.nunaliit_submission.original_reserved.rev ) {
						var docId = subDoc.nunaliit_submission.original_reserved.id;
						_this.atlasDb.getDocument({
							docId: docId
							,onSuccess: function(doc){
								opts.onSuccess(doc,subDoc);
							}
							,onError: function(err){
								opts.onSuccess(null,subDoc);
							}
						});
					} else {
						opts.onSuccess(null,subDoc);
					};
				} else {
					opts.onError( _loc('Invalid submission document') );
				};
			};
		},
		
		_displaySubmission: function($entry, submissionDoc, submittedDoc){
			var _this = this;
			
			$entry.empty();
			
			var subDocId = submissionDoc._id;
			
			// State
			var state = 'submitted';
			if( submissionDoc.nunaliit_submission 
			 && submissionDoc.nunaliit_submission.state ){
				state = submissionDoc.nunaliit_submission.state;
			};
			
			// Document identifier and revision
			var docId = null;
			var revision = null;
			if( submissionDoc.nunaliit_submission 
			 && submissionDoc.nunaliit_submission.original_reserved ){
				docId = submissionDoc.nunaliit_submission.original_reserved.id;
				revision = submissionDoc.nunaliit_submission.original_reserved.rev;
			};
			if( null == docId 
			 && submissionDoc.nunaliit_submission 
			 && submissionDoc.nunaliit_submission.submitted_reserved ){
				docId = submissionDoc.nunaliit_submission.submitted_reserved.id;
			};
			
			// Submission date
			var timeStamp = undefined;
			if( submissionDoc.nunaliit_last_updated ){
				timeStamp = submissionDoc.nunaliit_last_updated.time;
			};
			if( !timeStamp 
			 && submissionDoc.nunaliit_created ){
				timeStamp = submissionDoc.nunaliit_created.time;
			};
			
			// Is deletion?
			var isDeletion = false;
			if( submissionDoc.nunaliit_submission 
			 && submissionDoc.nunaliit_submission.deletion ){
				isDeletion = true;
			};
			
			// Submitter
			var submitterName = null;
			if( submissionDoc.nunaliit_submission 
			 && submissionDoc.nunaliit_submission.submitter_name ){
				submitterName = submissionDoc.nunaliit_submission.submitter_name;
			};
			
			// Attachments waiting for approval
			var waitingForApprovalAttachments = [];
			if( this.attachmentService ){
				var attachments = this.attachmentService.getAttachments(submittedDoc);
				for(var i=0,e=attachments.length; i<e; ++i){
					var att = attachments[i];
					var status = att.getStatus();
					var sourceAttachment = att.getSourceAttachment();
					if( 'waiting for approval' === status 
					 && !sourceAttachment ){
						waitingForApprovalAttachments.push(att);
					};
				};
			};

			// Information
			var $info = $('<div class="submission_info">')
				.appendTo($entry);
			if( timeStamp ){
				var tsStr = (new Date(timeStamp)).toString();
				addKeyValue($info, _loc('Date'), tsStr);
			};
			addKeyValue($info, _loc('Submission Id'), subDocId);
			if( docId ){
				addKeyValue($info, _loc('Original Id'), docId);
				
				var type = _loc('update');
				if( isDeletion ) {
					type = _loc('deletion');
				} else if( !revision ) {
					type = _loc('creation');
				};
				addKeyValue($info, _loc('Submission Type'), type);
			};
			
			if( state ){
				addKeyValue($info, _loc('Submission State'), state);
			};
			
			if( submitterName ){
				var $div = $('<div class="key_value">')
					.appendTo($info);
				$('<span class="key">')
					.text(_loc('Submitter')+': ')
					.appendTo($div);
				var $val = $('<span class="value">')
					.text(submitterName)
					.appendTo($div);
				if( this.showService ){
					this.showService.printUserName($val, submitterName);
				};
				
				// Add mailto link
				var cName = 'submission_mailto_' + $n2.utils.stringToHtmlId(submitterName);
				$('<div>')
					.addClass(cName)
					.appendTo($info);
				if( this.dispatchService ){
					this.dispatchService.send(DH,{
						type: 'requestUserDocumentComplete'
						,userId: submitterName
					});
				};
			};

			// View button
			var $views = $('<div class="submission_views">')
				.appendTo($entry);

			var viewBtnOpts = {
				parentId: $n2.utils.getElementIdentifier($views),
				btnLabel: 'View',
				btnFunction: function(){
					_this._viewMerging(subDocId);
					return false;
				}
			};
			new $n2.mdc.MDCButton(viewBtnOpts);

			// Brief display
			var $brief = $('<div class="submission_brief">')
				.appendTo($entry);
			if( this.showService && submittedDoc ){
				this.showService.displayBriefDescription($brief, {}, submittedDoc);
			};
			
			// Attachments
			if( waitingForApprovalAttachments.length > 0 ){
				var $attachmentsDiv = $('<div>')
					.addClass('submission_attachments')
					.appendTo($entry);
				
				for(var i=0,e=waitingForApprovalAttachments.length; i<e; ++i){
					var att = waitingForApprovalAttachments[i];
					var $attDiv = $('<div>')
						.addClass('submission_attachment')
						.appendTo($attachmentsDiv);
					addKeyValue($attDiv, _loc('Attachment Name'), att.getName());
					
					var thumbAtt = att.getThumbnailAttachment();
					if( thumbAtt ){
						var imageUrl = thumbAtt.getMediaFileUrl();
						if( imageUrl ){
							$('<img>')
								.attr('src',imageUrl)
								.appendTo($attDiv);
						};
					};
				};
			};

			function addKeyValue($e, key, value){
				var $div = $('<div class="key_value">')
					.appendTo($e);
				$('<span class="key">')
					.text(key+': ')
					.appendTo($div);
				$('<span class="value">')
					.text(value)
					.appendTo($div);
			};

			// Attach Material Design Components
			$n2.mdc.attachMDCComponents();
		}
		
		,_viewOriginal: function(subDocId){
			var _this = this;
			var mdcViewDialogComponent;
			
			this._getOriginalDocument({
				subDocId: subDocId
				,onSuccess: function(doc, subDoc){
					var diagId = $n2.getUniqueId();

					var $dialog = $('<div>')
						.attr('id', diagId)
						.attr('role','alertdialog')
						.attr('aria-modal','true')
						.attr('aria-labelledby','my-dialog-title')
						.attr('aria-describedby','my-dialog-content')
						.addClass('submission_view_dialog_original mdc-dialog mdc-dialog--scrollable')
						.appendTo($('body'));
							
					var $dialogContainer = $('<div>')
						.addClass('mdc-dialog__container')
						.appendTo($dialog);

					var $dialogSurface = $('<div>')
						.addClass('mdc-dialog__surface')
						.css('padding','10px')
						.appendTo($dialogContainer);

					$('<h2>')
						.addClass('mdc-dialog__title')
						.text(_loc('View Original'))
						.appendTo($dialogSurface);

					var $content = $('<div>')
						.addClass('mdc-dialog__content')
						.appendTo($dialogSurface);
					
					_this._addDocumentAccordion($content, doc);
	
					$('<div>')
					.addClass('mdc-dialog__scrim')
					.click(function(){
						mdcViewDialogComponent.close();
						$dialog.remove();
						return false;
					})
					.appendTo($dialog);
			
					// Attach mdc component to alert dialog
					mdcViewDialogComponent = new mdc.dialog.MDCDialog($dialog[0]);
					mdcViewDialogComponent.open();
				}
			});
		}

		,_viewSubmitted: function(subDocId){
			var _this = this;
			var mdcSubmittedDialogComponent;
			
			this._getSubmittedDocument({
				subDocId: subDocId
				,onSuccess: function(doc, subDoc){
					var diagId = $n2.getUniqueId();

					var $dialog = $('<div>')
						.attr('id', diagId)
						.attr('role','alertdialog')
						.attr('aria-modal','true')
						.attr('aria-labelledby','my-dialog-title')
						.attr('aria-describedby','my-dialog-content')
						.addClass('submission_view_dialog_submitted mdc-dialog mdc-dialog--scrollable')
						.appendTo($('body'));
							
					var $dialogContainer = $('<div>')
						.addClass('mdc-dialog__container')
						.appendTo($dialog);

					var $dialogSurface = $('<div>')
						.addClass('mdc-dialog__surface')
						.css('padding','10px')
						.appendTo($dialogContainer);

					$('<h2>')
						.addClass('mdc-dialog__title')
						.text(_loc('View Submission'))
						.appendTo($dialogSurface);

					var $content = $('<div>')
						.addClass('mdc-dialog__content')
						.appendTo($dialogSurface);
					
					_this._addDocumentAccordion($content, doc);
	
					$('<div>')
					.addClass('mdc-dialog__scrim')
					.click(function(){
						mdcSubmittedDialogComponent.close();
						$dialog.remove();
						return false;
					})
					.appendTo($dialog);
			
					// Attach mdc component to alert dialog
					mdcSubmittedDialogComponent = new mdc.dialog.MDCDialog($dialog[0]);
					mdcSubmittedDialogComponent.open();

				}
			});
		}

		,_viewLatest: function(subDocId){
			var _this = this;
			
			this._getCurrentDocument({
				subDocId: subDocId
				,onSuccess: function(doc, subDoc){
					var diagId = $n2.getUniqueId();
					var $diag = $('<div>')
						.attr('id',diagId)
						.addClass('submission_view_dialog_latest')
						.appendTo( $('body') );
					
					var $content = $('<div>')
						.appendTo($diag);
					
					_this._addDocumentAccordion($content, doc);
					
					$diag.dialog({
						autoOpen: true
						,title: _loc('View Submission')
						,modal: true
						,width: 500
						,close: function(event, ui){
							var diag = $(event.target);
							diag.dialog('destroy');
							diag.remove();
						}
					});
				}
			});
		}

		,_viewMerging: function(subDocId){
			var _this = this;
			var mdcDialogComponent;
			
			// Get current document
			this._getCurrentDocument({
				subDocId: subDocId
				,onSuccess: function(currentDoc, subDoc){
					// Get submitted document
					_this._getSubmittedDocument({
						subDoc: subDoc
						,onSuccess: function(submittedDoc, subDoc){
							// Get original document
							_this._getOriginalDocument({
								subDoc: subDoc
								,onSuccess: function(originalDoc, subDoc){
									openDialog(originalDoc, submittedDoc, currentDoc, subDoc);
								}
							});
						}
					});
				}
			});

			function openDialog(originalDoc, submittedDoc, currentDoc, subDoc){
				var diagId = $n2.getUniqueId();

				var $diag = $('<div>')
					.attr('id',diagId)
					.attr('role','alertdialog')
					.attr('aria-modal','true')
					.attr('aria-labelledby','my-dialog-title')
					.attr('aria-describedby','my-dialog-content')
					.attr('class','submission_view_dialog_merging mdc-dialog')
					.appendTo($('body'));

							
				var $dialogContainer = $('<div>')
					.attr('class','mdc-dialog__container')
					.appendTo($diag);
				
				var $dialogSurface = $('<div>')
					.attr('class','mdc-dialog__surface')
					.appendTo($dialogContainer);
				
				$('<h2>')
					.attr('class','mdc-dialog__title')
					.text(_loc('View Submission'))
					.appendTo($dialogSurface);

				var $dialogContent = $('<div>')
					.attr('class','mdc-dialog__content')
					.appendTo($dialogSurface);
	
				// Attach mdc component to alert dialog
				_this.mdcDialogComponent = new mdc.dialog.MDCDialog($diag[0]);

				$('<div>')
					.addClass('mdc-dialog__scrim')
					.click(function(){
						_this.mdcDialogComponent.close();
						$diag.remove();
						return false;
					})
					.appendTo($diag);

				initiateMergingView($dialogContent, diagId, originalDoc, submittedDoc, currentDoc, subDoc);

				// Open dialog after adding content
				_this.mdcDialogComponent.open();
			};

			function initiateMergingView($dialogContent, diagId, originalDoc, submittedDoc, currentDoc, subDoc){
				var submittedPatch = null;
				if( originalDoc && submittedDoc ) {
					submittedPatch = patcher.computePatch(originalDoc, submittedDoc);
				};
				
				var proposedDoc = submittedDoc;
				if( submittedPatch && currentDoc ) {
					proposedDoc = $n2.document.clone(currentDoc);
					patcher.applyPatch(proposedDoc, submittedPatch);
				};
				
				// Approve submitted media
				if( proposedDoc && _this.attachmentService ){
					var attachments = _this.attachmentService.getAttachments(proposedDoc);
					for(var i=0,e=attachments.length; i<e; ++i){
						var att = attachments[i];
						var status = att.getStatus();
						var sourceAttachment = att.getSourceAttachment();
						if( 'waiting for approval' === status 
						 && !sourceAttachment ){
							att.changeStatus('approved');
						};
					};
				};
				
				$('<div>')
					.addClass('submission_view_dialog_inner')
					.appendTo($dialogContent);
				
				displayDocuments(
					diagId
					,originalDoc
					,submittedDoc
					,currentDoc
					,proposedDoc
					,subDoc);
			};

			function displayDocuments(diagId, originalDoc, submittedDoc, currentDoc, proposedDoc, subDoc){
				var $innerDiag = $('#'+diagId).find('.submission_view_dialog_inner')
					.empty();

				var submittedPatch = null;
				if( originalDoc && submittedDoc ) {
					submittedPatch = patcher.computePatch(originalDoc, submittedDoc);
				};
				
				var currentPatch = null;
				if( originalDoc && currentDoc ){
					currentPatch = patcher.computePatch(originalDoc, currentDoc);
				};
				
				var collisionPatch = null;
				if( originalDoc && submittedPatch && currentPatch ) {
					collisionPatch = computeCollisionPatch(originalDoc, currentPatch, submittedPatch);
				};

				var $content = $('<div>')
					.addClass('submission_view_dialog_merging_content')
					.appendTo($innerDiag);
	
				if( currentDoc ) {
					var $currentOuter = $('<div>')
						.addClass('submission_view_dialog_merging_current_outer')
						.appendTo($content);
					$('<div>')
						.addClass('submission_view_dialog_merging_label')
						.text('Current Document')
						.appendTo($currentOuter);
					var $currentDiv = $('<div>')
						.addClass('submission_view_dialog_merging_current')
						.appendTo($currentOuter);
					_this._addDocumentAccordion($currentDiv, currentDoc, true);
					
					// Open to selections and highlight changes
					var objectTree = new $n2.tree.ObjectTree($currentDiv, null);
					highlightPatch(objectTree, submittedPatch, [], 0);
				};
	
				var $submittedOuter = $('<div>')
					.addClass('submission_view_dialog_merging_submitted_outer')
					.appendTo($content);
				$('<div>')
					.addClass('submission_view_dialog_merging_label')
					.text('Proposed Document')
					.appendTo($submittedOuter);
				var $submittedDiv = $('<div>')
					.addClass('submission_view_dialog_merging_submitted')
					.appendTo($submittedOuter);
				if( subDoc.nunaliit_submission.deletion ) {
					$submittedDiv.text( _loc('Delete document') );
				} else {
					_this._addDocumentAccordion($submittedDiv, proposedDoc, true);
				};
				
				// Highlight the changes: removal and updates
				var objectTree = new $n2.tree.ObjectTree($submittedDiv, null);
				highlightPatch(objectTree, submittedPatch, [], 1);
				highlightPatch(objectTree, collisionPatch, [], 2);
				
				if( submittedPatch ) {
					var $deltaOuter = $('<div>')
						.addClass('submission_view_dialog_merging_delta_outer')
						.appendTo($innerDiag);
					$('<div>')
						.addClass('submission_view_dialog_merging_label')
						.text('Submitted Changes')
						.appendTo($deltaOuter);
					var $delta = $('<div>')
						.addClass('submission_view_dialog_merging_delta')
						.appendTo($deltaOuter);
					new $n2.tree.ObjectTree($delta, submittedPatch);
				};
				
				var $buttons = $('<footer>')
					.addClass('submission_view_dialog_merging_buttons mdc-dialog__actions')
					.appendTo($innerDiag);

				var btnParentId = $n2.utils.getElementIdentifier($buttons);

				var approveBtnOpts = {
					parentId: btnParentId,
					mdcClasses: ['n2_button_approve'],
					btnLabel: 'Approve',
					btnFunction: function(){
						_this._approve(subDocId, proposedDoc);
						_this.mdcDialogComponent.close();
						var $dialog = $('#'+diagId);
						$dialog.remove();
						return false;
					}
				};
				new $n2.mdc.MDCButton(approveBtnOpts);

				var rejectBtnOpts = {
					parentId: btnParentId,
					mdcClasses: ['n2_button_deny', 'mdc-dialog__button'],
					btnLabel: 'Reject',
					btnFunction: function(){
						_this._deny(subDocId,function(){
							_this.mdcDialogComponent.close();
							var $dialog = $('#'+diagId);
							$dialog.remove();
						});
						return false;
					}
				};
				new $n2.mdc.MDCButton(rejectBtnOpts);

				if( originalDoc ) {
					var viewOrgBtnOpts = {
						parentId: btnParentId,
						mdcClasses: ['n2_button_original', 'mdc-dialog__button'],
						btnLabel: 'View Original',
						btnFunction: function(){
							_this._viewOriginal(subDocId);
							return false;
						}
					};
					new $n2.mdc.MDCButton(viewOrgBtnOpts);
				};
				if( submittedDoc ) {

					var viewSubBtnOpts = {
						parentId: btnParentId,
						mdcClasses: ['n2_button_submitted', 'mdc-dialog__button'],
						btnLabel: 'View Submitted',
						btnFunction: function(){
							_this._viewSubmitted(subDocId);
							return false;
						}
					};
					new $n2.mdc.MDCButton(viewSubBtnOpts);
				};
				if( ! subDoc.nunaliit_submission.deletion ) {

					var editBtnOpts = {
						parentId: btnParentId,
						mdcClasses: ['n2_button_manual', 'mdc-dialog__button'],
						btnLabel: 'Edit Proposed Document',
						btnFunction: function(){
							editProposedDocument(diagId, originalDoc, submittedDoc, currentDoc, proposedDoc, subDoc);
							return false;
						}
					};
					new $n2.mdc.MDCButton(editBtnOpts);
				};
			
				var cancelBtnOpts = {
					parentId: btnParentId,
					mdcClasses: ['n2_button_cancel', 'mdc-dialog__button'],
					btnLabel: 'Cancel',
					btnFunction: function(){
						_this.mdcDialogComponent.close();
						var $dialog = $('#'+diagId);
						$dialog.remove();
						return false;
					}
				};
				new $n2.mdc.MDCButton(cancelBtnOpts);
				
				// Install mouse over: On mouse over, change style of all
				// similar keys, in the other trees. Include the parent
				// keys as well.
				$innerDiag.on('mouseover','.tree_sel',function(event){
					var $elem = $(event.target);
					if( $elem.hasClass('tree_sel') ) {
						var $diag = $('#'+diagId);
						$diag.find('.tree_sel').removeClass('mouseSelected');
						
						var classNames = $elem.attr('class');
						classNames = classNames.split(' ');
						for(var i=0,e=classNames.length; i<e; ++i){
							var className = classNames[i];
							if( className.substr(0,9) === 'tree_sel_' ) {
								$diag.find('.'+className).addClass('mouseSelected');
							};
						};
					};
				});
				
				// Install mouse click: when a key is clicked, open
				// all trees in the other threes so that the key becomes
				// visible.
				$innerDiag.on('click','.tree_sel',function(event){
					var $elem = $(event.target);
					if( $elem.hasClass('treeKey') ) {
						var $diag = $('#'+diagId);
						
						var $li = $elem.parents('.tree_sel').first();
	
						var classNames = $li.attr('class');
						classNames = classNames.split(' ');
						for(var i=0,e=classNames.length; i<e; ++i){
							var className = classNames[i];
							if( className.substr(0,9) === 'tree_sel_' ) {
								var $lis = $diag.find('.'+className)
									.addClass('treeShowChildren')
									.removeClass('treeHideChildren');
								$lis.parents('.tree_sel')
									.addClass('treeShowChildren')
									.removeClass('treeHideChildren');
							};
						};
					};
				});
			};
			
			function editProposedDocument(diagId, originalDoc, submittedDoc, currentDoc, proposedDoc, subDoc){
				var $diag = $('#'+diagId);
				var $inner = $diag.find('.submission_view_dialog_inner');
				var $proposed = $inner.find('.submission_view_dialog_merging_submitted_outer');
				var $buttons = $inner.find('.submission_view_dialog_merging_buttons');
				
				var editedDoc = $n2.document.clone(proposedDoc);
				
				$proposed.empty();

				$('<div>')
					.addClass('submission_view_dialog_merging_label')
					.text('Edit Proposed Document')
					.appendTo($proposed);
				
				var $edit = $('<div>').appendTo($proposed);
				var editor = new $n2.couchEdit.CouchSimpleDocumentEditor({
					elem: $edit
					,doc: editedDoc
					,schemaRepository: _this.schemaRepository
					,schemaEditorService: _this.schemaEditorService
					,editors: [
						$n2.couchEdit.Constants.FORM_EDITOR
						,$n2.couchEdit.Constants.TREE_EDITOR
						,$n2.couchEdit.Constants.RELATION_EDITOR
					]
				});
				
				$buttons.empty();

				var btnParentId = $n2.utils.getElementIdentifier($buttons);
				
				var saveBtnOpts = {
					parentId: btnParentId,
					mdcClasses: ['n2_button_save'],
					btnLabel: 'Save',
					btnFunction: function(){
						var updatedDoc = editor.getDocument();
						displayDocuments(diagId, originalDoc, submittedDoc, currentDoc, updatedDoc, subDoc);
						return false;
					}
				};
				new $n2.mdc.MDCButton(saveBtnOpts);

				var cancelBtnOpts = {
					parentId: btnParentId,
					mdcClasses: ['n2_button_cancel'],
					btnLabel: 'Cancel',
					btnFunction: function(){
						displayDocuments(diagId, originalDoc, submittedDoc, currentDoc, proposedDoc, subDoc);
						return false;
					}
				};
				new $n2.mdc.MDCButton(cancelBtnOpts);
			};
			
			// level 0 is on current document (submitted patch)
			// level 1 is on proposed document (submitted patch)
			// level 2 is on proposed document (collision patch)
			function highlightPatch(objectTree, patch, selectors, level){
				if( $n2.isArray(patch) ) {
					for(var key=0,e=patch.length; key<e; ++key){
						selectors.push(key);

						var $li = objectTree.findLiFromSelectors(selectors);
						if( $li ) {
							$li.removeClass('treeHideChildren');
							$li.addClass('treeShowChildren');
							$li.find('.treeKey').addClass('patchSelected');
						};
						
						var value = patch[key];
						if( typeof value === 'object' ) {
							// Recurse
							highlightPatch(objectTree, value, selectors, level);
						} else {
							var $treeValue = $li.find('.treeValue');
							var $treeChildren = $li.find('div.treeChildren');
							
							if( $li && level === 0 ){
								$treeValue.addClass('patchDeleted');
								$treeChildren.addClass('patchDeleted');
							} else if( $li && level === 1 ){
								$treeValue.addClass('patchModified');
								$treeChildren.addClass('patchModified');
							} else if( $li && level === 2 ){
								$treeValue.addClass('patchCollision');
								$treeChildren.addClass('patchCollision');
							};
						};
						
						selectors.pop();
					};
					
				} else {
					for(var key in patch){
						var effectiveKey = key;
						if( key.length > 1 && key[0] === '_' ){
							effectiveKey = key.substr(1);
						};
						
						if( key === '_r' ) {
							if( level == 0 ){
								var delKeys = patch['_r'];
								if( typeof delKeys === 'string' ) {
									delKeys = [delKeys];
								};
								for(var i=0,e=delKeys.length; i<e; ++i){
									var delKey = delKeys[i];

									selectors.push(delKey);

									var $li = objectTree.findLiFromSelectors(selectors);
									if( $li ) {
										$li.removeClass('treeHideChildren');
										$li.addClass('treeShowChildren');
										$li.find('.treeKey').addClass('patchSelected');
										$li.find('.treeValue').addClass('patchDeleted');
									};
									
									selectors.pop();
								};
							};
						} else {
							selectors.push(effectiveKey);

							var $li = objectTree.findLiFromSelectors(selectors);
							if( $li ) {
								$li.removeClass('treeHideChildren');
								$li.addClass('treeShowChildren');
								$li.find('.treeKey').addClass('patchSelected');
							};
							
							var value = patch[effectiveKey];
							if( typeof value === 'object' ) {
								// Recurse
								highlightPatch(objectTree, value, selectors, level);
							} else {
								var $treeValue = $li.find('.treeValue');
								var $treeChildren = $li.find('div.treeChildren');
								
								if( $li && level === 0 ){
									$treeValue.addClass('patchDeleted');
									$treeChildren.addClass('patchDeleted');
								} else if( $li && level === 1 ){
									$treeValue.addClass('patchModified');
									$treeChildren.addClass('patchModified');
								} else if( $li && level === 2 ){
									$treeValue.addClass('patchCollision');
									$treeChildren.addClass('patchCollision');
								};
							};
							
							selectors.pop();
						};
					};
				};
			};
			
			function computeCollisionPatch(originalDoc, currentPatch, submittedPatch){
				var doc1 = $n2.document.clone(originalDoc);
				patcher.applyPatch(doc1, currentPatch);
				patcher.applyPatch(doc1, submittedPatch);
				
				var doc2 = $n2.document.clone(originalDoc);
				patcher.applyPatch(doc2, submittedPatch);
				patcher.applyPatch(doc2, currentPatch);

				var collisionPatch = patcher.computePatch(doc1, doc2);
				var effectivePatch = null;
				if( collisionPatch ){
					for(var key in collisionPatch){
						if( key === '_rev' ) {
							// ignore
						} else if (  key === 'nunaliit_last_updated' ) {
							// ignore
						} else {
							if( null === effectivePatch ){
								effectivePatch = {};
							};
							effectivePatch[key] = collisionPatch[key];
						};
					};
				};
				
				return effectivePatch;
			};
		}
		
		,_addDocumentAccordion: function($content, doc, inverse){
			var _this = this;
			var useAccordion = false;

			if( doc.nunaliit_schema && this.showService ){
				useAccordion = true;
			};

			if( inverse ) {
				addTree($content, doc, useAccordion);
				if( doc.nunaliit_schema && this.showService ){
					addSchema($content, doc, useAccordion);
				};
			} else {
				if( doc.nunaliit_schema && this.showService ){
					addSchema($content, doc, useAccordion);
				};
				addTree($content, doc, useAccordion);
			};
			
			if( useAccordion ){
				$content.accordion({
					collapsible: true
					,heightStyle: 'content'
		            ,autoHeight: false
			        ,clearStyle: true	
				});
			};
			
			function addSchema($content, doc, useAccordion){
				if( useAccordion ){
					var $h3 = $('<h3>')
						.appendTo($content);
					$('<a>')
						.text( _loc('Schema Display') )
						.attr('href','#')
						.appendTo($h3);
				};

				var $showDiv = $('<div>')
					.addClass('submission_view_dialog_show')
					.appendTo($content);
				_this.showService.displayDocument($showDiv, {}, doc);
			};
			
			function addTree($content, doc, useAccordion){
				if( useAccordion ){
					var $h3 = $('<h3>')
						.appendTo($content);
					$('<a>')
						.text( _loc('Tree Display') )
						.attr('href','#')
						.appendTo($h3);
				};
				
				var $treeDiv = $('<div>')
					.addClass('submission_view_dialog_tree')
					.appendTo($content);
				new $n2.tree.ObjectTree($treeDiv, doc);
			};
		}
		
		,_handleMessage: function(m, address, dispatcher){
			// Check that we are still running
			var $div = this._getDiv();
			if( $div.length < 1 ){
				dispatcher.deregister(address);
				
			} else if( 'userDocument' === m.type ) {
				this._loadedUserDoc(m.userDoc);
			};
		}
		
		,_loadedUserDoc: function(userDoc){
			var userId = userDoc.name;
			
			var userName = userDoc.display;
			if( !userName ){
				userName = userDoc.name;
			};
			
			var emails = [];
			if( userDoc.nunaliit_emails && userDoc.nunaliit_validated_emails ) {
				for(var i=0,e=userDoc.nunaliit_emails.length; i<e; ++i){
					var email = userDoc.nunaliit_emails[i];
					if( userDoc.nunaliit_validated_emails.indexOf(email) >= 0 ){
						emails.push(email);
					};
				};
			};

			if( emails.length > 0 ) {
				var cName = 'submission_mailto_' + $n2.utils.stringToHtmlId(userId);
				$('.'+cName).each(function(){
					var $div = $(this)
						.removeClass(cName)
						.addClass('submission_mail_link_' + $n2.utils.stringToHtmlId(userId));
					for(var i=0,e=emails.length; i<e; ++i){
						var email = emails[i];
						var $line = $('<div>')
							.appendTo($div);
						var $a = $('<a>')
							.attr('href','mailto:'+email)
							.text( _loc('Send mail to {name}',{name:userName}) )
							.appendTo($line);
					};
				});
			};
		}
	});

	// -----------------------------------------------------------------
	function main(opts_){
		return new $n2.submissionApp.SubmissionApplication(opts_);
	};
	
	$n2.submissionApp = {
		main: main
		,SubmissionApplication: SubmissionApplication
	};
})(jQuery,nunaliit2);
