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

*/

;(function($) {
"use strict";

//**************************
// Requires:
//     json2.js (http://www.JSON.org/js.html)

// === Error ====================================	

	// Given an error returned on xmlHttpRequest, attempt to recover
	// text error returned, if any is available	
	var convertXmlHttpRequestError = function(xmlHttpRequest, textStatus) {
		try {
			var responseText = xmlHttpRequest.responseText;
			var msg = null;
			eval('msg = '+responseText+';');
			if( msg.error ) {
				return msg.error;
			}
		} catch(e) {
		}
		return { message: 'Server error: '+textStatus };
	};
	
	
// === DBWEB ====================================	

	var defaultOptions = {
		url: './dbWeb'
		,onSuccess: function(result,options){}
		,onError: function(result,options){}
	};
	
	var addTable = function(data,options) {
		data.table = options.tableName;
	};

	var addWhereClauses = function(data,options) {
		if( options.whereClauses ) { // whereClauses is an array (can't use field name as key - it could be repeated with different tests)
			data.where = []; // these are actually SQL where constructs
			for(var i=0; i<options.whereClauses.length; i++) {
				data.where.push(options.whereClauses[i]);
			};
		};
	};
	
	var addSelects = function(data,options) {
		if( options.selects ) {
			data.select = []; // list of columns to include in query response
			for(var i=0; i<options.selects.length; i++) {
				data.select.push(options.selects[i]);
			};
		};
	};

	var addGrouping = function(data,options) {
		if( options.groupBys ) {
			data.groupBy = []; // list of columns to group by
			for(var i=0; i<options.groupBys.length; i++) {
				data.groupBy.push(options.groupBys[i]);
			};
		};
	};

	var addOrder = function(data,options) {
		if( options.orderBy ) {
			data.orderBy = options.orderBy;
		};
	};

	var addLimit = function(data,options) {
		if( options.limit ) {
			data.limit = options.limit;
		};
		if( options.offset ) {
			data.offset = options.offset;
		};
	};

	var addSetters = function(data,options) {
		if( options.setters ) {
			data.set = [];
			for( var key in options.setters ) {
				var value = options.setters[key];
				data.set.push(''+key+','+value);
			};
		};
	};
	
	var configure = function(options_) {
		var options = $.extend({},defaultOptions,options_);
		defaultOptions = options;
	};
	
	var getCapabilities = function(options_) {
		var options = $.extend({},defaultOptions,options_);

		var data = {};
		
		$.ajax({
			type: 'GET'
			,url: options.url + '/getCapabilities'
			,data: data
			,dataType: 'json'
			,async: true
			,success: onSuccess
			,error: onError
		});

		function onSuccess(result) {

			if( result.error ) {
				options.onError(result.error,options);
				
			} else if( result.capabilities ) {
				options.onSuccess(result.capabilities,options);
				
			} else {
				options.onError({message:'Capabilities not returned'},options);
			};
		};
		
		function onError(xmlHttpRequest, textStatus, errorThrown) {
			var e = convertXmlHttpRequestError(xmlHttpRequest, textStatus);
			options.onError(e,options);
		};
	};
	
	var getSchema = function(options_) {
		var options = $.extend({},defaultOptions,options_);

		var data = {};
		
		addTable(data,options);
		
		$.ajax({
			type: 'GET'
			,url: options.url + '/getSchema'
			,data: data
			,dataType: 'json'
			,async: true
			,success: onSuccess
			,error: onError
		});

		function onSuccess(result) {
			if( result.error ) {
				options.onError(result.error,options);
			} else {
				options.onSuccess(result,options);
			};
		};
		
		function onError(xmlHttpRequest, textStatus, errorThrown) {
			var e = convertXmlHttpRequestError(xmlHttpRequest, textStatus);
			options.onError(e,options);
		};
	};
	
	var query = function(options_) {
		var options = $.extend({},defaultOptions,options_);

		var data = {};
		
		addTable(data,options);
		addWhereClauses(data,options);
		addSelects(data,options);
		addGrouping(data,options);
		addOrder(data,options);
		addLimit(data,options);

		$.ajax({
			type: 'POST'
			,url: options.url + '/query'
			,data: data
			,dataType: 'json'
			,contentType: 'application/x-www-form-urlencoded; charset=utf-8'
			,async: true
			,traditional: true
			,success: onSuccess
			,error: onError
		});

		function onSuccess(result) {
			if( result.error ) {
				options.onError(result.error,options);
				
			} else if( result.queried ) {
				options.onSuccess(result.queried,options);
				
			} else {
				options.onError({message:'Queried objects not returned'},options);
			};
		};
		
		function onError(xmlHttpRequest, textStatus, errorThrown) {
			var e = convertXmlHttpRequestError(xmlHttpRequest, textStatus);
			options.onError(e,options);
		};
	};
	
	var queries = function(options_) {
		var options = $.extend({},defaultOptions,options_);

		var queries = options.queries;
		if( null == queries ) {
			options.onError({
				message: '"queries" not specified'
				},options_);
			return;
		};

		// loop over queries
		var request = {};
		for(var queryIndex=0; queryIndex<queries.length; ++queryIndex) {
			var query = queries[queryIndex];
			var queryObj = {};

			// Associate query with key			
			request['q'+queryIndex] = queryObj;

			// Add table name
			queryObj.table = query.tableName;
			if( !queryObj.table ) {
				options.onError({
					message: 'Missing table name'
					},options_);
				return;
			}

			// Add field selectors
			if( query.selects ) {
				queryObj.select = query.selects;
			}
			
			// Add record selectors
			if( query.whereClauses ) {
				queryObj.where = query.whereClauses;
			}
			
			// Add grouping
			if( query.groupBys ) {
				queryObj.groupBy = query.groupBys;
			}
			
			// Add orderBy
			if( query.orderBy ) {
				queryObj.orderBy = query.orderBy;
			}
			
			// Add limit
			if( query.limit ) {
				queryObj.limit = query.limit;
			}
			
			// Add offset
			if( query.offset ) {
				queryObj.offset = query.offset;
			}
		}

		var jsonString = JSON.stringify(request);
		var data = {
			queries: jsonString
		};
		
		$.ajax({
			type: 'POST'
			,url: options.url + '/queries'
			,data: data
			,dataType: 'json'
			,contentType: 'application/x-www-form-urlencoded; charset=utf-8'
			,async: true
			,success: onSuccess
			,error: onError
			,traditional: true
		});

		function onSuccess(result) {
			if( result.error ) {
				options.onError(result.error,options_);
				
			} else {
				for(var queryIndex=0; queryIndex<queries.length; ++queryIndex) {
					var query = queries[queryIndex];
					var key = 'q'+queryIndex;
					var response = result[key];
					
					if( null == response ) {
						query.error = {message:'No Response'};
						
					} else if( typeof response == 'object'
					  && typeof response.length == 'number' ) {
						// Success
						query.results = response;
					  
					} else if( typeof response == 'object'
					  && typeof response.message == 'string' ) {
						query.error = response;
					  
					} else {
						query.error = {message:'Unrecognized response'};
					} 
				};
				
				options.onSuccess(queries,options_);
			};
		};
		
		function onError(xmlHttpRequest, textStatus, errorThrown) {
			var e = convertXmlHttpRequestError(xmlHttpRequest, textStatus);
			options.onError(e,options);
		};
	};
	
	var insert = function(options_) {
		var options = $.extend({},defaultOptions,options_);

		var data = {};
		
		addTable(data,options);
		addSetters(data,options);
		
		$.ajax({
			type: 'POST'
			,url: options.url + '/insert'
			,data: data
			,dataType: 'json'
			,contentType: 'application/x-www-form-urlencoded; charset=utf-8'
			,async: true
			,success: onSuccess
			,error: onError
			,traditional: true
		});

		function onSuccess(result) {
			if( result.error ) {
				options.onError(result.error,options);
				
			} else if( result.inserted ) {
				options.onSuccess(result.inserted,options);
				
			} else {
				options.onError({message:'Inserted objects not returned'},options);
			};
		};
		
		function onError(xmlHttpRequest, textStatus, errorThrown) {
			var e = convertXmlHttpRequestError(xmlHttpRequest, textStatus);
			options.onError(e,options);
		};
	};
	
	var update = function(options_) {
		var options = $.extend({},defaultOptions,options_);

		var data = {};
		
		addTable(data,options);
		addWhereClauses(data,options);
		addSetters(data,options);
		
		$.ajax({
			type: 'POST'
			,url: options.url + '/update'
			,data: data
			,dataType: 'json'
			,contentType: 'application/x-www-form-urlencoded; charset=utf-8'
			,async: true
			,success: onSuccess
			,error: onError
			,traditional: true
		});

		function onSuccess(result) {
			if( result.error ) {
				options.onError(result.error,options);
				
			} else if( result.updated ) {
				options.onSuccess(result.updated,options);
				
			} else {
				options.onError({message:'Updated objects not returned'},options);
			};
		};
		
		function onError(xmlHttpRequest, textStatus, errorThrown) {
			var e = convertXmlHttpRequestError(xmlHttpRequest, textStatus);
			options.onError(e,options);
		};
	};
	
	var remove = function(options_) {
		var options = $.extend({},defaultOptions,options_);

		var data = {};
		
		addTable(data,options);
		addWhereClauses(data,options);
		
		$.ajax({
			type: 'POST'
			,url: options.url + '/delete'
			,data: data
			,dataType: 'json'
			,contentType: 'application/x-www-form-urlencoded; charset=utf-8'
			,async: true
			,success: onSuccess
			,error: onError
			,traditional: true
		});

		function onSuccess(result) {
			if( result.error ) {
				options.onError(result.error,options);
				
			} else {
				options.onSuccess(result,options);
			};
		};
		
		function onError(xmlHttpRequest, textStatus, errorThrown) {
			var e = convertXmlHttpRequestError(xmlHttpRequest, textStatus);
			options.onError(e,options);
		};
	};
	
	// where clause: comparison enum values
	var whereComparison_eq = 'eq'; // equal
	var whereComparison_ne = 'ne'; // not equal
	var whereComparison_ge = 'ge'; // greater than or equal
	var whereComparison_le = 'le'; // less than or equal
	var whereComparison_gt = 'gt'; // greater than
	var whereComparison_lt = 'lt'; // less than
	var whereStatus_null   = 'null';
	var whereStatus_notNull = 'notNull';
	var orderByAscending = 'a';
	var orderByDescending = 'd';
	
	
	var formatWhereClause = function(column, compEnum, value) {
		/*
		 * value may be null in which case, this should be a non comparison where (eg., is null).
		 *
		 * In either case, first two parameters should be strings, one of which is provided by
		 * the enums above...
		 */
		if (null == value) {
			return compEnum + '(' + column + ')';
		} else {
			return compEnum + '(' + column + ')' + value;
		};
	};

	var formatSearchStringRecordSelector = function(searchString, column1, column2) {

		var selector = 'search(';
		for(var loop=1; loop<arguments.length; ++loop) {
			if( 1 != loop ) { selector += ','; }
			selector += arguments[loop];			
		}
		selector += ')';
		selector += searchString;
		return selector;
	};
	
	var formatFieldSelectorColumn = function(column) {
		return ''+column;
	};
	
	// select clause: aggregation functions
	var selectAggregator_min = 'min'; // minimum
	var selectAggregator_max = 'max'; // maximum
	var selectAggregator_sum = 'sum'; // summation
	var formatFieldSelectorFunction = function(column, aggEnum) {
		/*
		 * aggEnum may be null in which case the column name is unmodified (no aggregation requested)
		 *
		 * In either case, first two parameters if provided should be strings,
		 * one of which is provided by the enums above...
		 */
		if (null == aggEnum) {
			return(column);
		} else {
			return(aggEnum + '(' + column + ')');
		};
	};
	
	var formatFieldSelectorScoreSubstring = function(searchString) {
		var selector = 'score(';
		for(var loop=1; loop<arguments.length; ++loop) {
			if( 1 != loop ) { selector += ','; }
			selector += arguments[loop];			
		}
		selector += ')';
		selector += searchString;
		return selector;
	};
	
	var formatFieldSelectorCentroid = function(axis,fieldName) {
		return 'centroid('+axis+','+fieldName+')';
	};
	
	var formatOrderBy = function(type, fieldSelector) {
		return type+','+fieldSelector;
	};
	
	$.NUNALIIT_DBWEB = {
		// main async data operations
		getCapabilities: getCapabilities
		,getSchema: getSchema
		,query: query
		,queries: queries
		,insert: insert
		,update: update
		,remove: remove
		,configure: configure
		
		// enums for formatting where clause entries
		,whereComparison_eq: whereComparison_eq
		,whereComparison_ne: whereComparison_ne
		,whereComparison_ge: whereComparison_ge
		,whereComparison_le: whereComparison_le
		,whereComparison_gt: whereComparison_gt
		,whereComparison_lt: whereComparison_lt
		,whereStatus_null: whereStatus_null
		,whereStatus_notNull: whereStatus_notNull
		,orderByAscending: orderByAscending
		,orderByDescending: orderByDescending
		
		// enums for formatting select clause entries
		,selectAggregator_min: selectAggregator_min
		,selectAggregator_max: selectAggregator_max
		,selectAggregator_sum: selectAggregator_sum
		
		// formatting helpers
		,formatWhereClause: formatWhereClause
		,formatSearchStringRecordSelector: formatSearchStringRecordSelector
		,formatFieldSelectorColumn: formatFieldSelectorColumn
		,formatFieldSelectorFunction: formatFieldSelectorFunction
		,formatFieldSelectorScoreSubstring: formatFieldSelectorScoreSubstring
		,formatFieldSelectorCentroid: formatFieldSelectorCentroid
		,formatOrderBy: formatOrderBy
	};
	
	//===========================================================================================
	// dbWebForm
	$.fn.dbWebForm = function(options_) {
		var jqSet = this;

		var options = $.extend(
			{}
			,defaultOptions
			,{
				installButtons: null
				,data: {}
				,fieldOpts: {} // defaultValue in here can be value or function returning a value
				,onAlert: function(str){ alert(str); }
				,onError: printError
			}
			,options_
			);

		// Request schema
		var getSchemaOptions = $.extend({},defaultOptions,options_,{
			onSuccess: onGetSchemaSuccess
			,onError: onSchemaError
		});
		getSchema(getSchemaOptions);

		// Query objects if required
		if( options.whereClauses ) {
			var queryOptions = $.extend({},defaultOptions,options_,{
				onSuccess: onQuerySuccess
				,onError: onQueryError
			});
			query(queryOptions);
		};
		
		var data = {};
		
		function onGetSchemaSuccess(schema) {
			//log('schema',schema);
			data.schema = schema;
			
			// Check that table can be queried
			if( schema.isQueryAllowed ) {
				// OK
			} else {
				reportError({message:'User does not have privilege to query this data'});
				return;
			}
			
			// In case of update, check that update is allowed
			if( options.whereClauses ) { 
				if( schema.isUpdateAllowed ) {
					// OK
				} else {
					reportError({message:'User does not have privilege to update this data'});
					return;
				};
			} else {
				// In case of insert, check that insert is allowed
				if( schema.isInsertAllowed ) {
					// OK
				} else {
					reportError({message:'User does not have privilege to insert new data'});
					return;
				};
			};
			
			onDataAvailable();
		};
		
		function onSchemaError(cause) {
			error = {
				message: 'Error while retrieving schema'
				,cause: cause
			};
			//log('error',error);
			options.onError(error,options);
		};
		
		function onQuerySuccess(queriedObjects) {
			//log('queriedObjects',queriedObjects);
			data.queriedObjects = queriedObjects;
			onDataAvailable();
		};
		
		function onQueryError(cause) {
			error = {
				message: 'Error while querying for data'
				,cause: cause
			};
			//log('error',error);
			options.onError(error,options);
		};
		
		function reportError(error) {
			options.onError(error,options);
		};
		
		function printError(error) {
			var elem = $( jqSet.get(0) );

			var html = [];
			html.push('<div class="dbweb-error">');
			html.push('Error: ');
			html.push(error.message);
			html.push('</div>');
			
			elem.empty();
			elem.html( html.join('') );
		};
		
		function onDataAvailable() {
			if( data.error ) {
				reportError(data.error);
				return;
			};
			
			// A schema is needed
			if( !data.schema ) {
				return;
			};

			// Check if a queried object is required
			if( options.whereClauses ) {
				// A set of selectors were specified. Then, we need to wait for
				// the query request to return
				if( !data.queriedObjects ) {
					return;
				};
				
				// Check returned query request
				if( data.queriedObjects.length < 1 ) {
					reportError({message:'Data can not be edited by current user.'});
					return;
				};
				if( data.queriedObjects.length > 1 ) {
					reportError({message:'Multiple records were returned. Can not proceed with editing.'});
					return;
				};
				
				// Quicker access
				data.queryData = data.queriedObjects[0];
			} else {
				// Insert mode. Use data provided by caller
				data.queryData = options.data;
			};
			
			var elem = $( jqSet.get(0) );

			elem.empty();

			var div = $('<div class="dbweb-form"></div>');
			elem.append(div);
			
			var form = $('<form></form>');
			div.append(form);

			var ul = $('<ul></ul>');
			form.append(ul);

			data.form = {};
			var columns = data.schema.columns;
			for(var loop=0; loop<columns.length; ++loop) {
				var column = columns[loop];
				var columnName = column.column;

				if( column.write ) {
					if( options.fieldOpts[columnName] ) {
						// Special handling specified by caller
						var fieldOpts = options.fieldOpts[columnName];
						
						var mustHide = fieldOpts.hide;
						if( typeof mustHide === 'function' ) {
							mustHide = mustHide();
						};

						if( mustHide ) {
							// Nothing to do
							
						} else if( fieldOpts.choices ) {
							addChoicesInput(form, ul, columnName, fieldOpts);
							
						} else if( fieldOpts.select ) {
							addCallbackInput(form, ul, columnName, fieldOpts);
							
						} else if( 'DATE' == column.type ) { // date could have defaultValue
							addDateInput(form, ul, columnName, fieldOpts);

						} else {
							// Just regular input - but could have defaultValue
							addRegularInput(form, ul, columnName, fieldOpts);

						};
					} else if( 'DATE' == column.type ) {
						addDateInput(form, ul, columnName, {});

					} else {
						// Just regular input
						addRegularInput(form, ul, columnName, {});
					};
				};
			};
			
			// Add buttons
			var buttons = {};

			if( options.whereClauses ) {
				buttons['Save'] = function(saveOptions) {
					updateRecord(data.form,saveOptions);
				};
			} else {
				buttons['Save'] = function(saveOptions) {
					insertRecord(data.form,saveOptions);
				};
			};
			
			// Delete button is available only on update to users
			// allowed to delete
			if( data.schema.isDeleteAllowed && options.whereClauses ) {
				buttons['Delete'] = function(delOptions) {
					delRecord(data.form,delOptions);
				};
			};
			
			if( options.installButtons ) {
				// Tell caller to install buttons since form was
				// created
				options.installButtons(buttons);
			} else {
				var btnDiv = $('<div class="dbweb-buttons"></div>');
				div.append(btnDiv);
				
				if( buttons['Save'] ) {
					var btn = $('<input type="button" value="'+(options.whereClauses?'Update':'Insert')+'"/>');
					btn.click(function(evt){
						buttons['Save']();
						return false;
					});
					btnDiv.append(btn);
				}
				
				if( buttons['Delete'] ) {
					var btn = $('<input type="button" value="Delete"/>');
					btn.click(function(evt){
						buttons['Delete']();
						return false;
					});
					btnDiv.append(btn);
				}
			}
		};

		function retrieveDefaultValue(fieldOpts) {
			var ret = null;
			if ('function' == typeof(fieldOpts.defaultValue)) {
				ret = fieldOpts.defaultValue();
			} else {
				ret = fieldOpts.defaultValue;
			};
			return ret;
		};
		
		function addRegularInput(formElem, ulElem, columnName, fieldOpts) {
			var value = '';
			var valueAttr = '';
			if( "undefined" != typeof( data.queryData[columnName] ) ) {
				value = data.queryData[columnName];
				valueAttr = ' value="'+value+'"';
			} else if( "undefined" != typeof( fieldOpts.defaultValue ) ) {
				value = retrieveDefaultValue(fieldOpts);
				valueAttr = ' value="'+value+'"';
			};
			
			var li = $('<li></li>');
			appendLabel(li,columnName);
			
			var input = $('<input class="dbWebFormInput" type="text" name="'+columnName+'"'+valueAttr+'/>');
			li.append(input);
			
			saveInput(columnName, input, value);

			ulElem.append(li);
		};
		
		function addDateInput(formElem, ulElem, columnName, fieldOpts) {
			var value = '';
			var valueAttr = '';
			if (isDefined(data.queryData[columnName]) && isDefined(data.queryData[columnName].formatted)) {
				// object returned in JSON query - OBJECT
				value = data.queryData[columnName].formatted;
				valueAttr = ' value="'+value+'"';
			} else if (isDefined(fieldOpts.defaultValue)) { // provide in client side code as STRING
				value = retrieveDefaultValue(fieldOpts);
				valueAttr = ' value="'+value+'"';
			};
			
			var li = $('<li></li>');
			appendLabel(li,columnName);
			
			var input = $('<input class="dbWebFormInput" type="text" name="'+columnName+'"'+valueAttr+'/>');
			input.datepicker({
				dateFormat: 'yy-mm-dd'
				,gotoCurrent: true
				,changeYear: true
				,showButtonPanel: true
				,closeText: 'Close'
			});
			li.append(input);
			saveInput(columnName, input, value);

			ulElem.append(li);
		};

		function addChoicesInput(formElem, ulElem, columnName, fieldOpts) {
			var value = '';
			if( "undefined" != typeof( data.queryData[columnName] ) ) {
				value = data.queryData[columnName];
			} else if( "undefined" != typeof( fieldOpts.defaultValue ) ) {
				value = retrieveDefaultValue(fieldOpts);
			};

			var li = $('<li></li>');
			appendLabel(li,columnName);
			
			var input = $('<select class="dbWebFormSelect"></select>');
			for(var loop=0; loop<fieldOpts.choices.length; ++loop) {
				var choice = fieldOpts.choices[loop];
				
				var html = [];
				html.push('<option value="'+choice.value);
				if( value == choice.value ) {
					html.push('" selected="true');
				};
				html.push('">');
				if( choice.label ) {
					html.push(choice.label);
				} else {
					html.push(choice.value);
				};
				html.push('</option>');
				
				input.append( $(html.join('')) );
			};
			li.append(input);
			
			saveInput(columnName, input, value);

			ulElem.append(li);
		};
		
		function addCallbackInput(formElem, ulElem, columnName, fieldOpts) {
			var value = '';
			var valueAttr = '';
			if( "undefined" != typeof( data.queryData[columnName] ) ) {
				value = data.queryData[columnName];
				valueAttr = ' value="'+value+'"';
			} else if( "undefined" != typeof( fieldOpts.defaultValue ) ) {
				value = retrieveDefaultValue(fieldOpts);
				valueAttr = ' value="'+value+'"';
			};

			var li = $('<li></li>');
			appendLabel(li,columnName);
			
			var input = $('<input class="dbWebFormInput" type="text" name="'+columnName+'"'+valueAttr+'/>');
			li.append(input);
			
			// Add a button to select via the callback
			var button = $('<input class="dbWebFormSelectButton" type="button" value="..."/>');
			button.click(function(evt){
				fieldOpts.select(onSelect);
				return false;
			});
			li.append(button);

			saveInput(columnName, input, value);

			ulElem.append(li);

			function onSelect(value_) {
				input.val(value_);
			};
		};

		function appendLabel(liElem, columnName) {
			var label = $('<label>'+columnName+':</label>');
			liElem.append(label);
		};

		function saveInput(columnName, inputElem, initialValue) {
			inputElem.attr('_initialValue',initialValue);
			data.form[columnName] = inputElem;
		};

		function insertRecord(form, saveOptions) {
			var insertOptions = $.extend({},defaultOptions,options_,saveOptions);
			
			insertOptions.setters = {};
			for(var columnName in form) {
				var input = form[columnName];
				var value = input.val();
				insertOptions.setters[columnName] = value;
			};
			
			insert(insertOptions);
		};
		
		function updateRecord(form, saveOptions) {
			var updateOptions = $.extend({},defaultOptions,options_,saveOptions);
			
			var updating = false;
			updateOptions.setters = {};
			for(var columnName in form) {
				var input = form[columnName];
				var value = input.val();
				var initialValue = input.attr('_initialValue');
				if( value != initialValue ) {
					updateOptions.setters[columnName] = value;
					updating = true;
				};
			};
			
			if( !updating ) {
				options.onAlert('Data left unchanged. No updating required.');
			} else {
				update(updateOptions);
			};
		};
		
		function delRecord(form,delOptions) {
			var removeOptions = $.extend({},defaultOptions,options_,delOptions);
			
			remove(removeOptions);
		};
		
		function updateData(columnName, value) {
			if( data && data.form && data.form[columnName] ) {
				var input = data.form[columnName];
				input.val(value);
			};
		};
		
		// Return an object that can be used to modify the form
		return {
			updateData: updateData 
		};
	};
})(jQuery);