;(function($,$n2){
	// Localization
	var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };

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
		,divId: null
		,logger: null
		
		,initialize: function(opts_){
			var opts = $n2.extend({
		 		config: null
		 		,div: null
		 	},opts_);
			
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
			};

			var $div = $( opts.div );
			var divId = $div.attr('id');
			if( !divId ){
				divId = $n2.getUniqueId();
				$div.attr('id',divId);
			};
			this.divId = divId;
			
			this._clear();
			
			var _this = this;
			function refresh(){
				_this._refreshSubmissions();
				var $div = _this._getDiv();
				if( $div.length > 0 ) {
					window.setTimeout(refresh,5000);
				};
			};
			window.setTimeout(refresh,5000);
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
		
		,_loadedSubmissionDoc: function(subDoc){
			var _this = this;
			
			// Refresh submission entry
			var subDocId = subDoc._id;
			var cName = 'submission_' + $n2.utils.stringToHtmlId(subDocId);
			var $entries = $('.'+cName);
			$entries.each(function(){
				var $entry = $(this)
					.empty();
				
				var original_info = null;
				if( subDoc.nunaliit_submission ){
					original_info = subDoc.nunaliit_submission.original_info;
				};
				
				var $info = $('<div class="submission_info">')
					.appendTo($entry);
				addKeyValue($info, _loc('Submission Id'), subDocId);
				if( original_info ){
					addKeyValue($info, _loc('Original Id'), original_info.id);
					
					var type = _loc('update');
					if( subDoc.nunaliit_submission.deletion ) {
						type = _loc('deletion');
					} else if( !original_info.rev ) {
						type = _loc('creation');
					};
					addKeyValue($info, _loc('Submission Type'), type);
				};

				var $views = $('<div class="submission_views">')
					.appendTo($entry);
				$('<button>')
					.text( _loc('View') )
					.appendTo($views)
					.click(function(){
						_this._viewMerging(subDocId);
						return false;
					});

				var $buttons = $('<div class="submission_buttons">')
					.appendTo($entry);
				$('<button>')
					.text( _loc('Approve') )
					.appendTo($buttons)
					.click(function(){
						_this._approve(subDocId);
						return false;
					});
				$('<button>')
					.text( _loc('Deny') )
					.appendTo($buttons)
					.click(function(){
						_this._deny(subDocId);
						return false;
					});
			});
			
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

		,_approve: function(subDocId){
			this._updateSubmissionState(subDocId, 'approved');
		}

		,_deny: function(subDocId){
			this._updateSubmissionState(subDocId, 'denied');
		}

		,_updateSubmissionState: function(subDocId, newState){
			var _this = this;
			
			this._getSubmissionDocument({
				subDocId: subDocId
				,onSuccess: function(subDoc){
					subDoc.nunaliit_submission.state = newState;
					_this.submissionDb.updateDocument({
						data: subDoc
						,onSuccess: function(docInfo){
							_this.logger.log( _loc('Submision approved') );
							_this._refreshSubmissions();
						}
						,onError: function(err){ 
							_this.logger.error( _loc('Unable to update submision document: {err}',{err:err}) ); 
						}
					});
				}
				,onError: function(err){
					_this.logger.error( _loc('Unable to obtain submision document: {err}',{err:err}) ); 
				}
			});
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
				var doc = {};
				if( subDoc.nunaliit_submission ){
					if( subDoc.nunaliit_submission.reserved ){
						for(var key in subDoc.nunaliit_submission.reserved){
							var value = subDoc.nunaliit_submission.reserved[key];
							doc['_'+key] = value;
						};
					};
					if( subDoc.nunaliit_submission.doc ){
						for(var key in subDoc.nunaliit_submission.doc){
							var value = subDoc.nunaliit_submission.doc[key];
							doc[key] = value;
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
				if( subDoc.nunaliit_submission
				 && subDoc.nunaliit_submission.original_info
				 && subDoc.nunaliit_submission.original_info.id ){
					if( subDoc.nunaliit_submission.original_info.rev ) {
						var docId = subDoc.nunaliit_submission.original_info.id;
						var rev = subDoc.nunaliit_submission.original_info.rev;
						_this.atlasDb.getDocument({
							docId: docId
							,rev: rev
							,onSuccess: function(doc){
								opts.onSuccess(doc,subDoc);
							}
							,onError: opts.onError
						});
					} else {
						opts.onSuccess(null,subDoc);
					};
				} else {
					opts.onError( _loc('Invalid submission document') );
				};
			};
		}

		,_getLatestDocument: function(opts_){
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
				if( subDoc.nunaliit_submission
				 && subDoc.nunaliit_submission.original_info
				 && subDoc.nunaliit_submission.original_info.id ){
					if( subDoc.nunaliit_submission.original_info.rev ) {
						var docId = subDoc.nunaliit_submission.original_info.id;
						_this.atlasDb.getDocument({
							docId: docId
							,onSuccess: function(doc){
								opts.onSuccess(doc,subDoc);
							}
							,onError: opts.onError
						});
					} else {
						opts.onSuccess(null,subDoc);
					};
				} else {
					opts.onError( _loc('Invalid submission document') );
				};
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

		,_viewSubmission: function(subDocId){
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
			
			this._getLatestDocument({
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
			this._getLatestDocument({
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
									displayMerging(originalDoc, submittedDoc, currentDoc, subDoc);
								}
							});
						}
					});
				}
			});
			
			function displayMerging(originalDoc, submittedDoc, currentDoc, subDoc) {
				var submittedPatch = null;
				if( originalDoc ) {
					submittedPatch = patcher.computePatch(originalDoc, submittedDoc);
				};
				
				var currentPatch = null;
				if( originalDoc && currentDoc ){
					currentPatch = patcher.computePatch(originalDoc, currentDoc);
				};
				
				var diagId = $n2.getUniqueId();
				var $diag = $('<div>')
					.attr('id',diagId)
					.addClass('submission_view_dialog_merging')
					.appendTo( $('body') );
				
				var $content = $('<div>')
					.addClass('submission_view_dialog_merging_content')
					.appendTo($diag);

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
					
					// Open to selections
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
					_this._addDocumentAccordion($submittedDiv, submittedDoc, true);
				};
				
				// Highlight the changes
				var objectTree = new $n2.tree.ObjectTree($submittedDiv, null);
				highlightPatch(objectTree, submittedPatch, [], 1);
				
				if( submittedPatch ) {
					var $deltaOuter = $('<div>')
						.addClass('submission_view_dialog_merging_delta_outer')
						.appendTo($diag);
					$('<div>')
						.addClass('submission_view_dialog_merging_label')
						.text('Proposed Changes')
						.appendTo($deltaOuter);
					var $delta = $('<div>')
						.addClass('submission_view_dialog_merging_delta')
						.appendTo($deltaOuter);
					new $n2.tree.ObjectTree($delta, submittedPatch);
				};
				
				var $buttons = $('<div>')
					.addClass('submission_view_dialog_merging_buttons')
					.appendTo($diag);
				$('<button>')
					.addClass('n2_button_approve')
					.text( _loc('Approve') )
					.appendTo($buttons)
					.click(function(){
						_this._approve(subDocId);
						var $diag = $('#'+diagId);
						$diag.dialog('close');
						return false;
					});
				$('<button>')
					.addClass('n2_button_deny')
					.text( _loc('Reject') )
					.appendTo($buttons)
					.click(function(){
						_this._deny(subDocId);
						var $diag = $('#'+diagId);
						$diag.dialog('close');
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
				$('<button>')
					.addClass('n2_button_submitted')
					.text( _loc('View Submitted') )
					.appendTo($buttons)
					.click(function(){
						_this._viewSubmission(subDocId);
						return false;
					});
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
				$diag.on('mouseover','.tree_sel',function(event){
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
				$diag.on('click','.tree_sel',function(event){
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
							if( $li && level === 0 ){
								$li.find('.treeValue').addClass('patchDeleted');
							} else if( $li && level === 1 ){
								$li.find('.treeValue').addClass('patchModified');
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
								if( $li && level === 0 ){
									$li.find('.treeValue').addClass('patchDeleted');
								} else if( $li && level === 1 ){
									$li.find('.treeValue').addClass('patchModified');
								};
							};
							
							selectors.pop();
						};
					};
				};
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