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

$Id: olkit.search.isiuop.js 8165 2012-05-31 13:14:37Z jpfiset $
*/
;(function($){


function ShowFeature(feature, div, options) {
	div.append( $('<span>Feature (score:'+feature.score+')</span>') );
	div.append( $('<div class="_feature_id_'+feature.feature_id+'">Feature('+feature.feature_id+')</div>') );
};

function ShowContribution(contribution, div, options) {
	div.append( $('<span>Contribution (score:'+contribution.score+')</span>') );
	div.append( $('<div class="_contribution_id_'+contribution.id+'">Contribution('+contribution.id+')</div>') );
};

function ShowEvent(event, div, options) {
	div.append( $('<span>Event (score:'+event.score+')</span>') );
	div.append( $('<div class="_event_id_'+event.id+'">Event('+event.id+')</div>') );
};

function ShowPerson(person, div, options) {
	div.append( $('<span>Person (score:'+person.score+')</span>') );
	div.append( $('<div class="_person_id_'+person.id+'">Person('+person.id+')</div>') );
};

function DisplaySearchResults(searchResults, options) {
	$('#'+options.displayDiv).empty();

	if( 0 == searchResults.length ) {
		$('#'+options.displayDiv).append( $('<span>No result returned.</span>') );
	}

	for(var loop=0; loop<searchResults.length; ++loop) {
		var searchResult = searchResults[loop];

		var div = $('<div class="relation relation2mod'+(loop%2)+'"></div>');
		searchResult._insert(searchResult,div,options);
		$('#'+options.displayDiv).append(div);
	};
};


var options = {};
var inputName = '_olkit_searchInput';
var lastSearchedString = ''; // "" is an invalid search string - see ProcessSearchInput()
var lastDisplayedString = '';
var errorOnQueriesReported = 0;

function searchedResultsAreCurrent() {
	var value = $('#'+inputName).val();
	return(value == lastSearchedString && '' != value);
};		

function displayedResultsAreCurrent() {
	return(lastSearchedString == lastDisplayedString);
};
	
function GetSearchBoxValue() {
	return $('#'+inputName).val();
};

function SearchInputKeyPressed(evt) {
	var charCode = null;
	if (null != evt && null != evt.which) {
		charCode = evt.which;
	} else if (null != window.event && null != window.event.keyCode) { // IE
		charCode = window.event.keyCode;
	}
	
	if (13 == charCode || null == charCode) {
		// carriage return or I'm not detecting key codes
		// and have to submit on each key press - yuck...
		ProcessSearchInput();
	}
};

function ProcessSearchInput() {
	var searchTerm = GetSearchBoxValue();
	if (null != searchTerm && "" != searchTerm) { // just redisplay
		if (searchedResultsAreCurrent() && !displayedResultsAreCurrent()) {
			//displaySearchSummmary();
		} else { // new search
			if( $.NUNALIIT_DBWEB ) {
				// Create queries
				var queries = [];
				
				// persons
				var query = {
					tableName: 'persons'
					,whereClauses: [
						$.NUNALIIT_DBWEB.formatSearchStringRecordSelector(
							searchTerm
							,'first_name'
							,'last_name'
							,'bio'
							)
					]
					,selects: [
						$.NUNALIIT_DBWEB.formatFieldSelectorColumn('id')
						,$.NUNALIIT_DBWEB.formatFieldSelectorColumn('first_name')
						,$.NUNALIIT_DBWEB.formatFieldSelectorColumn('last_name')
						,$.NUNALIIT_DBWEB.formatFieldSelectorColumn('bio')
						,$.NUNALIIT_DBWEB.formatFieldSelectorScoreSubstring(
							searchTerm
							,'first_name'
							,'last_name'
							,'bio'
							)
					]
					,orderBy: [
						$.NUNALIIT_DBWEB.formatOrderBy(
							$.NUNALIIT_DBWEB.orderByAscending
							,$.NUNALIIT_DBWEB.formatFieldSelectorScoreSubstring(
								searchTerm
								,'first_name'
								,'last_name'
								)
						)
					]
					,limit: 50
					,_insert: ShowPerson
					,_show: $.olkitDisplay.DisplayPersons
				};
				queries.push(query);
				
				// contributions
				var query = {
					tableName: 'contributions'
					,whereClauses: [
						$.NUNALIIT_DBWEB.formatSearchStringRecordSelector(
							searchTerm
							,'caption'
							,'story'
							,'translated_story'
							)
					]
					,selects: [
						$.NUNALIIT_DBWEB.formatFieldSelectorColumn('id')
						,$.NUNALIIT_DBWEB.formatFieldSelectorColumn('mimetype')
						,$.NUNALIIT_DBWEB.formatFieldSelectorColumn('filename')
						,$.NUNALIIT_DBWEB.formatFieldSelectorColumn('caption')
						,$.NUNALIIT_DBWEB.formatFieldSelectorColumn('story')
						,$.NUNALIIT_DBWEB.formatFieldSelectorColumn('translated_story')
						,$.NUNALIIT_DBWEB.formatFieldSelectorColumn('create_ts')
						,$.NUNALIIT_DBWEB.formatFieldSelectorColumn('dataset_id')
						,$.NUNALIIT_DBWEB.formatFieldSelectorScoreSubstring(searchTerm,'caption','story')
					]
					,orderBy: [
						$.NUNALIIT_DBWEB.formatOrderBy(
							$.NUNALIIT_DBWEB.orderByAscending
							,$.NUNALIIT_DBWEB.formatFieldSelectorScoreSubstring(searchTerm,'caption','story')
						)
					]
					,limit: 50
					,_insert: ShowContribution
					,_show: $.olkitDisplay.DisplayContributions
				};
				queries.push(query);
				
				// features
				var query = {
					tableName: 'features'
					,whereClauses: [
						$.NUNALIIT_DBWEB.formatSearchStringRecordSelector(
							searchTerm
							,'toponymy'
							,'description'
							,'story'
							)
					]
					,selects: [
						$.NUNALIIT_DBWEB.formatFieldSelectorColumn('id')
						,$.NUNALIIT_DBWEB.formatFieldSelectorColumn('feature_id')
						,$.NUNALIIT_DBWEB.formatFieldSelectorColumn('feature_type_id')
						,$.NUNALIIT_DBWEB.formatFieldSelectorColumn('toponymy')
						,$.NUNALIIT_DBWEB.formatFieldSelectorColumn('description')
						,$.NUNALIIT_DBWEB.formatFieldSelectorColumn('story')
						,$.NUNALIIT_DBWEB.formatFieldSelectorColumn('dataset_id')
						,$.NUNALIIT_DBWEB.formatFieldSelectorColumn('creator_id')
						,$.NUNALIIT_DBWEB.formatFieldSelectorScoreSubstring(
							searchTerm
							,'toponymy'
							,'description'
							,'story'
							)
					]
					,orderBy: [
						$.NUNALIIT_DBWEB.formatOrderBy(
							$.NUNALIIT_DBWEB.orderByAscending
							,$.NUNALIIT_DBWEB.formatFieldSelectorScoreSubstring(
								searchTerm
								,'toponymy'
								,'description'
								,'story'
								)
						)
					]
					,limit: 50
					,_insert: ShowFeature
					,_show: $.olkitDisplay.DisplayFeatures
				};
				queries.push(query);
				
				/*// events
				var query = {
					tableName: 'events'
					,whereClauses: [
						$.NUNALIIT_DBWEB.formatSearchStringRecordSelector(
							searchTerm
							,'date'
							)
					]
					,selects: [
						$.NUNALIIT_DBWEB.formatFieldSelectorColumn('id')
						,$.NUNALIIT_DBWEB.formatFieldSelectorColumn('event_type_id')
						,$.NUNALIIT_DBWEB.formatFieldSelectorColumn('date')
						,$.NUNALIIT_DBWEB.formatFieldSelectorColumn('creator_id')
						,$.NUNALIIT_DBWEB.formatFieldSelectorColumn('dataset_id')
						,$.NUNALIIT_DBWEB.formatFieldSelectorScoreSubstring(
							searchTerm
							,'date'
							)
					]
					,orderBy: [
						$.NUNALIIT_DBWEB.formatOrderBy(
							$.NUNALIIT_DBWEB.orderByAscending
							,$.NUNALIIT_DBWEB.formatFieldSelectorScoreSubstring(
								searchTerm
								,'date'
								)
						)
					]
					,limit: 50
					,_insert: ShowEvent
					,_show: $.olkitDisplay.DisplayEvents
				};
				queries.push(query);*/
				
				$.NUNALIIT_DBWEB.queries({
					queries: queries
					,onSuccess: function(result){

						// Accumulate results in one array
						var searchResults = [];			
						for(var loop=0; loop<queries.length; ++loop) {
							var query = queries[loop];
							if( query.error ) {
								if( !errorOnQueriesReported ) {
									alert("Error accessing database. Some information might be missing.");
									errorOnQueriesReported = 1;
								}
							} else {
								for(var l2=0; l2<query.results.length; ++l2) {
									var searchResult = query.results[l2];
									searchResult._insert = query._insert;
									searchResults.push(searchResult);
								}
							}
						};
						
						// Sort search results
						searchResults.sort(function(left,right){
							if( left.score < right.score ) return -1;
							if( left.score > right.score ) return 1;
							return 0;
						});

						// Insert in display
						DisplaySearchResults(searchResults, options);
						
						// Populate display
						var newRequest = {};
						for(var loop=0; loop<queries.length; ++loop) {
							var query = queries[loop];
							if( query.results ) {
								query._show(query.results, options, newRequest);
							}
						};
						
						// Continue loading info from database
						setTimeout(function(){
							$.olkitDisplay.PerformQueries(newRequest, options);
						},0);
					}
					,onError: function(error) {
						if( !errorOnQueriesReported ) {
							alert("Error accessing database. Some information might be missing.");
							errorOnQueriesReported = 1;
						}
					}
				});
			}
		}
	}
}

// Install on jQuery the OLKIT callback
var defaultOptions = {
	displayDiv: null // must be supplied
	,textInputDivName: null // must be supplied
	
	,initialSearchText: ''
};
$.olkitSearchHandler = function(options_) {

	options = $.extend({},defaultOptions,options_);

	/*
	 * install search text input and install handlers for it.
	 */
	var input = $('<input id="'+inputName+'" type="text" class="search_panel_input"'+
		' value="'+options.initialSearchText+'"></input>');
	input.keypress(SearchInputKeyPressed);
	$("#"+options.textInputDivName).empty().append(input);

	var ti = document.getElementById(inputName);
	
	input.focus(function(evt) {
		var value = input.val();
		if(options.initialSearchText == value) {
			input.val('');
		}
		input.select();
	});
	
	input.blur(function(evt) { 
		var value = input.val();
		if('' == value) {
			input.val(options.initialSearchText);
		}
	});
};

})(jQuery);