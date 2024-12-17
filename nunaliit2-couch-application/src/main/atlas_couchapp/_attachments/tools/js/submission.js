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

			var $buttons = $('<div class="n2LoggerButtons"><span></span> <button></button></div>')
				.appendTo($div);

			$buttons.find('span').text( _loc('Logs') );
			$buttons.find('button')
				.text( _loc('Clear') )
				.click(function(){
					_this.clear();
					return false;
				});
			
			$('<div class="n2LoggerEntries"></div>')
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
		}
	
		,_getDiv: function(){
			return $('#'+this.divId);
		}
		
		,_clear: function(){
			var _this = this;
			
			var $appDiv = this._getDiv();
			$appDiv
				.empty()
				.append( $('<div class="submissionAppButtons"><div>') )
				.append( $('<div class="submissionAppList"><div>') )
				;
			
			var $log = $('<div class="submissionAppLog"><div>')
				.appendTo($appDiv);
			
			this.logger = new Logger({div:$log});
			
			var $buttons = $appDiv.find('.submissionAppButtons');
			
			$('<button>')
				.text( _loc('Refresh') )
				.appendTo($buttons)
				.click(function(){
					_this._refreshSubmissions();
					return false;
				});
			
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
					var $div = $('<div>')
						.addClass('submission')
						.addClass('submission_state_'+state)
						.addClass(cName)
						.appendTo($list)
						.text(subDocId)
						;
					
					subDocIds.push(subDocId);
				};

				if( isEmpty ){
					var $div = $('<div>')
						.addClass('submission')
						.appendTo($list)
						.text( _loc('No submission available') )
						;
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

		,_approve: function(subDocId, approvedDoc, approveFn){
			var _this = this;
			
			collectApprovalMessage(function(message, sendEmail) {
				_this._getSubmissionDocument({
					subDocId: subDocId
					,onSuccess: function(subDoc){
						subDoc.nunaliit_submission.state = 'approved';
						$n2.couchDocument.adjustDocument(subDoc);
						
						if( approvedDoc ){

							if (message && message !== '') {
								subDoc.nunaliit_submission.approval_message = message;
							}

							if (sendEmail) {
								subDoc.nunaliit_submission.approval_email = {
									requested: true
								}
							}

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
								if( typeof approveFn === 'function' ){
									approveFn();
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
			})

			function collectApprovalMessage(callback, sendEmail){
				var diagId = $n2.getUniqueId();
				var $diag = $('<div>')
					.attr('id',diagId)
					.addClass('submission_approve_dialog')
					.appendTo( $('body') );
				
				$('<textarea>')
					.addClass('submission_approve_dialog_message')
					.appendTo($diag);
				
				var $options = $('<div>')
					.addClass('submission_approve_dialog_options')
					.appendTo($diag);
				
				var cbId = $n2.getUniqueId();
				$('<input type="checkbox">')
					.attr('id',cbId)
					.attr('name','send_email')
					.appendTo($options);
				$('<label>')
					.attr('for',cbId)
					.text( _loc('Send e-mail to submitter with message') )
					.appendTo($options);
				
				var $buttons = $('<div>')
					.addClass('submission_approve_dialog_buttons')
					.appendTo($diag);

				$('<button>')
					.addClass('n2_button_ok')
					.text( _loc('OK') )
					.appendTo($buttons)
					.click(function(){
						var $diag = $('#'+diagId);
						
						var comment = $diag.find('textarea.submission_approve_dialog_message').val();
						var email = $diag.find('input[name="send_email"]').is(':checked');
						
						$diag.dialog('close');
						if( typeof callback === 'function' ){
							callback(comment,email);
						};
					});

				$('<button>')
					.addClass('n2_button_cancel')
					.text( _loc('Cancel') )
					.appendTo($buttons)
					.click(function(){
						var $diag = $('#'+diagId);
						$diag.dialog('close');
					});
				
				$diag.dialog({
					autoOpen: true
					,title: _loc('Enter approval message')
					,modal: true
					,width: 'auto'
					,close: function(event, ui){
						var diag = $(event.target);
						diag.dialog('destroy');
						diag.remove();
					}
				});
			}
		}

		,_deny: function(subDocId, onDeniedFn){
			var _this = this;
			
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
				var diagId = $n2.getUniqueId();
				var $diag = $('<div>')
					.attr('id',diagId)
					.addClass('submission_deny_dialog')
					.appendTo( $('body') );
				
				$('<textarea>')
					.addClass('submission_deny_dialog_reason')
					.appendTo($diag);
				
				var $options = $('<div>')
					.addClass('submission_deny_dialog_options')
					.appendTo($diag);
				
				var cbId = $n2.getUniqueId();
				$('<input type="checkbox">')
					.attr('id',cbId)
					.attr('name','send_email')
					.appendTo($options);
				$('<label>')
					.attr('for',cbId)
					.text( _loc('Send e-mail to submitter with reason for rejection') )
					.appendTo($options);
				
				var $buttons = $('<div>')
					.addClass('submission_deny_dialog_buttons')
					.appendTo($diag);

				$('<button>')
					.addClass('n2_button_ok')
					.text( _loc('OK') )
					.appendTo($buttons)
					.click(function(){
						var $diag = $('#'+diagId);
						
						var comment = $diag.find('textarea.submission_deny_dialog_reason').val();
						var email = $diag.find('input[name="send_email"]').is(':checked');
						
						$diag.dialog('close');
						if( typeof callback === 'function' ){
							callback(comment,email);
						};
					});

				$('<button>')
					.addClass('n2_button_cancel')
					.text( _loc('Cancel') )
					.appendTo($buttons)
					.click(function(){
						var $diag = $('#'+diagId);
						$diag.dialog('close');
					});
				
				$diag.dialog({
					autoOpen: true
					,title: _loc('Enter reason for rejecting submission')
					,modal: true
					//,width: '90%'
					,width: 'auto'
					,close: function(event, ui){
						var diag = $(event.target);
						diag.dialog('destroy');
						diag.remove();
					}
				});
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
			$('<button>')
				.text( _loc('View') )
				.appendTo($views)
				.click(function(){
					_this._viewMerging(subDocId);
					return false;
				});

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
		}
		
		,_viewOriginal: function(subDocId){
			var _this = this;
			
			this._getOriginalDocument({
				subDocId: subDocId
				,onSuccess: function(doc, subDoc){
					var diagId = $n2.getUniqueId();
					var $diag = $('<div>')
						.attr('id',diagId)
						.addClass('submission_view_dialog_original')
						.appendTo( $('body') );
					
					var $content = $('<div>')
						.appendTo($diag);
					
					_this._addDocumentAccordion($content, doc);
					
					$diag.dialog({
						autoOpen: true
						,title: _loc('View Original')
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

		,_viewSubmitted: function(subDocId){
			var _this = this;
			
			this._getSubmittedDocument({
				subDocId: subDocId
				,onSuccess: function(doc, subDoc){
					var diagId = $n2.getUniqueId();
					var $diag = $('<div>')
						.attr('id',diagId)
						.addClass('submission_view_dialog_submitted')
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
					.addClass('submission_view_dialog_merging')
					.appendTo( $('body') );
				
				initiateMergingView($diag, diagId, originalDoc, submittedDoc, currentDoc, subDoc);
				
				$diag.dialog({
					autoOpen: true
					,title: _loc('View Submission')
					,modal: true
					,width: '90%'
					,close: function(event, ui){
						var diag = $(event.target);
						diag.dialog('destroy');
						diag.remove();
					}
				});
			};

			function initiateMergingView($diag, diagId, originalDoc, submittedDoc, currentDoc, subDoc){
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
					.appendTo($diag);
				
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
				
				var $buttons = $('<div>')
					.addClass('submission_view_dialog_merging_buttons')
					.appendTo($innerDiag);
				$('<button>')
					.addClass('n2_button_approve')
					.text( _loc('Approve') )
					.appendTo($buttons)
					.click(function(){
						_this._approve(subDocId, proposedDoc, function() {
							var $diag = $('#'+diagId);
							$diag.dialog('close');
						});
						return false;
					});
				$('<button>')
					.addClass('n2_button_deny')
					.text( _loc('Reject') )
					.appendTo($buttons)
					.click(function(){
						_this._deny(subDocId,function(){
							var $diag = $('#'+diagId);
							$diag.dialog('close');
						});
						return false;
					});
				if( originalDoc ) {
					$('<button>')
						.addClass('n2_button_original')
						.text( _loc('View Original') )
						.appendTo($buttons)
						.click(function(){
							_this._viewOriginal(subDocId);
							return false;
						});
				};
				if( submittedDoc ) {
					$('<button>')
						.addClass('n2_button_submitted')
						.text( _loc('View Submitted') )
						.appendTo($buttons)
						.click(function(){
							_this._viewSubmitted(subDocId);
							return false;
						});
				};
				if( ! subDoc.nunaliit_submission.deletion ) {
					$('<button>')
						.addClass('n2_button_manual')
						.text( _loc('Edit Proposed Document') )
						.appendTo($buttons)
						.click(function(){
							editProposedDocument(diagId, originalDoc, submittedDoc, currentDoc, proposedDoc, subDoc);
							return false;
						});
				};
				$('<button>')
					.addClass('n2_button_cancel')
					.text( _loc('Cancel') )
					.appendTo($buttons)
					.click(function(){
						var $diag = $('#'+diagId);
						$diag.dialog('close');
						return false;
					});
				
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
				$('<button>')
					.addClass('n2_button_save')
					.text( _loc('Save') )
					.appendTo($buttons)
					.click(function(){
						var updatedDoc = editor.getDocument();
						displayDocuments(diagId, originalDoc, submittedDoc, currentDoc, updatedDoc, subDoc);
						return false;
					});
				$('<button>')
					.addClass('n2_button_cancel')
					.text( _loc('Cancel') )
					.appendTo($buttons)
					.click(function(){
						displayDocuments(diagId, originalDoc, submittedDoc, currentDoc, proposedDoc, subDoc);
						return false;
					});
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