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

$Id: olkit.click.isiuop.js 8165 2012-05-31 13:14:37Z jpfiset $
*/
;(function($){

var errorOnQueriesReported = 0;
var errorNoRelationsReported = 0;

var olkitFunctionMap = null;

var contribution_dialog = $('<div></div>')
       						.dialog({
       							autoOpen: false
       							,position: "center"
       						});

function getMediaPath() {
	if( olkitFunctionMap && olkitFunctionMap.getMediaPath ) {
		return olkitFunctionMap.getMediaPath();
	};
	
	return null;
};

function DisplayRelations(relations, options, newRequest) {
	var relationsDiv = $('#isiuopRelations');

	for(var loop=0; loop<relations.length; ++loop) {
		var relation = relations[loop];
		
		var relationDiv = $('<div class="relation relation2mod'+(loop%2)+'"></div>');
		
		if( relation.person_id && !options.suppressPersons ) {
			AddToRequest(newRequest, 'persons', relation.person_id);
			relationDiv.append( $('<span class="_person_id_'+relation.person_id+'">Person('+relation.person_id+')</span>') );
			relationDiv.append( $('<span>&nbsp;</span>') );
		}
		
		if( relation.role_id && !options.suppressRoles ) {
			AddToRequest(newRequest, 'roles', relation.role_id);
			relationDiv.append( $('<span class="_role_id_'+relation.role_id+'">Role('+relation.role_id+')</span>') );
		}
		
		if( relation.contribution_id && !options.suppressContributions ) {
			AddToRequest(newRequest, 'contributions', relation.contribution_id);
			relationDiv.append( $('<div class="_contribution_id_'+relation.contribution_id+'">Contribution('+relation.contribution_id+')</div>') );
		}
		
		if( relation.event_id && !options.suppressEvents ) {
			AddToRequest(newRequest, 'events', relation.event_id);
			relationDiv.append( $('<div class="_event_id_'+relation.event_id+'">Event('+relation.event_id+')</div>') );
		}
		
		if( relation.creator_id && !options.suppressCreators ) {
			AddToRequest(newRequest, 'creators', relation.creator_id);
			//relationDiv.append( $('<div class="relation_creator"><span>Created by: </span><span class="_creator_id_'+relation.creator_id+'">Creator('+relation.creator_id+')</span></div>') );
		}
		
		if( relation.feature_id && !options.suppressFeatures ) {
			AddToRequest(newRequest, 'features', relation.feature_id);
			relationDiv.append( $('<div class="_feature_id_'+relation.feature_id+'">Feature('+relation.feature_id+')</div>') );
		}

		relationsDiv.append(relationDiv);
	};
};

function AddToRequest(request,category,identifier) {
	if( !request[category] ) {
		request[category] = {};
	}
	request[category][identifier] = 1;
};

function DisplayPersons(persons, options, newRequest) {
	for(var loop=0; loop<persons.length; ++loop) {
		var person = persons[loop];
	
		var link = $('<a class="_person_id_link_'+person.id+'" href=".">'+person.first_name+' '+person.last_name+'</a>');
		$('._person_id_'+person.id)
			.empty()
			.append( link );
			
		makePersonClick('._person_id_link_'+person.id, person);
	};

	function makePersonClick(selector, person) {
		var opts = {
			displayDiv: options.displayDiv
		};
		$(selector).click( function(){
			setTimeout( function(){
				DisplayClickedPerson(person,opts);
			}, 0);
			return false;
		});
	};
};

function DisplayRoles(roles, options, newRequest) {
	for(var loop=0; loop<roles.length; ++loop) {
		var role = roles[loop];
	
		$('._role_id_'+role.id).text( ''+role.name );
	};
};

function DisplayCreators(creators, options, newRequest) {
	for(var loop=0; loop<creators.length; ++loop) {
		var creator = creators[loop];

		// At this point, we do not wish to browse creators (suppress link)
		$('._creator_id_'+creator.id).text( creator.name );
//		var creatorLink = $('<a class="_creator_id_link_'+creator.id+'" href=".">'+creator.name+'</a>');
//		$('._creator_id_'+creator.id)
//			.empty()
//			.append( creatorLink );
//		makeCreatorClick('._creator_id_link_'+creator.id, creator);
	};

	function makeCreatorClick(selector, creator) {
		var opts = {
			displayDiv: options.displayDiv
		};
		$(selector).click(function(){
			setTimeout( function(){
				DisplayClickedCreator(creator,opts);
			}, 0);
			return false;
		});
	};
};

function DisplayContributions(contributions, options, newRequest) {
	for(var loop=0; loop<contributions.length; ++loop) {
		var contribution = contributions[loop];
	
		var contributionDiv = $('._contribution_id_'+contribution.id);
		contributionDiv.empty();
		
		AddContributionMedia(contribution, contributionDiv);
		
		if( contribution.caption ) {
			var elem = $('<span class="contribution_title"></span>');
			contributionDiv.append(elem);

			elem.append( $('<span>Title:</span>') );
			var span = $('<span></span>');
			elem.append(span);
			
			var link = $('<a class="_contribution_id_link_'+contribution.id+'" href=".">'+contribution.caption+'</a>');
			span.append(link);
			makeContributionClick('._contribution_id_link_'+contribution.id, contribution);
		}
		
		/*if( contribution.notes ) {
			var elem = $('<span class="contribution_notes"></span>');
			elem.append( $('<span>Notes:</span>') );
			elem.append( $('<span></span>').text(''+contribution.notes) );
			contributionDiv.append(elem);
		}*/
		
		if( contribution.create_ts ) {
			var elem = $('<span class="contribution_time"></span>');
			elem.append( $('<span>Created:</span>') );
			var date = new Date(contribution.create_ts.raw);
			elem.append( $('<span></span>').text(''+date) );
			contributionDiv.append(elem);
		}
	};

	function makeContributionClick(selector, contribution) {
		var opts = {
			displayDiv: options.displayDiv
		};
		$(selector).click(function(){
			setTimeout( function(){
				DisplayClickedContribution(contribution,opts);
			}, 0);
			return false;
		});
	};
};

function DisplayEvents(events, options, newRequest) {
	for(var loop=0; loop<events.length; ++loop) {
		var event = events[loop];
	
		var eventDiv = $('._event_id_'+event.id);
		eventDiv.empty();
		
		{
			var elem = $('<span class="event_type_name"></span>');
			elem.append( $('<span>Event: </span>') );
			eventDiv.append(elem);
		
			var link = $('<a class="_event_id_link_'+event.id+'" href="."></a>');
			link.append( $('<span class="_event_type_'+event.event_type_id+'">EventType('+event.event_type_id+')</span><span> (id '+event.id+')</span>'));

			elem.append(link);
			AddToRequest(newRequest, 'eventTypes', event.event_type_id);
		}
		
		if( event.date ) {
			var elem = $('<span class="event_date"></span>');
			elem.append( $('<span>Date: </span>') );
			var date = new Date(event.date.raw);
			elem.append( $('<span></span>').text(''+date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()));
			
			eventDiv.append(elem);
		}
		
		{
			eventDiv.append( $('<div class="_event_persons_'+event.id+'"></div>') );
			AddToRequest(newRequest, 'eventPersons', event.id);
		}

		makeEventClick('._event_id_link_'+event.id, event);
	};

	function makeEventClick(selector, event) {
		var opts = {
			displayDiv: options.displayDiv
		};
		$(selector).click(function(){
			setTimeout( function(){
				DisplayClickedEvent(event,opts);
			}, 0);
			return false;
		});
	};
};

function DisplayEventTypes(eventTypes, options, newRequest) {
	for(var loop=0; loop<eventTypes.length; ++loop) {
		var eventType = eventTypes[loop];
	
		
		if( eventType.name ) {
			var eventTypeElem = $('._event_type_'+eventType.id);
			eventTypeElem.text(''+eventType.name);
		}
	};
};

function DisplayEventPersons(relations, options, newRequest) {
	for(var loop=0; loop<relations.length; ++loop) {
		var relation = relations[loop];
	
		var eventDiv = $('._event_persons_'+relation.event_id);
	
		var relationDiv = $('<div></div>');
		eventDiv.append(relationDiv);
		
		if( relation.person_id ) {
			AddToRequest(newRequest, 'persons', relation.person_id);
			relationDiv.append( $('<span class="_person_id_'+relation.person_id+'">Person('+relation.person_id+')</span>') );
			relationDiv.append( $('<span>&nbsp;</span>') );
		}
		
		if( relation.role_id ) {
			AddToRequest(newRequest, 'roles', relation.role_id);
			relationDiv.append( $('<span class="_role_id_'+relation.role_id+'">Role('+relation.role_id+')</span>') );
		}
	};
};

function DisplayDatasets(datasets, options, newRequest) {
	for(var loop=0; loop<datasets.length; ++loop) {
		var dataset = datasets[loop];
	
		$('._dataset_id_'+dataset.id).text( ''+dataset.name );
	};
};

function DisplayFeatures(features, options, newRequest) {
	for(var loop=0; loop<features.length; ++loop) {
		var feature = features[loop];
	
		var table = $('<table></table>');
		
		if( feature.feature_id ) {
			var tr = $('<tr><td>Feature Id:</td></tr>');
			table.append(tr);
			
			var td = $('<td></td>');
			tr.append(td);
			
			var link = $('<a class="_feature_id_link_'+feature.feature_id+'" href=".">'+feature.feature_id+'</a>');
			
			td.append(link);
		};
		
		if( feature.feature_type_id ) {
		 	table.append( $('<tr><td>Feature Type:</td><td class="_feature_type_id_'+feature.feature_type_id+'">'+
				feature.feature_type_id+'</td></tr>') );
			AddToRequest(newRequest,'feature_types',feature.feature_type_id);
		};
		
		if( feature.toponymy ) {
		 	table.append( $('<tr><td>Name:</td><td>'+
				feature.toponymy+'</td></tr>') );
		};
		
		/*if( feature.dataset_id ) {
		 	table.append( $('<tr><td>Dataset:</td><td class="_dataset_id_'+feature.dataset_id+'">'+
				feature.dataset_id+'</td></tr>') );
			AddToRequest(newRequest,'datasets',feature.dataset_id);
		};*/

		if( feature.description ) {
		 	table.append( $('<tr><td>Description:</td><td>'+
				feature.description+'</td></tr>') );
		};
		
		if( feature.story ) {
		 	table.append( $('<tr><td>Story:</td><td>'+
				feature.story+'</td></tr>') );
		};
		
		/*if( feature.notes ) {
		 	table.append( $('<tr><td>Notes:</td><td>'+
				feature.notes+'</td></tr>') );
		};*/
		
		/*if( feature.creator_id ) {
		 	table.append( $('<tr><td>Creator:</td><td class="_creator_id_'+feature.creator_id+'">'+
				feature.creator_id+'</td></tr>') );
			AddToRequest(newRequest,'creators',feature.creator_id);
		};*/
		
		$('._feature_id_'+feature.feature_id).empty().append( table );
		makeFeatureClick('._feature_id_link_'+feature.feature_id, feature);
	};

	function makeFeatureClick(selector, feature) {
		var opts = {
			displayDiv: options.displayDiv
		};
		$(selector).click(function(){
			setTimeout( function(){
				DisplayClickedFeature(feature,opts);
			}, 0);
			return false;
		});
	};
};

function DisplayFeatureTypes(feature_types, options, newRequest) {
	for(var loop=0; loop<feature_types.length; ++loop) {
		var feature_type = feature_types[loop];
	
		$('._feature_type_id_'+feature_type.id).text( ''+feature_type.name );
	};
};

function DisplayCentroids(centroids, options, newRequest) {
	for(var loop=0; loop<centroids.length; ++loop) {
		var centroid = centroids[loop];
	
		var feature_id = centroid.feature_id;
		var x = centroid.x;
		var y = centroid.y;
		
		if( olkitFunctionMap && olkitFunctionMap.centerMapOnFeatureId ) {
			var link = $('<a class="_feature_centroid_id_link_'+feature_id+'" href=".">Find on Map</a>');
			
			$('._feature_centroid_id_'+feature_id).empty().append(link);

			makeLocateClick('._feature_centroid_id_link_'+feature_id, centroid);
		} else {
			$('._feature_centroid_id_'+feature_id).text(''+x+','+y);
		}
	};

	function makeLocateClick(selector, centroid) {
		var opts = {
			displayDiv: options.displayDiv
		};
		$(selector).click(function(){
			setTimeout( function(){
				LocateCentroid(centroid,opts);
			}, 0);
			return false;
		});
	};
};

function PerformQueries(request, options) {
	if( $.NUNALIIT_DBWEB ) {
		// Create queries
		var queries = [];
		
		// Persons
		if( request.persons ) {
			for(var person_id in request.persons) {
				var query = {
					tableName: 'persons'
					,whereClauses: [
						$.NUNALIIT_DBWEB.formatWhereClause(
							'id'
							,$.NUNALIIT_DBWEB.whereComparison_eq
							,person_id
							)
					]
					,loaded: DisplayPersons
				};
				
				queries.push(query);
			}
		};
		
		// Roles
		if( request.roles ) {
			for(var role_id in request.roles) {
				var query = {
					tableName: 'roles'
					,whereClauses: [
						$.NUNALIIT_DBWEB.formatWhereClause(
							'id'
							,$.NUNALIIT_DBWEB.whereComparison_eq
							,role_id
							)
					]
					,loaded: DisplayRoles
				};
				
				queries.push(query);
			}
		};
		
		// Creators
		if( request.creators ) {
			for(var creator_id in request.creators) {
				var query = {
					tableName: 'users'
					,whereClauses: [
						$.NUNALIIT_DBWEB.formatWhereClause(
							'id'
							,$.NUNALIIT_DBWEB.whereComparison_eq
							,creator_id
							)
					]
					,loaded: DisplayCreators
				};
				
				queries.push(query);
			}
		};
		
		// Contributions
		if( request.contributions ) {
			for(var contribution_id in request.contributions) {
				var query = {
					tableName: 'contributions'
					,whereClauses: [
						$.NUNALIIT_DBWEB.formatWhereClause(
							'id'
							,$.NUNALIIT_DBWEB.whereComparison_eq
							,contribution_id
							)
					]
					,loaded: DisplayContributions
				};
				
				queries.push(query);
			}
		};
		
		// Events
		if( request.events ) {
			for(var event_id in request.events) {
				var query = {
					tableName: 'events'
					,whereClauses: [
						$.NUNALIIT_DBWEB.formatWhereClause(
							'id'
							,$.NUNALIIT_DBWEB.whereComparison_eq
							,event_id
							)
					]
					,loaded: DisplayEvents
				};
				
				queries.push(query);
			}
		};
		
		// Event Types
		if( request.eventTypes ) {
			for(var event_type_id in request.eventTypes) {
				var query = {
					tableName: 'event_types'
					,whereClauses: [
						$.NUNALIIT_DBWEB.formatWhereClause(
							'id'
							,$.NUNALIIT_DBWEB.whereComparison_eq
							,event_type_id
							)
					]
					,loaded: DisplayEventTypes
				};
				
				queries.push(query);
			}
		};
		
		// Event Persons
		if( request.eventPersons ) {
			for(var event_id in request.eventPersons) {
				var query = {
					tableName: 'relations'
					,whereClauses: [
						$.NUNALIIT_DBWEB.formatWhereClause(
							'event_id'
							,$.NUNALIIT_DBWEB.whereComparison_eq
							,event_id
							)
						,$.NUNALIIT_DBWEB.formatWhereClause(
							'role_id'
							,$.NUNALIIT_DBWEB.whereStatus_notNull
							)
						,$.NUNALIIT_DBWEB.formatWhereClause(
							'person_id'
							,$.NUNALIIT_DBWEB.whereStatus_notNull
							)
					]
					,loaded: DisplayEventPersons
				};
				
				queries.push(query);
			}
		};
		
		// Datasets
		if( request.datasets ) {
			for(var dataset_id in request.datasets) {
				var query = {
					tableName: 'datasets'
					,whereClauses: [
						$.NUNALIIT_DBWEB.formatWhereClause(
							'id'
							,$.NUNALIIT_DBWEB.whereComparison_eq
							,dataset_id
							)
					]
					,loaded: DisplayDatasets
				};
				
				queries.push(query);
			}
		};
		
		// Features
		if( request.features ) {
			for(var feature_id in request.features) {
				var query = {
					tableName: 'features'
					,whereClauses: [
						$.NUNALIIT_DBWEB.formatWhereClause(
							'feature_id'
							,$.NUNALIIT_DBWEB.whereComparison_eq
							,feature_id
							)
					]
					,loaded: DisplayFeatures
				};
				
				queries.push(query);
			}
		};
		
		// Feature Types
		if( request.feature_types ) {
			for(var feature_type_id in request.feature_types) {
				var query = {
					tableName: 'feature_types'
					,whereClauses: [
						$.NUNALIIT_DBWEB.formatWhereClause(
							'id'
							,$.NUNALIIT_DBWEB.whereComparison_eq
							,feature_type_id
							)
					]
					,loaded: DisplayFeatureTypes
				};
				
				queries.push(query);
			}
		};
		
		// Relations given a Feature
		if( request.relations_on_feature ) {
			for(var feature_id in request.relations_on_feature) {
				var query = {
					tableName: 'relations'
					,whereClauses: [
						$.NUNALIIT_DBWEB.formatWhereClause(
							'feature_id'
							,$.NUNALIIT_DBWEB.whereComparison_eq
							,feature_id
							)
					]
					,loaded: DisplayRelations
				};
				
				queries.push(query);
			}
		};
		
		// Centroid given a Feature
		if( request.feature_centroid ) {
			for(var feature_id in request.relations_on_feature) {
				var query = {
					tableName: 'features'
					,selects: [
						$.NUNALIIT_DBWEB.formatFieldSelectorColumn('id')
						,$.NUNALIIT_DBWEB.formatFieldSelectorColumn('feature_id')
						,$.NUNALIIT_DBWEB.formatFieldSelectorCentroid('x','the_geom')
						,$.NUNALIIT_DBWEB.formatFieldSelectorCentroid('y','the_geom')
					]
					,whereClauses: [
						$.NUNALIIT_DBWEB.formatWhereClause(
							'feature_id'
							,$.NUNALIIT_DBWEB.whereComparison_eq
							,feature_id
							)
					]
					,loaded: DisplayCentroids
				};
				
				queries.push(query);
			}
		};
		
		// Relations given a Contribution
		if( request.relations_on_contribution ) {
			for(var contribution_id in request.relations_on_contribution) {
				var query = {
					tableName: 'relations'
					,whereClauses: [
						$.NUNALIIT_DBWEB.formatWhereClause(
							'contribution_id'
							,$.NUNALIIT_DBWEB.whereComparison_eq
							,contribution_id
							)
					]
					,loaded: DisplayRelations
				};
				
				queries.push(query);
			}
		};
		
		// Relations given an Event
		if( request.relations_on_event ) {
			for(var event_id in request.relations_on_event) {
				var query = {
					tableName: 'relations'
					,whereClauses: [
						$.NUNALIIT_DBWEB.formatWhereClause(
							'event_id'
							,$.NUNALIIT_DBWEB.whereComparison_eq
							,event_id
							)
					]
					,loaded: DisplayRelations
				};
				
				queries.push(query);
			}
		};
		
		// Relations given a Creator
		if( request.relations_on_creator ) {
			for(var creator_id in request.relations_on_creator) {
				var query = {
					tableName: 'relations'
					,whereClauses: [
						$.NUNALIIT_DBWEB.formatWhereClause(
							'creator_id'
							,$.NUNALIIT_DBWEB.whereComparison_eq
							,creator_id
							)
					]
					,loaded: DisplayRelations
				};
				
				queries.push(query);
			}
		};
		
		// Relations given a Person
		if( request.relations_on_person ) {
			for(var person_id in request.relations_on_person) {
				var query = {
					tableName: 'relations'
					,whereClauses: [
						$.NUNALIIT_DBWEB.formatWhereClause(
							'person_id'
							,$.NUNALIIT_DBWEB.whereComparison_eq
							,person_id
							)
					]
					,loaded: DisplayRelations
				};
				
				queries.push(query);
			}
		};
		
		if( queries.length < 1 ) {
			// nothing to do
			return;
		};
	
		$.NUNALIIT_DBWEB.queries({
			queries: queries
			,onSuccess: function(result){
				var newRequest = {};
				
				for(var loop=0; loop<queries.length; ++loop) {
					var query = queries[loop];
					if( query.error ) {
						if( !errorOnQueriesReported ) {
							alert("Error accessing database. Some information might be missing.");
							errorOnQueriesReported = 1;
						}
					} else {
						query.loaded( query.results, options, newRequest );
					}
				};
				
				setTimeout(function(){
					PerformQueries(newRequest, options);
				},0);
			}
			,onError: function(error) {
				if( !errorOnQueriesReported ) {
					alert("Error accessing database. Some information might be missing.");
					errorOnQueriesReported = 1;
				}
			}
		});
	};
};

// This function adds the icon to a parent element to
// browse a contribution file	
function AddContributionMedia(contribution, parentElem) {
	var mediaType = GetContributionMediaType(contribution);
	if (null != mediaType) {
		var wrapperDiv = $('<div class="contribution_media_icon_wrapper"></div>');

		var iconDiv = $('<div class="contribution_media_icon '+getMediaIconClass(mediaType)
				+'" alt="'+getAltTagFromMediaType(mediaType)+'"></div>');
		wrapperDiv.append(iconDiv);
		
		if( typeof contribution.file_size != 'undefined' 
		 && contribution.file_size > 0
		 ) {
		 	wrapperDiv.append( $('<span>'+formatFileSize(contribution.file_size)+'</span>') );
		}
		
		wrapperDiv.click(function(){
			DisplayClickedContributionMedia(contribution);
			return false;
		});
		
		parentElem.append(wrapperDiv);
	}

	function getMediaIconClass(mediaType) {
		return("contribution_"+mediaType+"_icon");	
	};

	function getAltTagFromMediaType(mediaType) {
		return("a contributed "+mediaType+" file");
	};

	function formatFileSize(value_) {
		var _1M = 1048576;
		var _1K = 1024;
		
		if (value_ > _1M) {
			return('' + (value_ / _1M).toFixed(1) + ' MBytes');
		} else if (value_ > _1K) {
			return('' + (value_ / _1K).toFixed(1) + ' KBytes');
		}
		return('' + value_ + ' Bytes');
	}
};

function GetContributionMediaType(contribution) {
	var mediaType = null;
	var f = contribution.filename;
	var m = contribution.mimetype;
	
	return $n2.getMediaType(f,m);
};

function DisplayClickedContributionMedia(contribution) {
	contribution_dialog.empty();
	contribution_dialog.html(_generateModalHtmlForMedia(contribution, getMediaPath(), true));
	//contribution_dialog.dialog("option", "title", whole_name);
	contribution_dialog.dialog("option","width",620);
	contribution_dialog.dialog("option","height","auto");
	contribution_dialog.dialog("option","maxHeight",620);
	contribution_dialog.dialog('open');

	function _generateModalHtmlForMedia(contrib, path, showCaption) {
		var filename = contrib.filename;
		var caption = contrib.caption;
		var title = contrib.title;
		var story = contrib.story;
		var translated_story = contrib.translated_story;

		if( null === filename 
		 || '' === filename ) {
			return('');
		}

		var displayOptions = {
			type: GetContributionMediaType(contrib)
			,url: path + filename
		};
		
		if( typeof(contrib.caption) === 'string' 
		 && contrib.caption !== '' ) {
			displayOptions.caption = contrib.caption;
		};
		
		if( typeof(contrib.title) === 'string' 
		 && contrib.title !== '' ) {
			displayOptions.headerHtml = contrib.title;
		};

		displayOptions.footerHtml = '';
		if( typeof(caption) === 'string' 
		 && '' !== caption ) {
			displayOptions.footerHtml += caption+'<br/>';
		};
		if( typeof(story) === 'string' 
		 && '' !== story ) {
			displayOptions.footerHtml += story+'<br/>';
		};
		if( typeof(translated_story) === 'string' 
		 && '' !== translated_story ) {
			displayOptions.footerHtml += translated_story+'<br/>';
		}

		var html = $n2.mediaDisplay.generateInlineHtmlForMedia(displayOptions);
		
		return html;
	};
};

// This function deals with a feature from the map (OpenLayer feature)
function DisplayClickedMapFeature(feature, options_) {
	var options = $.extend({},options_,{suppressFeatures:true});

	// Build a "db" version of the feature from the map entity
	var dbFeature = {};
    for(var i in feature.attributes) {
		if( feature.attributes.hasOwnProperty(i) 
		 && feature.attributes[i] !== null
		 ) {
		 dbFeature[i] = feature.attributes[i];
		}
	}
	
	DisplayClickedFeature(dbFeature, options_);
};

// This function deals with a feature from the database
function DisplayClickedFeature(feature, options_) {
	var options = $.extend({},options_,{suppressFeatures:true});

	var request = {};

	// Display information at hand
	$('#'+options.displayDiv).empty();
	$('#'+options.displayDiv).append( $('<table class="clicked_header"><tr><td>Feature</td></tr></table>') );

	var table = $('<table></table>');
	$('#'+options.displayDiv).append(table);
	
	if( feature.feature_id ) {
		table.append( $('<tr><td>Feature id:&nbsp;</td><td>'+feature.feature_id+'</td></tr>') );
	};

	if( feature.feature_type_id ) {
		table.append( $('<tr><td>Feature Type:&nbsp;</td><td><span class="_feature_type_id_'+feature.feature_type_id+'">'+feature.feature_type_id+'</span></td></tr>') );
		AddToRequest(request, 'feature_types', feature.feature_type_id);
	};

	if( feature.description ) {
		table.append( $('<tr><td>Description:&nbsp;</td><td>'+feature.description+'</td></tr>') );
	};
	
	if( feature.toponymy ) {
		table.append( $('<tr><td>Name: &nbsp;</td><td>'+feature.toponymy+'</td></tr>') );
	};
	
	/*if( feature.creator_id ) {
		table.append( $('<tr><td>Created by:</td><td><span class="_creator_id_'+feature.creator_id+'">Creator('+feature.creator_id+')</span></td></tr>') );
		AddToRequest(request, 'creators', feature.creator_id);
	};*/
	
	/*if( feature.dataset_id ) {
		table.append( $('<tr><td>Dataset:</td><td><span class="_dataset_id_'+feature.dataset_id+'">'+feature.dataset_id+'</span></td></tr>') );
		AddToRequest(request, 'datasets', feature.dataset_id);
	};*/
	
	if( feature.feature_id ) {
		table.append( $('<tr><td></td><td><span class="_feature_centroid_id_'+feature.feature_id+'"></span></td></tr>') );
		AddToRequest(request, 'feature_centroid', feature.feature_id);
	}

	$("#"+options.displayDiv).append( $('<div id="isiuopRelations"></div>') );

	// Get all related information
	AddToRequest(request, 'relations_on_feature', feature.feature_id);
	PerformQueries(request,options);
};

function DisplayClickedContribution(contribution, options_) {
	var options = $.extend({},options_,{suppressContributions:true});

	var request = {};

	// Display information at hand
	$('#'+options.displayDiv).empty();
	$('#'+options.displayDiv).append( $('<table class="clicked_header"><tr><td>Contribution</td></tr></table>') );

	var table = $('<table></table>');
	$('#'+options.displayDiv).append(table);
	
	if( contribution.caption ) {
		table.append( $('<tr><td>Caption:</td><td>'+contribution.caption+'</td></tr>') );
	};

	if( contribution.original_filename ) {
		table.append( $('<tr><td>File Name:</td><td>'+contribution.original_filename+'</td></tr>') );
	};

	if( contribution.mimetype ) {
		table.append( $('<tr><td>MIME Type:</td><td>'+contribution.mimetype+'</td></tr>') );
	};

	if( contribution.story ) {
		table.append( $('<tr><td>Story:</td><td>'+contribution.story+'</td></tr>') );
	};

	if( contribution.translated_story ) {
		table.append( $('<tr><td>Story (translated):</td><td>'+contribution.translated_story+'</td></tr>') );
	};

	if( contribution.create_ts && contribution.create_ts.raw ) {
		var date = new Date(contribution.create_ts.raw);
		table.append( $('<tr><td>Created</td><td>'+date+'</td></tr>') );
	}

	if( contribution.creator_id ) {
		table.append( $('<tr><td>Created by:</td><td><span class="_creator_id_'+contribution.creator_id+'">Creator('+contribution.creator_id+')</span></td></tr>') );
		AddToRequest(request, 'creators', contribution.creator_id);
	};

	if( contribution.dataset_id ) {
		table.append( $('<tr><td>Dataset:</td><td><span class="_dataset_id_'+contribution.dataset_id+'">'+contribution.dataset_id+'</span></td></tr>') );
		AddToRequest(request, 'datasets', contribution.dataset_id);
	};

	if( contribution.id ) {
		table.append( $('<tr><td>id:</td><td>'+contribution.id+'</td></tr>') );
	};

	if( contribution.filename ) {
		var tr = $('<tr><td>Media:</td></tr>');
		table.append(tr);
		var td = $('<td></td>');
		tr.append(td);
		td.append( $('<span>'+contribution.filename+'</span>') );
		AddContributionMedia(contribution, td);
	};

	$("#"+options.displayDiv).append( $('<div id="isiuopRelations"></div>') );

	// Get all related information
	AddToRequest(request, 'relations_on_contribution', contribution.id);
	PerformQueries(request,options);
};

function DisplayClickedEvent(event, options_) {
	var options = $.extend({},options_,{suppressEvents:true});

	var request = {};

	// Display information at hand
	$('#'+options.displayDiv).empty();
	$('#'+options.displayDiv).append( $('<table class="clicked_header"><tr><td>Event</td></tr></table>') );

	var table = $('<table></table>');
	$('#'+options.displayDiv).append(table);
	
	if( event.event_type_id ) {
		table.append( $('<tr><td>Type:</td><td><span class="_event_type_'+event.event_type_id+'">EventType('+event.event_type_id+')</span></td></tr>') );
		AddToRequest(request, 'eventTypes', event.event_type_id);
	};

	/*if( event.notes ) {
		table.append( $('<tr><td>Notes:</td><td>'+event.notes+'</td></tr>') );
	};*/

	/*if( event.consent_level ) {
		table.append( $('<tr><td>Consent Level:</td><td>'+event.consent_level+'</td></tr>') );
	};*/

	if( event.date && event.date.raw ) {
		var date = new Date(event.date.raw);
		table.append( $('<tr><td>Date:</td><td>'+date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+'</td></tr>') );
	}

	/*if( event.creator_id ) {
		table.append( $('<tr><td>Created by:</td><td><span class="_creator_id_'+event.creator_id+'">Creator('+event.creator_id+')</span></td></tr>') );
		AddToRequest(request, 'creators', event.creator_id);
	};*/

	/*if( event.dataset_id ) {
		table.append( $('<tr><td>Dataset:</td><td><span class="_dataset_id_'+event.dataset_id+'">'+event.dataset_id+'</span></td></tr>') );
		AddToRequest(request, 'datasets', event.dataset_id);
	};*/

	if( event.id ) {
		table.append( $('<tr><td>id:</td><td>'+event.id+'</td></tr>') );
	};

	$("#"+options.displayDiv).append( $('<div id="isiuopRelations"></div>') );

	// Get all related information
	AddToRequest(request, 'relations_on_event', event.id);
	PerformQueries(request,options);
};

function DisplayClickedCreator(creator, options_) {
	var options = $.extend({},options_,{suppressCreators:true});

	// Display information at hand
	$('#'+options.displayDiv).empty();
	$('#'+options.displayDiv).append( $('<table class="clicked_header"><tr><td>Creator</td></tr></table>') );

	$("#"+options.displayDiv).append( $('<table>'
		+'<tr><td>Name</td><td>'+creator.name+'</td></tr>'
		+'<tr><td>e-mail</td><td>'+creator.email+'</td></tr>'
		+'</table>') );
	$("#"+options.displayDiv).append( $('<div id="isiuopRelations"></div>') );

	// Get all related information
	var request = {};

	if( creator.id ) {
		AddToRequest(request, 'relations_on_creator', creator.id);
	};
	
	PerformQueries(request,options);
};

function DisplayClickedPerson(person, options_) {
	var options = $.extend({},options_,{suppressPersons:true});
	
	// Display information at hand
	$('#'+options.displayDiv).empty();
	$('#'+options.displayDiv).append( $('<table class="clicked_header"><tr><td>Person</td></tr></table>') );

	var displayHtml = [];
	displayHtml.push('<table>');
	displayHtml.push('<tr><td>Name</td><td>'+person.first_name+' '+person.last_name+'</td></tr>');
//	displayHtml.push('<tr><td>e-mail</td><td>'+(person.email?person.email:'')+'</td></tr>');
	displayHtml.push('<tr><td></td><td><a href="./params.html?title='+person.first_name+' '+person.last_name+'&person_id='+person.id+'">My contributions</a></td></tr>');
	if( olkitFunctionMap && olkitFunctionMap.addStyleFilter ) {
		displayHtml.push('<tr><td></td><td><a class="_personIdFilter _personIdFilter_'+person.id+'" href="#">Show only features related to '+person.first_name+' '+person.last_name+'</a></td></tr>');
	};
	displayHtml.push('</table>');

	$("#"+options.displayDiv).append( $(displayHtml.join('')) );
	$("#"+options.displayDiv).append( $('<div id="isiuopRelations"></div>') );
	$('._personIdFilter_'+person.id)
		.click( StyleFilterForPersonIdClicked )
		.each(function(i,elem){
			elem._person = person;
		})
		;

	// Get all related information
	var request = {};

	if( person.id ) {
		AddToRequest(request, 'relations_on_person', person.id);
	};
	
	PerformQueries(request,options);
	
	return false;
};

function StyleFilterForPersonIdClicked(evt) {
	var linkElem = $(this);
	var person = this._person;
	var classNames = linkElem.attr('class');
	
	if( !person ) {
		linkElem.text('...broken link...');
		return;
	};
	
	linkElem.remove();

	olkitFunctionMap.addStyleFilter({
		description: 'Show only features for '+person.first_name+' '+person.last_name
		,refreshFunction: refresh
		,inFilterStyle: null
		,outFilterStyle: null
	});

	function refresh(refreshOptions) {

		$.NUNALIIT_ADHOC_QUERIES.query({
			label: 'feature ids from person id'
			,args: [person.id,1]
			,onSuccess: function(result){
				var featureIds = [];
				for(var loop=0; loop<result.length; ++loop) {
					if( result[loop].id ) {
						featureIds.push( result[loop].id );
					};
				};
	
				refreshOptions.filterOnFids(featureIds);
			}
			,onError: refreshOptions.onError
		});
	};

	return false; 
};

function LocateCentroid(centroid,opts) {
	if( olkitFunctionMap && olkitFunctionMap.centerMapOnFeatureId ) {
		olkitFunctionMap.centerMapOnFeatureId(
			centroid.feature_id
			,centroid.x
			,centroid.y
			);
	}
}

function Configure(olkitFunctionMap_) {
	olkitFunctionMap = olkitFunctionMap_;
};

// Install on jQuery the OLKIT callback
var defaultOptions = {
	displayDiv: null // must be supplied
	,suppressPersons: false
	,suppressContributions: false
	,suppressRoles: false
	,suppressEvents: false
	,suppressCreators: false
	,suppressFeatures: false
};
function ClickedFeatureHandler(feature, options_) {

	var options = $.extend({},defaultOptions,options_);

	if( null != feature ) {
		DisplayClickedMapFeature(feature, options);
	};

};

$.olkitDisplay = {
	Configure: Configure
	,ClickedFeatureHandler: ClickedFeatureHandler
	,PerformQueries: PerformQueries
	,AddToRequest: AddToRequest
	,DisplayPersons: DisplayPersons
	,DisplayFeatures: DisplayFeatures
	,DisplayEvents: DisplayEvents
	,DisplayContributions: DisplayContributions
};

})(jQuery);
