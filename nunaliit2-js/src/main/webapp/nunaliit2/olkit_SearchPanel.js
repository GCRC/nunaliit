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

$Id: olkit_SearchPanel.js 8165 2012-05-31 13:14:37Z jpfiset $
*/

var $ = window.jQuery;
var $n2 = window.nunaliit2;

var _olkit_searchPanelHandler = null;
function _olkit_searchInputKeyPressed(evt) {
	var charCode = null;
	if (null != evt && null != evt.which) {
		charCode = evt.which;
	} else if (null != window.event && null != window.event.keyCode) { // IE
		charCode = window.event.keyCode;
	}
	
	if (13 == charCode || null == charCode) {
		// carriage return or I'm not detecting key codes
		// and have to submit on each key press - yuck...
		_olkit_searchPanelHandler.textInputSubmitSearch();
	}
}

var _olkit_recenterMapButtonTdId = "_olkit_space_for_recenter_map_button";
function _olkit_sp_mediaClick(key, path, contribFormatterOptions) {
	if (null == _olkit_searchPanelHandler) {
		return;
	}
	var contrib = _olkit_searchPanelHandler.getSearchHit(key);
	if (null == contrib) {
		return;
	}
	var html = 
    	'<div class="searchPanelDialog"><p><table class="attrib_header">'+
		'<tr class="attrib_header">'+
		'<td>Contribution Data:</td><td id="'+_olkit_recenterMapButtonTdId+'"></td></tr></table></p><p><table>';
    for (var i in contrib) {
    	var value = contrib[i];
		if (contrib.hasOwnProperty(i) && null != contrib[i]) {
			if ("score" == i
				|| "id" == i
				|| "related_to" == i
				|| "contributor_id" == i ) {
				// do not display
			} else if( "contributor" == i ) {
				if( value.anonymous ) {
					html += '<tr><td class="label">contributor:</td><td class="info">Guest</td></tr>';
				} else {
					html += '<tr><td class="label">contributor:</td><td class="info">'+value.display+'</td></tr>';
				};
			} else {
				html += '<tr><td class="label">'+i+
					': </td><td class="info">'+value+'</td></tr>';
			};
		}
	}
	html += '</table></p>';
	html += generateModalHtmlForMedia(contrib.filename, contrib.mimetype, path, contrib.title, contrib.notes);
	html += '</div>';

	var dialogOptions = {
		autoOpen: true
		,modal: true
		,width: 'auto'
		,close: function(event, ui){
			var diag = $(event.target);
			diag.dialog('destroy');
			diag.remove();
		}
	};
	$(html).dialog(dialogOptions);
	
	_olkit_searchPanelHandler.addTheMapRecenterButton(key);

	function generateModalHtmlForMedia(
		filename
		,mimetype
		,mediaPath
		,title
		,caption
		) {	
		if (null == filename || "" == filename) {
			return('');
		}
		
		var type = $n2.getMediaType(filename, mimetype);
		if (null == type) {
			return('');
		}
	
		var mediaDisplayOptions = {
			type: type
			,url: mediaPath + filename
			,footerHtml: null
		};
		if( typeof(caption) === 'string'
		 && '' !== caption ) {
			mediaDisplayOptions.caption = caption;
		};
		if( typeof(title) === 'string'
		 && '' !== title ) {
			mediaDisplayOptions.headerHtml = title;
		}
		var htmlString = $n2.mediaDisplay.generateInlineHtmlForMedia(mediaDisplayOptions);
		
		return htmlString;
	};
}

function _olkit_sp_placeClick(key) {
	if (null == _olkit_searchPanelHandler) {
		return;
	}
	var place = _olkit_searchPanelHandler.getSearchHit(key);
	if (null == place) {
		return;
	}
		
	var workingHtml =
    	'<div class="searchPanelDialog"><p><table class="attrib_header">'+
		'<tr class="attrib_header">'+
		'<td>Place Data:</td><td id="'+_olkit_recenterMapButtonTdId+'"></td></tr></table></p><p><table>';
    for (var i in place) {
		if (place.hasOwnProperty(i) && null != place[i]) {
			if ("score" != i &&
				"id" != i) {
				workingHtml += '<tr><td class="label">'+i+
					': </td><td class="info">'+place[i]+'</td></tr>';
			}
		}
	}
	workingHtml += '</table></p></div>';
	
	var dialogOptions = {
		autoOpen: true
		,modal: true
		,width: 'auto'
		,close: function(event, ui){
			var diag = $(event.target);
			diag.dialog('destroy');
			diag.remove();
		}
	};
	$(workingHtml).dialog(dialogOptions);
	
	_olkit_searchPanelHandler.addTheMapRecenterButton(key);
}

function olkit_SearchPanel(aoOptions,dbSearchEngine_) {
	var defaultOptions = {
		panelDivName: "",
		textInputDivName: "",
		initialSearchText: "",
		contribTableClassBase: "",
		contribTableDiv: "",
		contribMediaClick: function(){},
		contribTableShowCreateTS: true,
		contribEmbedAudioDirectly: false,
		contribShowLastEditInfo: true,
		contribTableShowAuthor: true,
		contribMediaDisplayVideoHeight: 240,
		contribMediaDisplayVideoWidth: 320,
		ownerMapAndControls: null,
		markFeatureAsClicked: function(place_id){},
		sourceSrsName: 'EPSG:4326', // what coord system are points stored in DB using?
		mapDisplaySrsName: 'EPSG:900913', // Google's spherical mercator
		placeNameFieldName: 'placename',
		subtitleStringFn: function(d){return('');}
	};
	var options = $.extend({}, defaultOptions, aoOptions);
	
	var dbSearchEngine = dbSearchEngine_;
	var initialSearchText = "search the atlas";
	var lastSearchedString = ""; // "" is an invalid search string - see processSearchInput()
	var lastDisplayedString = "";
	var searchHits = {};
	
	var displayProj = new OpenLayers.Projection(options.mapDisplaySrsName);
	var sourceProj = new OpenLayers.Projection(options.sourceSrsName);

	/*
	 * search routines and results management
	 */
	function cKey(num) { // keys for contributions/comments
		return("c"+num);
	}
	
	function pKey(num) { // keys for places / "names"
		return("p"+num);
	}
	
	function searchHitIsCont(key) {
		return("c" == key.charAt(0));
	}

	function searchHitIsPlace(key) {
		return("p" == key.charAt(0));
	}
	
	var contributionsFetched = false;
	var placesFetched = false;
	function doDisplay(searchString) {
		if (true == contributionsFetched && true == placesFetched) {
			lastSearchedString = searchString;
			displaySearchSummmary(searchString);
		}
	}
	
	function fetchMatchingContributions(searchString) {
		dbSearchEngine.searchForContributions(ti.value,function(contributions){
			for (var i=0; i<contributions.length; i++) {
				searchHits[cKey(i)] = {
					score : contributions[i].score,
					data  : contributions[i]
				};
			};
			contributionsFetched = true;
			doDisplay(searchString);
		});
	};

	function fetchMatchingPlaces(searchString) {
		dbSearchEngine.searchForPlaceNames(ti.value,function(names){
			for (var i=0; i<names.length; i++) {
				searchHits[pKey(i)] = {
					score : names[i].score,
					data  : names[i]
				};
			};
			placesFetched = true;
			doDisplay(searchString);
		});
	};
	
	/*
	 * search results list formatting and display
	 */
	function formatPlaceAsTR(key, lastRow) {
		var tdClassBase = options.contribTableClassBase+'_entry';
		var tdClasses = tdClassBase+'_fullwidth '+tdClassBase+'_solid_top_border';
		if (true == lastRow) {
			tdClasses += ' '+tdClassBase+'_solid_bottom_border'
		}
		
		// Result is a tr
		var trElem = $('<tr class="'+options.contribTableClassBase+'"></tr>');
		
		// td in tr
		var tdElem = $('<td colspan="2" class="'+tdClasses+'">');
		trElem.append(tdElem);
		
		// Placename
		var placeNameHtml = '<p class="'+options.contribTableClassBase+'_entry_title">'+
			searchHits[key].data[options.placeNameFieldName];
		if ('undefined' != typeof options.subtitleStringFn &&
			null != options.subtitleStringFn) {
			placeNameHtml += options.subtitleStringFn(searchHits[key].data)
		}
		placeNameHtml += '</p>';
		var placeNameElem = $(placeNameHtml);
		tdElem.append(placeNameElem);
		
		// Icon Div
		var iconDivElem = $('<div class="'+options.contribTableClassBase+'_entry_place_icon"'+
			' alt="place information icon"></div>');
		iconDivElem.click(function(){
			_olkit_sp_placeClick(key);
		});
		tdElem.append(iconDivElem);
		
		return(trElem);
	}
	
 	var cdf = $n2.contributionDisplayFormatter(
		{
			contribTableClassBase     : options.contribTableClassBase
			,contribMediaClick        : _olkit_sp_mediaClick
			,showRespondLink          : false
			,showContribInfoIcons     : true
			,keysAreStrings           : true
			,showCreateTS             : options.contribTableShowCreateTS
			,embedAudioDirectly       : false // not for the search panel
			,showLastEditInfo         : options.contribShowLastEditInfo
			,showContribAuthor        : options.contribTableShowAuthor
			,mediaDisplayVideoHeight  : options.contribMediaDisplayVideoHeight
			,mediaDisplayVideoWidth   : options.contribMediaDisplayVideoWidth
			,additionalFields         : [] // none in search results
		}
		,dbSearchEngine
	);
	function displaySearchSummmary(searchString) {		
		$("#"+options.panelDivName).empty();
		$("#"+options.panelDivName).html('<div id="'+options.contribTableDiv+'"> </div>');
		
		// each of the two search lists is sorted by the respective queries
		// (see fetchMatchingPlaces() and fetchMatchingContributions() above),
		// but still need to be sort together: ascending order by score.
		var index = new Array();
		for (var k in searchHits) {
			if (searchHits.hasOwnProperty(k)) {
				var row = new Array();
				row[0] = k;
				row[1] = searchHits[k].score;
				index.push(row);
			}
		}
		index.sort(function(a,b) { return(a[1] - b[1]); });

		
		var htmlHeader = $(
			'<p><table class="'+options.contribTableClassBase+'_header">'+
			'<tr class="'+options.contribTableClassBase+'_header">'+
			'<td width="50%">Search Results:</td></tr></table></p>');

		if (0 == index.length) {
			var htmlElem = $('<p><table><tr><td>There are no matching results.</td></tr></table></p>');
		} else {
			var htmlElem = $('<p></p>');
			
			var table = $('<table class="'+options.contribTableClassBase+'"></table>');
			htmlElem.append(table);
			
			for (var i=0; i<index.length; i++) {
				if (searchHitIsPlace(index[i][0])) {
					var tr = formatPlaceAsTR(index[i][0], ((index.length-1) == i));
					table.append(tr);
				} else {
					var parms = {
						key     : index[i][0],
						rowType : cdf.getExtensionType_basic()
					};
					var tr = cdf.formatAsTR(searchHits[parms.key].data, parms, ((index.length-1) == i));
					table.append(tr);
				};
			};
		};
		
		$("#"+options.contribTableDiv)
			.empty()
			.append(htmlHeader)
			.html(htmlElem)
			;
		
		lastDisplayedString = searchString;
	}
	
	/*
	 * install search text input and install handlers for it.
	 */
	var inputName = "_olkit_searchInput";
	var html = '<input id="'+inputName+'" type="text" class="search_panel_input"'+
		' onkeypress="_olkit_searchInputKeyPressed(event)"'+
		' value="'+options.initialSearchText+'"></input>';
	$("#"+options.textInputDivName).html(html);
	var ti = document.getElementById(inputName);
	
	function searchedResultsAreCurrent() {
		return(ti.value == lastSearchedString && "" != ti.value);
	}
			
	function displayedResultsAreCurrent() {
		return(lastSearchedString == lastDisplayedString);
	}
			
	$("#"+inputName).focus(function() {
			if (initialSearchText == ti.value) {
				ti.value = "";
			}
			ti.select();
		});
	$("#"+inputName).blur(function() { 
			if (initialSearchText == ti.value) {
				ti.value = "";
			}
			ti.blur();
		});

	function processSearchInput() {
		var searchTerm = ti.value;
		if (null != searchTerm && "" != searchTerm) { // just redisplay
			if (searchedResultsAreCurrent() && !displayedResultsAreCurrent()) {
				displaySearchSummmary();
			} else { // new search
				searchHits = {};
			
				contributionsFetched = false;
				fetchMatchingContributions(searchTerm);
			
				placesFetched = false;
				fetchMatchingPlaces(searchTerm);
			}
		}
	}
			
	/*
	 * map recentering
	 */
	function addMapRecenterButtonToModalDisplay(place_id, centerX, centerY) {
		$("#"+_olkit_recenterMapButtonTdId).append('<input type="button" value="Centre map on location"'+
			' onclick="_olkit_searchPanelHandler.moveMapToNewCenter('+place_id+','+centerX+','+centerY+')"/>');
	};
	
	function addOrphanedToModalDisplay(place_id) {
		$("#"+_olkit_recenterMapButtonTdId).text('The place associated with this contribution was deleted.');
	}
	
	return {
		textInputSubmitSearch : function() {
				processSearchInput();
			},
			
		getSearchHit : function(key) {
				return(searchHits[key].data);
			},
		
		deactivated : function() {
				lastDisplayedString = "";
				ti.blur();
			},
		
		/*
		 * @param centerX horizontal center of feature in whatever coordinate system is used in the db
		 * @param centerY vertical center of feature in whatever coordinate system is used in the db
		 */
		moveMapToNewCenter : function(place_id, centerX, centerY) {
				$(".searchPanelDialog").dialog('close');

				var ll = new OpenLayers.LonLat(centerX, centerY);
				ll.transform(sourceProj, displayProj); // transform in place
				options.ownerMapAndControls.recentreMap(ll);
				options.markFeatureAsClicked({uniqueId:place_id});
			},

		addTheMapRecenterButton : function(key) {
			// have to fetch geometry first - then use that to put up button!
			if (searchHitIsCont(key)) {
				dbSearchEngine.findGeometryCentroidFromPlaceId(searchHits[key].data.place_id, function(names){
					if( names && names.length > 0 ) {
						var name = names[0];
						if (null == name || null == name.x || null == name.y) {
							addOrphanedToModalDisplay(searchHits[key].data.place_id);
						} else {
							addMapRecenterButtonToModalDisplay(name.place_id, name.x, name.y)
						};
					};
				});
			} else {
				dbSearchEngine.findGeometryCentroidFromId(searchHits[key].data.id, function(names){
					if( names && names.length > 0 ) {
						var name = names[0];
						if (null == name || null == name.x || null == name.y) {
							addOrphanedToModalDisplay(searchHits[key].data.place_id);
						} else {
							addMapRecenterButtonToModalDisplay(name.place_id, name.x, name.y)
						};
					};
				});
			};
		}
	};
}
