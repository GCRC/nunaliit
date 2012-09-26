/*
Copyright (c) 2009, Geomatics and Cartographic Research Centre, Carleton 
University. All rights reserved.

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

$Id: olkit_PlaceInfo.js 8165 2012-05-31 13:14:37Z jpfiset $
*/

// @requires n2.utils.js

;(function($,$n2){


var options = null;
var feature = null;
var repository = {};
var dbSearchEngine = null;
var contributionDb = null;
var NULL_RELATED_TO = -1;
var cdf = null;


function contributionAddClick(placeId, relatedTo) {
	if( $.NUNALIIT_AUTH ) {
		// The auth module is present, check if user logged in
		if( $.NUNALIIT_AUTH.getUser() ) {
			if( NUNALIIT_CONTRIBUTIONS ) {
				var dataObj = {
						place_id: placeId
					};
				if (relatedTo) {
					dataObj.related_to = relatedTo;
				}
				NUNALIIT_CONTRIBUTIONS.acceptsContribution({ data : dataObj });
			} else {
				alert("Contribution module not installed.");
			};
		} else {
			// User is not logged in
			$.NUNALIIT_AUTH.login({
				onSuccess:function(){
					contributionAddClick(placeId, relatedTo);
					}
				,anonymousLoginAllowed: true
			});
		};
	} else {
		alert("Authentication module not installed.");
	};
}

function contributionUpdateClick(contributionId) {

	var contrib = getContribution(contributionId);
	if (null == contrib) {
		return;
	};
	
	if ($.NUNALIIT_AUTH) { // The auth module is present
		var dataObj = $.extend({}, contrib); // copy contribution fields
		var allowed = false;
		if (null != contrib.contributor) {
			allowed = $.NUNALIIT_AUTH.isUpdateAllowed(contrib.contributor.display);
		} else {
			// allows admin updating, even if no contributor info stored with contribution
			allowed = $.NUNALIIT_AUTH.isUpdateAllowed('');
		}
		if (allowed) {
			if (NUNALIIT_CONTRIBUTIONS) {
				NUNALIIT_CONTRIBUTIONS.acceptsContributionUpdate({ data: dataObj });
			} else {
				alert("Contribution module not installed.");
			};
		} else { // User is not logged in appropriately
			$.NUNALIIT_AUTH.login({
				onSuccess:function(){
					contributionUpdateClick(contributionId, placeId);
					}
				,anonymousLoginAllowed: false
				,prompt: 'Please login.'
			});
		};
	} else {
		alert("Authentication module not installed.");
	};
};

function contributionDeleteClick(contributionId, placeId) {
	if( $.NUNALIIT_AUTH ) {
		// The auth module is present, check if user is admin
		var allowed = $.NUNALIIT_AUTH.isDeleteAllowed();
		if (allowed) {
			if( NUNALIIT_CONTRIBUTIONS ) {
				if( confirm('Are you sure you want to delete this contribution?') ) {
					var options = {
							data: {
								id: contributionId
								,placeId: placeId
							}
							,onSuccess: onSuccess
							,onError: onError
						};
					NUNALIIT_CONTRIBUTIONS.deleteContribution(options);
				};
			} else {
				alert("Contribution module not installed.");
			};
		} else {
			// User is not logged in as admin
			$.NUNALIIT_AUTH.login({
				onSuccess:function(){
					contributionDeleteClick(contributionId, placeId);
					}
				,anonymousLoginAllowed: false
				,prompt: 'Please login with administrative credentials'
			});
		};
	} else {
		alert("Authentication module not installed.");
	};
	
	function onSuccess(msg, textStatus) {
	};
	function onError(xmlHttpRequest, textStatus, errorThrown) {
		alert('Error occurred while deleting a contribution. You might need to refresh your page.');
	};
};

/*
 * Formatter for contribution displays
 */
$n2.contributionDisplayFormatter = function(aoOptions,dbSearchEngine_) {
	var defaults = {
		contribTableClassBase: "contrib" /* modified as needed to create columns */
		,contributionAddClick: contributionAddClick
		
		/*
		 * contribution media icon click handler
		 * @param key repository key for the contribution
		 * @param path media folder path to be concatenated with contribution filename
		 * @param contribFormatterOptions display options in effect for contributions
		 * 
		 * Note: providing an external function to do app specific display requires that
		 * it have it's own way of accessing the contribution since it is only referenced
		 * by key.
		 */
		,contribMediaClick: function(key, path, contribFormatterOptions){ $n2.reportError('contribMediaClick not installed properly'); }
		,contributionDeleteClick: contributionDeleteClick
		,contributionUpdateClick: contributionUpdateClick
		,showRespondLink: false /* offer a response link in the display */
		,showContribInfoIcons: false
		,keysAreStrings: false
		,showContribAuthor: true
		,mediaDisplayVideoWidth: 320
		,mediaDisplayVideoHeight: 240
		,showCreateTS: false
		,iconPath: 'nunaliit2/images/' // in case, nunaliit2 moves around relative to the base of the app
		
		// if true, audio elements will be directly embedded in contribution rather than linked to modal display
		,embedAudioDirectly: false
		
		// if true, last edit info (contributor id and time) are displayed
		,showLastEditInfo: true
		
		/*
		 * array of optional field descriptions:  text and url are property names for
		 * the desired data in a contribution.
		 * [
		 * 	{ 
		 * 		isUrl: boolean => look for url and text; false or null => just text
		 * 		text: visible description
		 * 		url: web address to be embedded in <a> tag.
		 * 		class: (additional) class tags to attach to created fields
		 *      leader: (optional) text to be stuck at the beginning of the text (e.g., "home: ")
		 * 	}
		 * ]
		 */
		,additionalFields: []
	};
	var options = $.extend({}, defaults, aoOptions);


	var dbSearchEngine = dbSearchEngine_;
	
	
	var extensionType_basic = "basic";
	var extensionType_startRelated = "start_related";
	var extensionType_contRelated = "cont_related";
	var extensionType_endRelated = "end_related";
	function classExtensions(base, type, lastRow) {
		var ret;
		
		if (extensionType_basic == type || extensionType_startRelated == type) {
			ret = [ base+'_fullwidth '+base+'_solid_top_border' ];
		} else {
			ret = [
				base+'_left '+base+'_center_marker',
				base+'_right '+base+'_dashed_top_border' ];
		}
		
		/*
		 * only do bottom borders on table entries if this is the last entry in the table.
		 */
		if (lastRow) {
			for (var j=0; j<ret.length; j++) {
				ret[j] += ' '+base+'_solid_bottom_border';
			}
		}
		return(ret);
	}
	
	function getMediaIconClassExtension(type) {
		return("_entry_"+type+"_icon");	
	}

	function getAltTagFromMediaType(type) {
		return("a contributed "+type+" file");
	}
	
	function formatKey(key) {
		if (true == options.keysAreStrings) {
			return("'"+key+"'");
		} else {
			return(key);
		}
	};
	
	function getContributorLabel(contribution) {
		if( null == contribution || null == contribution.contributor ) {
			return('by <span class="'+options.contribTableClassBase+'_entry_contributor_unknown">Unknown</span>');
		};
		if( contribution.contributor.anonymous ) {
			return('by <span class="'+options.contribTableClassBase+'_entry_contributor_guest">Guest</span>');
		};
		if( contribution.contributor.display ) {
			return('by <span class="'+options.contribTableClassBase+'_entry_contributor_name">'+contribution.contributor.display+'</span>');
		};
		return('by <span class="'+options.contribTableClassBase+'_entry_contributor_unknown">Unknown</span>');
	};
	   
	function getLastContributorLabel(contribution) {
		if (null == contribution || null == contribution.lastContributor) {
			return('Unknown');
		};
		if (contribution.lastContributor.anonymous) {
			return('Guest');
		};
		if (contribution.lastContributor.display) {
			return(contribution.lastContributor.display);
		};
		return('Unknown');
	};
	
	function formatFileSize(value_) {
		var _1M = 1048576;
		var _1K = 1024;
		
		if (value_ > _1M) {
			return('' + (value_ / _1M).toFixed(1) + '<br/>MBytes');
		} else if (value_ > _1K) {
			return('' + (value_ / _1K).toFixed(1) + '<br/>KBytes');
		}
		return('' + value_ + '<br/>Bytes');
	}
	
	/*
	 * format a timestamp for display.  Our server code returns timestamps as objects
	 * with raw (ts) and formatted (string) properties.  Use the raw so that the 
 	 * client's locale can factor in timezone etc.
 	 */
	function formatTimestamp(ts_) {
		var d = new Date(ts_.raw);
		return(d.toString());
	}
	   
	return {
		/*
		 * cont      : the contribution
		 * parms:
		 * - key     : key for element (caller must be able to use this key to identify element - used in onclick)   
		 * - rowType : basic, start_related, cont_related, end_related
		 * lastRow   : boolean - true => this contribution is the last row; false otherwise
		 */
		formatAsTR : function(cont, parms, lastRow) {
				var classExts = classExtensions(options.contribTableClassBase+"_entry", parms.rowType, lastRow);
				var mediaType;
				
				var isDeleteAllowed = false;
				var isUpdateAllowed = false;
		    	if( $.NUNALIIT_AUTH ) {
					isDeleteAllowed = $.NUNALIIT_AUTH.isDeleteAllowed();
					if (null != cont.contributor) {
						isUpdateAllowed = $.NUNALIIT_AUTH.isUpdateAllowed(cont.contributor.display);
					} else {
						// allows admin updating, even if no contributor info stored with contribution
						isUpdateAllowed = $.NUNALIIT_AUTH.isUpdateAllowed('');
					}
		    	};
				
				// Result is a tr element
				var htmlElem = $('<tr class="'+options.contribTableClassBase+'"></tr>');
				
				if (extensionType_basic == parms.rowType || extensionType_startRelated == parms.rowType) {
					var tdElem = $('<td colspan="2" class="'+classExts[0]+'"></td>');
					htmlElem.append(tdElem);
				} else {
					var tdElem = $('<td class="'+classExts[0]+'"><img src="' + options.iconPath + 'comment_relation.png" alt="related comment marker"/></td>');
					htmlElem.append(tdElem);

					var tdElem = $('<td class="'+classExts[1]+'"></td>');
					htmlElem.append(tdElem);
				}
				
				// media icon/thumbnail, if appropriate - see separate directly embedded audio case below
				mediaType = $n2.getMediaType(cont.filename, cont.mimetype);
				if (null != mediaType) {
					if (true != options.embedAudioDirectly || 'audio' != mediaType) { // embed link to modal display
						var htmlString = 
							'<div class="contrib_entry_media_icon_wrapper">' +
								'<div class="'+options.contribTableClassBase+'_entry_media_icon '+
									options.contribTableClassBase+getMediaIconClassExtension(mediaType)+'"'+
									' alt="'+getAltTagFromMediaType(mediaType)+'">'+
								'</div>';
						if (typeof cont.file_size != 'undefined' && cont.file_size > 0) {
							htmlString += formatFileSize(cont.file_size);
						}
						htmlString += '</div>';
						var mediaIconDiv = $(htmlString);
						mediaIconDiv.click(function(){
							options.contribMediaClick(parms.key, dbSearchEngine.getRelMediaPath(), options);
						});
						tdElem.append(mediaIconDiv);
					}
				} else if (true == options.showContribInfoIcons) { // used for search results
					var mediaIconDiv = $('<div class="'+options.contribTableClassBase+'_entry_info_icon"'+
						' alt="'+getAltTagFromMediaType(mediaType)+'"></div>');
					mediaIconDiv.click(function(){
						options.contribMediaClick(parms.key, dbSearchEngine.getRelMediaPath(), options);
					});
					tdElem.append(mediaIconDiv);
				}

				// Title
				var titleElem = $('<p class="'+options.contribTableClassBase+'_entry_title">'+cont.title+'</p>');
				tdElem.append(titleElem);
				
				// Contributor
				if (true == options.showContribAuthor) {
					var contributorElem = $('<p class="'+options.contribTableClassBase+'_entry_contributor">'+
						getContributorLabel(cont)+'</p>');
					tdElem.append(contributorElem);
				}
				
				// creation timestamp
				if (true == options.showCreateTS) {
					var tsElem = $('<p class="'+options.contribTableClassBase+'_entry_createTS">Added: '+ 
						formatTimestamp(cont.create_ts) +'</p>');
					tdElem.append(tsElem);
				}
				
				// Notes
				if (null != cont.notes && "" != cont.notes) {
					var notesElem = $('<p class="'+options.contribTableClassBase+'_entry_comment">'+cont.notes+'</p>');
					tdElem.append(notesElem);
				}
				
				// additional fields - optional array of entries
				if (null !== options.additionalFields && $n2.isArray(options.additionalFields)) {
					for (var i=0; i < options.additionalFields.length; i++) {
						var field = options.additionalFields[i];

						var fieldString = null;
						var textString = (! $n2.isDefined(field.text) || field.text === '' ? null : cont[field.text]);
						if ($n2.isDefined(textString) && textString != '') {
							if ($n2.isDefined(field.leader) && field.leader != '') {
								var tmp = field.leader.slice();
								textString = tmp.concat(textString);
							};
						};

						if ($n2.isDefined(field.isUrl) && true === field.isUrl) {
							var urlString = (! $n2.isDefined(field.url) || field.url === '' ? null : cont[field.url]);

							fieldString = $n2.generateHyperlinkHTML(textString, urlString, 
									options.contribTableClassBase+'_entry_field');
						} else {
							fieldString = $n2.generateHyperlinkHTML(textString, null, 
									options.contribTableClassBase+'_entry_field');
						};
						
						if ($n2.isDefined(fieldString) && fieldString != '') {
							tdElem.append($(fieldString));							
						};
					};
				};
	
				
				// embed audio directly if desired
				if (true == options.embedAudioDirectly && 'audio' == mediaType) { // embed link directly rather than via modal display
					var audioPara = $('<p class="'+options.contribTableClassBase+'_entry_embeddedAudio"></p>');
					tdElem.append(audioPara);
					var filePath = dbSearchEngine.getRelMediaPath() + cont.filename;
					var audioElem = $n2.mediaDisplay.generateInlineHtmlForMedia({
						type: mediaType
						,url: filePath
						,autoplay: false
					});
					audioPara.append(audioElem);
				}
				
				// last edit info - stick it at the bottom of the note
				if (true == options.showLastEditInfo) {
					if (null != cont.lastContributor && null != cont.last_edit_timestamp) {
						var lastEditElem = $('<p class="'+options.contribTableClassBase+'_entry_last_edit">'+
							'Last edited by '+getLastContributorLabel(cont)+':'+
							formatTimestamp(cont.last_edit_timestamp) + '</p>');
						tdElem.append(lastEditElem);
					} else if (null != cont.lastContributor) {
						var lastEditElem = $('<p class="'+options.contribTableClassBase+'_entry_last_edit">'+
							'Last edited by '+getLastContributorLabel(cont)+'</p>');
						tdElem.append(lastEditElem);
					}
				}
				
				// Link div - only generate if at least one link to go in it.
				if (true == options.showRespondLink || isUpdateAllowed || isDeleteAllowed) {
					var linkDiv = $('<div class="contrib_entry_link_group"></div>');
					tdElem.append(linkDiv);					
				};

				// Response link
				if (true == options.showRespondLink) {
					if (extensionType_basic == parms.rowType || extensionType_startRelated == parms.rowType) {
						var respLinkElem = $('<a class="'+options.contribTableClassBase+'_entry_link" href="javascript:Respond">respond</a>');
						respLinkElem.click(function(){
							options.contributionAddClick(cont.place_id, parms.key);
							return false;
						});
						linkDiv.append(respLinkElem);
					}
				}
				
				// Update link
				if( isUpdateAllowed ) {
					var updateLinkElem = $('<a class="'+options.contribTableClassBase+'_entry_link" href="javascript:Update">update</a>');
					updateLinkElem.click(function(){
						options.contributionUpdateClick(parms.key,cont.place_id);
						return false;
					});
					linkDiv.append(updateLinkElem);
				};
				
				// Delete link
				if( isDeleteAllowed ) {
					var deleteLinkElem = $('<a class="'+options.contribTableClassBase+'_entry_link" href="javascript:Delete">delete</a>');
					deleteLinkElem.click(function(){
						options.contributionDeleteClick(parms.key,cont.place_id);
						return false;
					});
					linkDiv.append(deleteLinkElem);
				};
				
				return htmlElem;
			},

		getExtensionType_basic : function() {
				return(extensionType_basic);
			},
			
		getExtensionType_startRelated : function() {
				return(extensionType_startRelated);
			},

		getExtensionType_contRelated : function() {
				return(extensionType_contRelated);
			},
			
		getExtensionType_endRelated : function() {
				return(extensionType_endRelated);
			}			
	};
};

	function Configure(options_, dbSearchEngine_, contributionDb_) {
		var defaults = {
			displayDiv: null
			
			/*
			 * place attribute display options
			 *
			 * type:
			 * 'attributes': just list the attributes in a table
			 * 'function': everything before the contributions table is formatted by the specifie function
			 */
			,attribDisplayType: 'attributes' // default - just list the attributes in a table
			
			,attribTableHeading: "Place Data:" // display heading for place attributes table format.
			,attribTableDiv: null       /* place attribute div - created dynamically */
			,attribTableClassBase: "attrib"   /* modified as needed to create columns - see $n2.placeInfo */
			
			,attribHtmlFn: null // attribHtmlFn(divName, options, attributeObj) - fills div 
			
			/*
			 * contributions display options
			 */
			,contribTableHeading: "Contributions:" // display heading for contributions.
			,contribAddButtonText: "Add Yours!"
			,contribListEmptyText: "There are currently no contributions."
			,contribTableDiv: null       /* contributions table div - created dynamically */
			,contribTableClassBase: "contrib" /* modified as needed to create columns */
			,contribTableRespLinks: true // show the respond links on the contributions table.
			,contribTableShowAuthor: true // show the author on each contribution?
			,contribTableShowCreateTS: true // show the creation timestamp on each contribution?
			,contribEmbedAudioDirectly: false // show audio player in modal display
			,contribShowLastEditInfo: true // display id and time of last contribution update
			,contribMediaDisplayVideoHeight: 240
			,contribMediaDisplayVideoWidth: 320
			,contributionAddClick: contributionAddClick
			,contributionDeleteClick: contributionDeleteClick
			,contributionUpdateClick: contributionUpdateClick
			,contribMediaClick: contribMediaClick
			
			/*
			 * array of optional field descriptions:  each is a property name for the desired data
			 * [
			 * 	{ 
			 * 		isUrl: boolean => look for url and text; false or null => just text
			 * 		text: visible description
			 * 		url: web address to be embedded in <a> tag.
			 * 		class: class tag to attach to created fields
			 * 	}
			 * ]
			 */
			,contribAdditionalFields: []
			
			/*
			 * contribution indexing options: how to sort the contributions
			 * default - use indexContributions_default()
			 * simple - conribIndexField specifies the attribute name and an ascending sort is done.
			 * function - an alternative sort function is supplied bby contribIndexFn.
			 */
			,contribIndexingType: 'default'
			,conribIndexField: null
			,contribIndexFn: null // default - use built-in - @return array; fn(repository)
		};
		options = $.extend({}, defaults, options_);
		
		dbSearchEngine = dbSearchEngine_;
		contributionDb = contributionDb_;
		
		
		if (null === options.displayDiv || null === options.contribTableDiv || null === options.attribTableDiv) {
			alert("$n2.placeInfo - displayDiv OR contribTableDiv OR attribTableDiv not specified.");
			return;
		}
		var ddiv = document.getElementById(options.displayDiv);
		if (null === ddiv) {
			alert("$n2.placeInfo - displayDiv ("+options.displayDiv+") not found.");
			return;
		}
	};
	
	function displayPlace() {
		$("#"+options.displayDiv).empty();
	    
		if (options.attribDisplayType == 'attributes') {
			genPlaceHtml_default(options.displayDiv);
		} else if (options.attribDisplayType == 'function' &&
				   options.attribHtmlFn != null) {
			options.attribHtmlFn(options.displayDiv, options, feature.attributes);
		} else {
			alert('$n2.placeInfo: unknown attribDisplayType or required parameters not defined');
		}
	}
		
	function genPlaceHtml_default(divName) {
		var workingHtml =
	    	'<div id="'+options.attribTableDiv+'">'+
	    	'<p><table class="'+options.attribTableClassBase+'_header">'+
			'<tr class="'+options.attribTableClassBase+'_header">'+
			'<td>' + options.attribTableHeading + '</td></tr></table></p><p><table>';
	    for (var i in feature.attributes) {
			if (feature.attributes.hasOwnProperty(i) &&
				feature.attributes[i] !== null) {
				workingHtml += '<tr><td class="label">'+i+
					': </td><td class="info">'+feature.attributes[i]+'</td></tr>';
			}
		}
		workingHtml += '</table></p></div>';
		
		$("#"+options.displayDiv).html(workingHtml);
	}
 	
 	function indexContributions(repository) {
 		if (options.contribIndexingType == 'simple') {
 		
 			if (options.conribIndexField != null) {
 				return(indexContributions_simple(options.conribIndexField, repository));
 			}
 			
 		} else if (options.contribIndexingType == 'function') {
 		
 			if (typeof options.contribIndexFn != 'undefined' &&
 				options.contribIndexFn != null) {
 				return(options.contribIndexFn(repository));
 			}
 		
 		} else { // default
 		
 			return(indexContributions_default(repository));
 			
 		}
 	}
 	
 	/*
 	 * return a date object generated from the timestamp.  Our server side code returns an
 	 * object with raw (ts) and formatted (string) properties.  Use the raw so that the 
 	 * client's locale can factor in timezone etc.
 	 */
 	function parseTimestamp(ds) {
 		return(new Date(ds.raw));
 	}
 	
 	/* 
 	 * Default contributions indexing. Sorts them into "original contribution and
 	 * responses" blocks using the "related_to" optional field in the database.
 	 * If that field doesn't exist then an alternative index function must be supplied.
 	 */
 	function indexContributions_default(rep) {
 	 	var rRelatedOrder = null;
 		var skippedSome = false;
 		
 	 	var index = [];
		rRelatedOrder = {};
 		
 		// the logic here assumes that all contributions with related_to != 0
 		// are related to contributions that have the same place_id.  Otherwise
 		// they're not in this list.
 		//
 		// grab all rep entries with related_to = null
 		for (var m in rep) {
 			if (rep.hasOwnProperty(m)) {
 				if (null == rep[m].related_to ||
 					0 == rep[m].related_to) {
 					var d = parseTimestamp(rep[m].create_ts);
 					index.push({
 							order         : d,
 							key           : m,
 							related_to    : NULL_RELATED_TO,
 							related_order : NULL_RELATED_TO
 						});
 					rRelatedOrder[m] = d;
 				} else {
 					skippedSome = true;
 				}
 			}
 		}
 		
 		if (!skippedSome) { // catches case of no contributions and case of no related contributions
 			return index;
 		}
 		
 		// now grab all of the entries with related_to != null
 		for (var m in rep) {
 			if (rep.hasOwnProperty(m)) {
 				if (null != rep[m].related_to &&
 					0 != rep[m].related_to) {
 					index.push({
 							order         : parseTimestamp(rep[m].create_ts),
 							key           : m,
 							related_to    : (rRelatedOrder.hasOwnProperty(rep[m].related_to) ?
 												rep[m].related_to : NULL_RELATED_TO),
 							related_order : (rRelatedOrder.hasOwnProperty(rep[m].related_to) ?
 												rRelatedOrder[rep[m].related_to] : NULL_RELATED_TO)
 						});
 				}
 			}
 		}
 		
 		index.sort(function(a,b) {
 				if (NULL_RELATED_TO == a.related_to && NULL_RELATED_TO == b.related_to) {
 					return(a.order - b.order);
 				} else if (NULL_RELATED_TO == a.related_to && NULL_RELATED_TO != b.related_to) {
 					if (a.key == b.related_to) {
 						return(-1); // related after original
 					} else {
 						return(a.order - b.related_order);
 					}
 				} else if (NULL_RELATED_TO != a.related_to && NULL_RELATED_TO == b.related_to) {
 					if (a.related_to == b.key) {
 						return(1); // related after original
 					} else {
 						return(a.related_order - b.order);
 					}
 				} else { // (NULL_RELATED_TO != a.related_to && NULL_RELATED_TO != b.related_to) 
 					if (a.related_to == b.related_to) {
 						return(a.order - b.order);
 					} else {
 						return(a.related_order - b.related_order);
 					}
 				}
 			});
 		return index;
 	};
 	
 	function indexContributions_simple(fieldName, rep) {
 		// field MUST BE SOMETHING that arithmetic comparisons woek on	
 	 	var index = [];
 		
 		for (var m in rep) {
 			if (rep.hasOwnProperty(m)) {
 				index.push({
 						order         : rep[m][fieldName],
 						key           : m
 					});
 			}
 		}
 		
 		index.sort(function(a,b) {
 				return(a.order - b.order);
 			});
 		return index;
 	};
 	
 	function showAddContribButton() {
 		var showIt = false;
 		if (NUNALIIT_CONTRIBUTIONS) { // contribution handler loaded
 			if (NUNALIIT_CONTRIBUTIONS.allowAnonymousContribution()) { // anonymous allowed - show it
 				showIt = true;
 			} else if ($.NUNALIIT_AUTH) { // auth loaded
				if ($.NUNALIIT_AUTH.userLoggedInAndNotAnonymous()) {
					showIt = true;
				}
			}
 		}
 		return(showIt);
 	}

	function renderContributions() {
		var index = indexContributions(repository);
		if (null == cdf) {
			cdf = $n2.contributionDisplayFormatter({
					contribTableClassBase     : options.contribTableClassBase
					,contributionAddClick     : options.contributionAddClick
					,contributionDeleteClick  : options.contributionDeleteClick
					,contributionUpdateClick  : options.contributionUpdateClick
					,contribMediaClick        : options.contribMediaClick
					,showRespondLink          : options.contribTableRespLinks
					,showContribAuthor        : options.contribTableShowAuthor
					,showCreateTS             : options.contribTableShowCreateTS
					,embedAudioDirectly       : options.contribEmbedAudioDirectly
					,showLastEditInfo         : options.contribShowLastEditInfo
					,mediaDisplayVideoWidth   : options.contribMediaDisplayVideoWidth
					,mediaDisplayVideoHeight  : options.contribMediaDisplayVideoHeight
					,additionalFields         : options.contribAdditionalFields
				}
				,dbSearchEngine
			);
		}

		$("#"+options.displayDiv).append('<div id="'+options.contribTableDiv+'"> </div>')
		
		var headElem = $('<p></p>');
		{
			var headTable = $('<table class="'+options.contribTableClassBase+'_header"></table>');
			headElem.append(headTable);
			
			var headTr = $('<tr class="'+options.contribTableClassBase+'_header"><td width="50%">'+options.contribTableHeading+'</td></tr>');
			headTable.append(headTr);
			
			if (showAddContribButton()) {
				var headTd = $('<td align="center"></td>');
				headTr.append(headTd);
				
				var headButton = $('<input type="button" value="' + options.contribAddButtonText + '"></input>');
				headButton.click(function(){
					options.contributionAddClick(feature.attributes.place_id, null);
				});
				headTd.append(headButton);
			}
		}
		
		var contribElem = null;
		if (0 == index.length) {
			contribElem = $('<p><table><tr><td>' + options.contribListEmptyText + '</td></tr></table></p>');
		} else {
			contribElem = $('<p></p>');
			
			var table = $('<table class="'+options.contribTableClassBase+'"></table>');
			contribElem.append(table);
			
			for (var i=0; i<index.length; i++) {
				var parms = { key : index[i].key };

				if ('default' == options.contribIndexingType) {
				
					if (i < index.length-1) {
						// not last element
						if (NULL_RELATED_TO != index[i].related_to) {
							// current is related to earlier
							if (NULL_RELATED_TO != index[i+1].related_to) {
								// next is also related to earlier - continueRelatedSet
								parms.rowType = cdf.getExtensionType_contRelated();
								var trElem = cdf.formatAsTR(repository[parms.key], parms, ((index.length-1) == i));
								table.append(trElem);
							} else {
								// next is not related to earlier - endRelatedSet
								parms.rowType = cdf.getExtensionType_endRelated();
								var trElem = cdf.formatAsTR(repository[parms.key], parms, ((index.length-1) == i));
								table.append(trElem);
							};
						} else {
							// current not related to earlier
							if (NULL_RELATED_TO != index[i+1].related_to) {
								// next is related to current - startRelatedSet
								parms.rowType = cdf.getExtensionType_startRelated();
								var trElem = cdf.formatAsTR(repository[parms.key], parms, ((index.length-1) == i));
								table.append(trElem);
							} else {
								// next is not related to current - basic contribution
								parms.rowType = cdf.getExtensionType_basic();
								var trElem = cdf.formatAsTR(repository[parms.key], parms, ((index.length-1) == i));
								table.append(trElem);
							};
						};
					} else {
						// last element
						if (NULL_RELATED_TO != index[i].related_to) {
							// current is related to earlier - endRelatedSet
							parms.rowType = cdf.getExtensionType_endRelated();
							var trElem = cdf.formatAsTR(repository[parms.key], parms, ((index.length-1) == i));
							table.append(trElem);
						} else {
							// current is not related to earlier - basic contribution
							parms.rowType = cdf.getExtensionType_basic();
							var trElem = cdf.formatAsTR(repository[parms.key], parms, ((index.length-1) == i));
							table.append(trElem);
						};
					};
					
				} else { // not default sorting - all are basic.
					parms.rowType = cdf.getExtensionType_basic();
					var trElem = cdf.formatAsTR(repository[parms.key], parms, ((index.length-1) == i));
					table.append(trElem);
				}
			};
		};
		
		$("#"+options.contribTableDiv).empty().append(headElem).append(contribElem);
	};

	function getContribution(key) {
		return(repository[key]);
	};

	/*
	 * manage user contributions (comments, audio, and video contributions)
	 * associated with a place.
	 * Media contributions use the db key as the object identifer in the repository
	 */
	function contribMediaClick(key, path, contribFormatterOptions) {
		var contrib = getContribution(key);
		if (null == contrib) {
			return;
		};
		
		var mediaPath = path+contrib.filename;
		var mediaType = $n2.getMediaType(contrib.filename, contrib.mimetype);
		
		var mediaDisplayOptions = {
			type: mediaType
			,url: mediaPath
			,mediaDisplayVideoHeight: contribFormatterOptions.mediaDisplayVideoHeight
			,mediaDisplayVideoWidth: contribFormatterOptions.mediaDisplayVideoWidth
		};
		if( contrib.title ) {
			mediaDisplayOptions.title = contrib.title;
		};
		if (true == contribFormatterOptions.showContribAuthor) { // don't show in media viewer if not in contrib itself
			if( contrib.contributor && contrib.contributor.display ) {
				mediaDisplayOptions.author = contrib.contributor.display;
			};
		};
		// click function from contribution list - with the new media player the notes are 
		// visible in the side panel.  Do not repeat in the media display because they can
		// be long.
//		if( contrib.notes ) {
//			mediaDisplayOptions.description = contrib.notes;
//		};
		$n2.mediaDisplay.displayMedia(mediaDisplayOptions);
	};
	
$n2.placeInfo = {
	Configure : Configure
	
	// CALLED
	,setFeatureReinitDisplay : function(newFeature) {
		feature = newFeature;
		repository = {}; // empty repository
		displayPlace();
	}

	// CALLED 
	,getPlaceId : function() {
		return (feature.attributes.place_id);
	}
		
	// CALLED
	,getFid : function() {
		return ($n2.isDefined(feature) ? feature.fid : -1);
	}
		
	// CALLED - Right after setFeatureReinitDisplay
	,loadAndRenderContributions : function() {
		if( feature.attributes.place_id ) {
			contributionDb.getContributionsFromPlaceId(feature.attributes.place_id,function(contributions){
				repository = {};
				$.each(contributions, function(i, contribution) {
						repository[contribution.id] = contribution;
						return(true);
					});
				renderContributions();
			});
		}
	}

	,getContribution : getContribution
};

})(jQuery,nunaliit2);