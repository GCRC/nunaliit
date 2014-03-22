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
			this.schemaRepository = config.directory.schemaRepository;
			this.couchEditor = config.couchEditor;

			var $div = $( opts.div );
			var divId = $div.attr('id');
			if( !divId ){
				divId = $n2.getUniqueId();
				$div.attr('id',divId);
			};
			this.divId = divId;
			
			this._clear();
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
						var $appDiv = _this._getDiv();
						var $list = $appDiv.find('.submissionAppList')
							.empty();
						if( !rows.length ){
							var $div = $('<div>')
								.addClass('submission')
								.appendTo($list)
								.text( _loc('No submission available') )
								;
						};
						var docIds = [];
						for(var i=0,e=rows.length; i<e; ++i){
							var subDocId = rows[i].id;
							var state = rows[i].key;
							var cName = 'submission_' + $n2.utils.stringToHtmlId(subDocId);
							var $div = $('<div>')
								.addClass('submission')
								.addClass('submission_state_'+state)
								.addClass(cName)
								.appendTo($list)
								.text(subDocId)
								;
							
							docIds.push(subDocId);
						};
						
						_this._fetchSubmissionDocs(docIds);
					}
					,onError: function(err){ 
						_this.logger.error('Unable to fetch submission information: '+err);
					}
				});
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
				
				var $info = $('<div class="submission_info">')
					.appendTo($entry);
				addKeyValue($info, _loc('Submission Id'), subDocId);
				if( subDoc.nunaliit_submission 
				 && subDoc.nunaliit_submission.original_info ){
					var originalInfo = subDoc.nunaliit_submission.original_info;
					addKeyValue($info, _loc('Original Id'), originalInfo.id);
					
					var type = _loc('update');
					if( subDoc.nunaliit_submission.deletion ) {
						type = _loc('deletion');
					} else if( !originalInfo.rev ) {
						type = _loc('creation');
					};
					addKeyValue($info, _loc('Submission Type'), type);
				};
				
				var $buttons = $('<div class="submission_buttons">')
					.appendTo($entry);
				$('<button>')
					.text( _loc('Approve') )
					.appendTo($buttons)
					.click(function(){
						_this._approve(subDocId);
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
			var _this = this;
			
			this.submissionDb.getDocument({
				docId: subDocId
				,onSuccess: function(doc){
					if( doc.nunaliit_submission ){
						doc.nunaliit_submission.state = 'approved';
						_this.submissionDb.updateDocument({
							data: doc
							,onSuccess: function(docInfo){
								_this.logger.log( _loc('Submision approved') );
								_this._refreshSubmissions();
							}
							,onError: function(err){ 
								_this.logger.error( _loc('Unable to update submision document: {err}',{err:err}) ); 
							}
						});
					} else {
						_this.logger.error( _loc('Invalid submision document returned') ); 
					};
				}
				,onError: function(err){
					_this.logger.error( _loc('Unable to obtain submision document: {err}',{err:err}) ); 
				}
			});
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