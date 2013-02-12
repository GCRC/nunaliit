;(function($,$n2){
	// Localization
	var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };
	
	var RestoreWindow = $n2.Class({
		options: null
		
		,divId: null
		
		,deletedDocClick: null
		
		,docRevisionClick: null
		
		,initialize: function(opts_){
			this.options = $n2.extend({
				div: null
				,atlasDb: null
				,directory: null
				,tool: null
			},opts_);
			
			var _this = this;
			
			this.divId = this.options.div.attr('id');
			if( !this.divId ) {
				this.divId = $n2.getUniqueId();
				this.options.div.attr('id',this.divId);
			};
			
			this.deletedDocClick = function(){
				var $link = $(this);
				
				var docId = $link.attr('data-docid');
				var rev = $link.attr('data-rev');
				
				_this._deletedDocSelected(docId,rev);
				
				return false;
			};
			
			this.docRevisionClick = function(){
				var $link = $(this);
				
				var docId = $link.attr('data-docid');
				var rev = $link.attr('data-rev');
				var lastRev = $link.attr('data-lastrev');
				
				_this._docRevisionSelected(docId,rev,lastRev);
				
				return false;
			};
			
			this._refresh();
		}
	
		,_refresh: function(){
			var $div = this._getDisplayDiv();
			if( $div.length > 0 ){
				// Deleted list
				var $deletedList = $div.find('.restoreDeletedList');
				if( $deletedList.length < 1 ){
					$deletedList = $('<div class="restoreDeletedList"></div>');
					$div.append($deletedList);
				};
				this._refreshDeletedList($deletedList);
				
				// Revision list
				var $revisionList = $div.find('.restoreRevisionList');
				if( $revisionList.length < 1 ){
					$revisionList = $('<div class="restoreRevisionList"></div>');
					$div.append($revisionList);
				};
				
				// Display Div
				var $displayDiv = $div.find('.restoreDisplay');
				if( $displayDiv.length < 1 ){
					$displayDiv = $('<div class="restoreDisplay"></div>');
					$div.append($displayDiv);
				};
			};
		}
		
		,_refreshDeletedList: function($deletedList){
			var _this = this;
			
			var $deletedHeader = $deletedList.find('.restoreDeletedHeader');
			if( $deletedHeader.length < 1 ){
				$deletedHeader = $('<div class="restoreDeletedHeader">Deleted Documents <button>Refresh</button></div>');
				$deletedList.append($deletedHeader);
				$deletedHeader.find('button').click(function(){
					var $div = _this._getDisplayDiv();
					$div.find('.restoreDeletedDocs').remove();
					_this._refresh();
					return false;
				});
			};

			var $deletedDocs = $deletedList.find('.restoreDeletedDocs');
			if( $deletedDocs.length < 1 ){
				$deletedDocs = $('<div class="restoreDeletedDocs"></div>');
				$deletedList.append($deletedDocs);
				
				$deletedDocs.append('<span>Loading...</span>');
				
				this.options.tool._getChanges({
					onSuccess: function(changes){
						var $div = _this._getDisplayDiv();
						var $deletedDocs = $div.find('.restoreDeletedDocs');
						$deletedDocs.empty();
						var deletedDocs = {};
						if(changes && changes.results){
							for(var i=0,e=changes.results.length; i<e; ++i){
								var r = changes.results[i];
								var id = r.id;
								if( r.deleted && r.changes ){
									for(var j=0,k=r.changes.length;j<k;++j){
										var c = r.changes[j];
										var rev = c.rev;
										if(!deletedDocs[id]) deletedDocs[id] = {};
										deletedDocs[id][rev] = true;
									};
								};
							};
						};
						for(var docId in deletedDocs){
							var revs = deletedDocs[docId];
							for(var rev in revs){
								var $docDiv = $('<div></div>');
								var $docA = $('<a href="#"></a>');
								$docA.attr('data-docid',docId);
								$docA.attr('data-rev',rev);
								$docA.text(docId);
								$docDiv.append($docA);
								$deletedDocs.append($docDiv);
								$docA.click(_this.deletedDocClick);
							};
						};
					}
					,onError: function(err){
						var $div = _this._getDisplayDiv();
						var $deletedDocs = $div.find('.restoreDeletedDocs');
						$deletedDocs.empty();
						var $err = $('<span></span>');
						$err.text('Error obtaining changes: '+err);
						$deletedDocs.append($err);
					}
				});
			};
		}
		
		,_deletedDocSelected: function(docId, lastRev){
			var _this = this;
			
			$n2.log('Deleted document selected: '+docId+'/'+lastRev);
			
			var $div = this._getDisplayDiv();
			$div.find('.restoreDisplay').empty();
			var $revisionList = $div.find('.restoreRevisionList');
			if( $revisionList.length > 0 ){
				$revisionList.empty();
				$revisionList.append( $('<span>Loading...</span>') );
				
				this.options.atlasDb.getDocument({
					docId: docId
					,rev: lastRev
					,revisions: true
					,onSuccess: function(doc){
						var $div = _this._getDisplayDiv();
						var $revisionList = $div.find('.restoreRevisionList');
						$revisionList.empty();
						var $head = $('<div></div>');
						$head.text('Revisions for '+docId);
						$revisionList.append( $head );
						var revisions = [];
						if( doc._revisions ) {
							var start = doc._revisions.start;
							if( doc._revisions.ids ){
								for(var i=0,e=doc._revisions.ids.length;i<e;++i){
									var id = doc._revisions.ids[i];
									var c = start - i;
									var rev = ''+c+'-'+id;
									revisions.push(rev);
								};
							};
						};
						for(var i=0,e=revisions.length;i<e;++i){
							var revision = revisions[i];
							var $div = $('<div><a href="#"></a></div>');
							$revisionList.append($div);
							$div.find('a')
								.text('rev: '+revision)
								.attr('data-docid',docId)
								.attr('data-rev',revision)
								.attr('data-lastrev',lastRev)
								.click(_this.docRevisionClick);
						};
					}
					,onError: function(errorMsg){ 
						var $div = _this._getDisplayDiv();
						var $revisionList = $div.find('.restoreRevisionList');
						var $e = $('<span></span>');
						$e.text('Error: '+errorMsg);
						$revisionList.empty().append($e);
					}
				});
			};
		}
		
		,_docRevisionSelected: function(docId, rev, lastRev){
			var _this = this;
			
			$n2.log('Revision selected: '+docId+'/'+rev);
			
			var $div = this._getDisplayDiv();
			var $displayDiv = $div.find('.restoreDisplay');
			$displayDiv.empty();
			$displayDiv.append( $('<span>Loading...</span>') );
			
			this.options.atlasDb.getDocument({
				docId: docId
				,rev: rev
				,onSuccess: function(doc){
					var $div = _this._getDisplayDiv();
					var $displayDiv = $div.find('.restoreDisplay');
					$displayDiv.empty();
					
					var $head = $('<div></div>');
					$head.text('Content for '+docId+'/'+rev);
					$displayDiv.append( $head );
					
					var $content = $('<div></div>');
					$displayDiv.append( $content );
					
					new $n2.tree.ObjectTree($content, doc);
					
					var $button = $('<button>Restore this version</button>');
					$displayDiv.append($button);
					$button.click(function(){
						var $btn = $(this);
						_this._restoreRevision($btn, doc, lastRev);
						return false;
					});
				}
				,onError: function(errorMsg){ 
					var $div = _this._getDisplayDiv();
					var $displayDiv = $div.find('.restoreDisplay');
					var $e = $('<span></span>');
					$e.text('Error: '+errorMsg);
					$displayDiv.empty().append($e);
				}
			});
		}

		,_restoreRevision: function($btn, doc, lastRev){
			var _this = this;
			
			$btn.attr('disabled','disabled');
			
			var docCopy = {};
			for(var key in doc){
				docCopy[key] = doc[key];
			};
			
			docCopy._rev = lastRev;
			
			this.options.atlasDb.updateDocument({
				data: docCopy
				,onSuccess: function(){
					alert('Restored!');
				}
				,onError: function(errorMsg){
					var $e = $('<div></div>');
					$e.text('Error: '+errorMsg);
					$btn.after($e);
				}
			});
		}
		
		,_getDisplayDiv: function(){
			var $div = $('#'+this.divId);
			return $div;
		}
	});
	
	var RestoreTool = $n2.Class({
		options: null
		
		,initialize: function(opts_){
			this.options = $n2.extend({
				atlasDb: null
				,directory: null
			},opts_);
		}
	
		,show: function(opts_){
			
			var opts = $n2.extend({
				div: null
			},opts_);
			
			opts.atlasDb = this.options.atlasDb;
			opts.directory = this.options.directory;
			opts.tool = this;
			
			var w = new RestoreWindow(opts);
			
			return w;
		}
		
		,_getChanges: function(opts){
			this.options.atlasDb.getChanges(opts);
		}
	});

	$n2.restoreTool = {
		RestoreTool: RestoreTool
	};
})(jQuery,nunaliit2);