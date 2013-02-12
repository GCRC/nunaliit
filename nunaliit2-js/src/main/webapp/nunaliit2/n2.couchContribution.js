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

$Id: n2.couchContribution.js 8464 2012-08-30 15:43:23Z jpfiset $
*/

// @ requires n2.utils.js
// @ requires n2.class.js

;(function($,$n2){

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };

var addContributionSchema = new $n2.form.Schema({
	title: null
	,okButton: true
	,cancelButton: true
	,attributes: [
		{
			name: 'title'
			,label: _loc('Title')
			,selector: 'nunaliit_contribution.title'
			,type: 'text'
			,className: 'contributionTitle'
			,description: 'The title of the contribution'
		}
		,{
			name: 'description'
			,label: _loc('Description')
			,selector: 'nunaliit_contribution.description'
			,type: 'textarea'
			,className: 'contributionDescription'
			,description: 'The creator of the entity'
		}
		,{
			name: 'media'
			,label: _loc('Media')
			,type: 'file'
			,description: 'Media associated with contribution'
		}
	]
});	

var defaultOptions = {
	db: null
	,designDoc: null
	,showService: null // asynchronous resolver
	,uploads: null // form upload client
	,searchView: 'upload-type-text-search'
	,contributionFromReferenceView: 'contributions'
	,addContributionSchema: addContributionSchema
};	
	
$n2.couchContributions = $n2.Class({
	
	options: null
	,lookAheadCounter: null
	,lookAheadMap: null
	
	,initialize: function(options_) {
		this.options = $n2.extend({}, defaultOptions, options_);
		
		this.lookAheadCounter = 0;
		this.lookAheadMap = {};
	}

	,performContributionSearch: function(opts_) {
		var opt = $n2.extend({
			searchTerms: null
			,uploadType: null
			,searchLimit: 25
			,docsOnly: true
			,onSuccess: function(docs){}
			,onError: function(error){}
		},opts_);
		
		var searchTerms = opt.searchTerms;
		
		// Search for each term, and merge results later
		var searchResults = {
			pending: searchTerms.length
			,map: {}
			,sorted: []
		};
		
		for(var i=0,e=searchTerms.length; i<e; ++i) {
			this.options.designDoc.queryView({
				viewName: this.options.searchView
				,startkey: [opt.uploadType, searchTerms[i], 0]
				,endkey: [opt.uploadType, searchTerms[i], {}]
				,limit: opt.searchLimit
				,onSuccess: function(rows) {
					ReportSearchResults(rows);
				}
			});
		};
		
		function ReportSearchResults(rows) {

			// Remember the returned response
			--searchResults.pending;
			
			for(var i=0,e=rows.length; i<e; ++i) {
				var doc = rows[i].value;
				var index = rows[i].key[2];
				
				if( searchResults.map[doc._id] ) {
					// Document already found, increment terms
					var m = searchResults.map[doc._id];
					++m.terms;
					if( m.index > index ) m.index = index;
				} else {
					var m = {
						doc: doc
						,id: doc._id
						,index: index
						,terms: 1
					};
					searchResults.map[doc._id] = m;
					searchResults.sorted.push(m);
				}
			};
			
			// Wait for all requests
			if( searchResults.pending > 0 ) return;
			
			// Sort results
			searchResults.sorted.sort(function(a,b){
				if( a.terms > b.terms ) {
					return -1;
				} else if( a.terms < b.terms ) {
					return 1;
				} else {
					if( a.index < b.index ) {
						return -1;
					} else if( a.index > b.index ) {
						return 1;
					};
				};
				
				return 0;
			});
			
			var result = [];
			for(var i=0,e=searchResults.sorted.length; i<e; ++i) {
				if( i > opt.searchLimit ) break;

				var m = searchResults.sorted[i];
				if( opt.docsOnly ) {
					result.push(m.doc);
				} else {
					result.push(m);
				};
			};
			
			// Callback
			opt.onSuccess(result);
		};
	}
	
	,displayContributionSelection: function($elem, contributionDocs, opts_) {
		var opt = $n2.extend({
			onSuccess: function(doc){}
			,onError: function(error){}
		},opts_);
		
		$elem.empty();
		
		for(var i=0,e=contributionDocs.length; i<e; ++i) {
			var contributionDoc = contributionDocs[i];
			var $div = $('<div class="couchContributionSelect" style="border:1px solid #000000"></div>');
			$elem.append($div);
			this.displayContribution($div, contributionDoc);
			installSelection($div, contributionDoc);
		}
		
		function installSelection($div, contributionDoc) {
			$div.click(function(){
				opt.onSuccess(contributionDoc);
			});
		}
	}
	
	,displayContribution: function($elem, contributionDoc) {
		$elem.empty();

		var docUrl = this.options.db.getDocumentUrl(contributionDoc);
		
		if( contributionDoc.converted ) {
			var linkDiv = null;
			if( contributionDoc.gcrc_upload_type === 'image' 
			 && contributionDoc.thumbnail ) {
				linkDiv = $('<div class="contribution_media_icon_wrapper"><img src="'+docUrl+'/thumbnail"/></div>');

			} else if( contributionDoc.gcrc_upload_type === 'image' ) {
				linkDiv = $('<div class="contribution_media_icon_wrapper"><div class="contribution_media_icon contribution_image_icon"></div></div>');
			
			} else if( contributionDoc.gcrc_upload_type === 'audio' ) {
				linkDiv = $('<div class="contribution_media_icon_wrapper"><div class="contribution_media_icon contribution_audio_icon"></div></div>');
				
			} else if( contributionDoc.gcrc_upload_type === 'video' 
			 && contributionDoc.thumbnail ) {
				linkDiv = $('<div class="contribution_media_icon_wrapper"><img src="'+docUrl+'/thumbnail"/></div>');
			
			} else if( contributionDoc.gcrc_upload_type === 'video' ) {
				linkDiv = $('<div class="contribution_media_icon_wrapper"><div class="contribution_media_icon contribution_video_icon"></div></div>');
			};
			
			if( null != linkDiv ) {
				$elem.append(linkDiv);
				var cb = createMediaCallback(
						contributionDoc.gcrc_upload_type
						,docUrl
						,contributionDoc
					);
				linkDiv.click(cb);
			};
		};
		
		
		if( contributionDoc.nunaliit_contribution
		 && contributionDoc.nunaliit_contribution.nunaliit_type 
		 && contributionDoc.nunaliit_contribution.nunaliit_type == 'contribution' ) {
			if( contributionDoc.nunaliit_contribution.title ) {
				$elem.append( $('<div>'+_loc('Title')+': '+contributionDoc.nunaliit_contribution.title+'</div>') );
			};
			if( contributionDoc.nunaliit_contribution.description ) {
				$elem.append( $('<div>'+_loc('Description')+': '+contributionDoc.nunaliit_contribution.description+'</div>') );
			};
		};
		$elem.append( $('<div>'+_loc('id')+': '+contributionDoc._id+'</div>') );

		if( contributionDoc.original ) {
			$elem.append( $('<div>file: '+contributionDoc.original.name+' ('+contributionDoc.original.mimeType+')</div>') );
		};

		var createdByUser = null;
		var createdTime = null;
		if( contributionDoc.nunaliit_created ) {
			if( contributionDoc.nunaliit_created.name ) {
				createdByUser = contributionDoc.nunaliit_created.name;

				var $createdByDiv = $('<div>'+_loc('Created by')+': <span></span></div>');
				if( this.options.showService ) {
					this.options.showService.printUserName(
							$createdByDiv.find('span')
							,createdByUser
							,{showHandle:true}
							);
				} else {
					$createdByDiv.find('span').text(createdByUser);
				};

				if( contributionDoc.nunaliit_created.time ) {
					createdTime = contributionDoc.nunaliit_created.time;
					var dateStr = (new Date(createdTime)).toString();
					$createdByDiv.append( $('<span> on '+dateStr+'</span>') );
				};
				$elem.append( $createdByDiv );
			};
		};
		if( contributionDoc.nunaliit_last_updated ) {
			if( contributionDoc.nunaliit_last_updated.name ) {
				// Report only if different than created
				var lastUpdatedByUser = contributionDoc.nunaliit_last_updated.name;
				var lastUpdatedTime = contributionDoc.nunaliit_last_updated.time;
				if( lastUpdatedByUser != createdByUser || lastUpdatedTime != createdTime ) {
					var $lastUpdatedDiv = $('<div>'+_loc('Last updated by')+': <span></span></div>');

					if( this.options.showService ) {
						this.options.showService.printUserName(
								$lastUpdatedDiv.find('span')
								,lastUpdatedByUser
								,{showHandle:true}
								);
					} else {
						$lastUpdatedDiv.find('span').text(lastUpdatedByUser);
					};

					if( lastUpdatedTime ) {
						var dateStr = (new Date(lastUpdatedTime)).toString();
						$lastUpdatedDiv.append( $('<span> on '+dateStr+'</span>') );
					};
					$elem.append( $lastUpdatedDiv );
				};
			};
		};
		
		$elem.append( $('<div style="clear:both"></div>') );
		
		function createMediaCallback(uploadType, docUrl, doc) {

			return function() {
				var mediaOptions = {
					url: docUrl +'/converted'
				};
				if( doc.nunaliit_contribution && doc.nunaliit_contribution.title ) {
					mediaOptions.title = doc.nunaliit_contribution.title;
				};
				if( doc.nunaliit_created && doc.nunaliit_created.name ) {
					mediaOptions.author = doc.nunaliit_created.name;
				};
				if( doc.nunaliit_contribution && doc.nunaliit_contribution.description ) {
					mediaOptions.description = doc.nunaliit_contribution.description;
				};

				if( uploadType === 'image' ) {
					mediaOptions.type = 'image';
					$n2.mediaDisplay.displayMedia(mediaOptions);
					
				} else if( uploadType === 'video' ) {
					mediaOptions.type = 'video';
					$n2.mediaDisplay.displayMedia(mediaOptions);
					
				} else if( uploadType === 'audio' ) {
					mediaOptions.type = 'audio';
					$n2.mediaDisplay.displayMedia(mediaOptions);
				};
			};
		};
	}
	
	,searchTextBox: function(opt_) {
		var _this = this;
		
		var opt = $n2.extend({
			elem: null
			,lookAheadView: 'text-lookahead'
			,lookAheadList: 'text-lookahead'
			,lookAheadLimit: 5
			,lookAheadPrefixMin: 3
			,lookAheadCacheSize: 10
			,onSuccess: function(terms){}
		},opt_);
		
		var $elem = opt.elem;
		if( typeof($elem) === 'string' ) {
			$elem = $('#'+$elem);
		} else {
			$elem = $($elem);
		};

		var $lookUpDiv = $('<div class="couchLookahead"></div>');
		var divider = $('<div class="couchLookaheadDivider"></div>');
		divider.append($lookUpDiv);
		var $input = $('<input type="text"/>');
		var holder = $('<div></div>');
		holder.append($input).append(divider);
		$elem.empty().append(holder);

		var skipKeyUp = false;
		
		$input.keypress(SearchInputKeyPressed);
		$input.keyup(SearchInputKeyUp);
		
		function SearchInputKeyPressed(evt) {
			var charCode = null;
			if (null != evt && null != evt.which) {
				charCode = evt.which;
			} else if (null != window.event && null != window.event.keyCode) { // IE
				charCode = window.event.keyCode;
			};

			if (13 == charCode || null == charCode) {
				// carriage return or I'm not detecting key codes
				// and have to submit on each key press - yuck...
				ProcessSearchInput();
			};
		};

		function SearchInputKeyUp(evt) {
			if( skipKeyUp ) {
				skipKeyUp = false;
			} else {
				ProcessLookAhead();
			};
		};

		function ProcessSearchInput() {
			skipKeyUp = true;
			
			var searchTerms = GetSearchTerms();
			opt.onSuccess(searchTerms);

			CloseLookAhead();
		};

		function ProcessLookAhead() {
			var searchTerms = GetSearchTerms();

			var index = searchTerms.length - 1;
			if( index >= 0 ) {
				var lastTerm = searchTerms[index];
				var previousWords = null;
				if( index > 0 ) {
					previousWords = searchTerms.slice(0,index);
				};
			};

			if( !lastTerm ) {
				CloseLookAhead();
				return;
			};
			if( lastTerm.length < opt.lookAheadPrefixMin ) {
				CloseLookAhead();
				return;
			};

			var previousWordsString = '';
			if( previousWords ) {
				previousWordsString = previousWords.join(' ') + ' ';
			};

			QueryLookAhead(lastTerm,function(prefix,words){
				$lookUpDiv.empty();
				if( words.length > 0 ) {
					$lookUpDiv.css('display','block');
				} else {
					$lookUpDiv.css('display','none');
				};
				for(var i=0,e=words.length; i<e; ++i) {
					var offered = words[i].substring(prefix.length);
					var line = $('<div class="couchLookaheadLine '
						+( i%2 ? 'couchLookaheadLineOdd' : 'couchLookaheadLineEven' )+'">'
						+'<span class="couchLookaheadTyped">'
						+previousWordsString+prefix+'</span>'
						+'<span class="offered">'+offered+'</span>'
						+'</div>'
						);
					installClick(line,previousWordsString+words[i]);
					$lookUpDiv.append( line );
				};
			});

			function installClick($elem, wordString) {
				$elem.click(function(){
					$input.val(wordString);
					var terms = wordString.split(' ');
					opt.onSuccess(terms);
					CloseLookAhead();
				});
			};
		};

		function CloseLookAhead() {
			$lookUpDiv.css('display','none');
		};
		
		function GetSearchTerms() {
			var searchTerms = $input.val();
			
			searchTerms = searchTerms.split(/[ \t\r\n]+/);

			return searchTerms;
		};

		function QueryLookAhead(prefix,callback) {
			// Do we have exact match in cache?
			if( _this.lookAheadMap[prefix] ) {
				callback(prefix,_this.lookAheadMap[prefix].words);
				return;
			};
			
			// Look for complete results from shorter prefix
			var sub = prefix.substring(0,prefix.length-1);
			while( sub.length >= opt.lookAheadPrefixMin ) {
				if( _this.lookAheadMap[sub] && _this.lookAheadMap[sub].full ) {
					callback(prefix,_this.lookAheadMap[sub].words);
					return;
				};
				sub = sub.substring(0,sub.length-1);
			};
			
			// Make request
			_this.options.designDoc.queryView({
				viewName: opt.lookAheadView
				,listName: opt.lookAheadList
				,startkey: prefix
				,endkey: prefix + '\u9999'
				,top: opt.lookAheadLimit
				,group: true
				,onlyRows: false
				,reduce: true
				,onSuccess: function(response) {
					var rows = response.rows;

					var words = [];
					for(var i=0,e=rows.length; i<e; ++i) {
						words.push(rows[i][0]);
					};
					
					// Cache
					_this.lookAheadMap[prefix] = {
						prefix: prefix
						,words: words
						,full: response.all_rows
						,counter: _this.lookAheadCounter
					};
					++_this.lookAheadCounter;
					
					// Trim cache
					var keysToDelete = [];
					for(var key in _this.lookAheadMap) {
						if( _this.lookAheadMap[key].counter < (_this.lookAheadCounter-opt.lookAheadCacheSize) ) {
							keysToDelete.push(key);
						};
					};
					for(var i=0,e=keysToDelete.length; i<e; ++i) {
						delete _this.lookAheadMap[keysToDelete[i]];
					};
					
					callback(prefix,words);
				}
			});
		};
	}
	
	,searchContributions: function(opt_) {
		var _this = this;
		
		var opt = $n2.extend({
			elem: null
			,uploadType: null
			,onSuccess: function(selectedContribution){}
		},opt_);
		
		var $elem = opt.elem;
		if( typeof($elem) === 'string' ) {
			$elem = $('#'+$elem);
		} else {
			$elem = $($elem);
		};

		var $search = $('<div></div>');
		var $result = $('<div></div>');
		
		$elem.empty().append($search).append($result);
		
		this.searchTextBox({
			elem: $search
			,onSuccess: function(terms){
				_this.performContributionSearch({
					searchTerms: terms
					,uploadType: opt.uploadType
					,onSuccess: receiveContributions
				});
			}
		});
		
		function receiveContributions(contributions) {
			_this.displayContributionSelection($result, contributions, {
				onSuccess: selectedContribution
			});
		}
		
		function selectedContribution(contribution) {
			$elem.empty();
			opt.onSuccess(contribution);
		}
	}
	
	,getContributionsForReference: function(opt_) {
		var _this = this;
		
		var opt = $n2.extend({
			docId: null
			,onSuccess: function(contributions){}
			,onError: function(err){ $n2.reportError(err); }
		},opt_);

		var docId = opt.docId;
		if( null == docId ) {
			opt.onError('DocId must be supplied when contributions are retrieved');
			return;
		};
		
		this.options.designDoc.queryView({
			viewName: this.options.contributionFromReferenceView
			,startkey: docId
			,endkey: docId
			,onSuccess: function(rows) {
				var contributions = [];
				for(var i=0,e=rows.length; i<e; ++i) {
					contributions.push(rows[i].value);
				};
				opt.onSuccess(contributions);
			}
			,onError: opt.onError
		});
	}
	
	,buildAddContributionForm: function(opt_) {
		var _this = this;
		
		var opt = $n2.extend({
			elem: null
			,referenceDocId: null
			,replyContributionId: null
			,onSuccess: function(){}
			,onCancel: function(){}
		},opt_);
		
		var $elem = opt.elem;
		if( typeof($elem) === 'string' ) {
			$elem = $('#'+$elem);
		} else {
			$elem = $($elem);
		};
		
		var contributionDoc = {
			nunaliit_contribution: {
				nunaliit_type: 'contribution'
			}
		};
		
		if( opt.referenceDocId ) {
			contributionDoc.nunaliit_contribution.reference = {
				nunaliit_type: 'reference'
				,doc: opt.referenceDocId
			};
		};
		
		if( opt.replyContributionId ) {
			contributionDoc.nunaliit_contribution.reply = {
				nunaliit_type: 'reference'
				,doc: opt.replyContributionId
			};
		};
		
		$n2.couchMap.adjustDocument(contributionDoc);
		
		var form = this.options.addContributionSchema.createForm($elem, contributionDoc, {
			preOK: function() {
				
				// First, make sure upload server is present
				_this.options.uploads.getWelcome({
					onSuccess:function(welcomeData){
						// Second, create a document for the contribution. This
						// enables the atlas to verify that the user has the required
						// priviledges for submitting a contribution.
						_this.options.db.createDocument({
							data: contributionDoc
							,onSuccess: function(docInfo) {
								// Third, upload file to contribution. This is done via the
								// upload service. Add id and rev of document.
								var $form = $(form.form);
								$form.prepend( $('<input type="hidden" name="id" value="'+docInfo.id+'"/>') );
								$form.prepend( $('<input type="hidden" name="rev" value="'+docInfo.rev+'"/>') );
								_this.options.uploads.submitForm({
									form: $form
									,onSuccess: opt.onSuccess
									,onError: function(err) {
										$n2.reportError('Error uploading file: '+err);
									}
								});
							}
							,onError: function(err){
								$n2.reportError('Unable to reach database to submit document: '+err);
							}
						});
					}
					,onError:function() {
						$n2.reportError('Unable to reach atlas server');
					}
				});

				
				return false;
			}
			,postCancel: opt.onCancel
		});
	}
});

})(jQuery,nunaliit2);