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

$Id: dbbrowse.js 8165 2012-05-31 13:14:37Z jpfiset $
*/
;(function($) {

	function performInsertRecord(div, capability) {
		var top = $('<div></div>');
		var error = $('<div></div>');
		div.empty().append(top).append(error);
		
		top.dbWebForm({
			tableName: capability.table
			,onSuccess: function(inserted){
				div.empty();
				div.append('<h2>Inserted:</h2>');
				var ul = $('<ul></ul>');
				div.append(ul);
				for(var key in inserted) {
					var value = inserted[key];
					if( value.formatted ) {
						value = value.formatted;
					}
					var li = $('<li>'+key+': '+value+'</li>');
					ul.append(li);
				}
			}
			,onError: function(e){
				error.text('Error: '+e.message);
			}
		});		
	}

	function displayQueryResults(div, capability, results) {

		var table = $('<table></table>');
		var tr = $('<tr></tr>');
		table.append(tr);
		for(var i=0; i<capability.columns.length; ++i) {
			var column = capability.columns[i];
			tr.append( $('<th>'+column.column+'</th>') );
		}

		for(var loop=0; loop<results.length; ++loop) {
			var tr = $('<tr></tr>');
			table.append(tr);

			for(var i=0; i<capability.columns.length; ++i) {
				var column = capability.columns[i];
				var value = results[loop][column.column];
				
				if( 'undefined' == typeof value ) {
					tr.append( $('<td></td>') );
				} else {
					if( 'DATE' == column.type ) {
						tr.append( $('<td>'+value.formatted+'</td>') );
					} else if( 'TIMESTAMP' == column.type ) {
						tr.append( $('<td>'+value.formatted+'</td>') );
					} else {
						tr.append( $('<td>'+value+'</td>') );
					}
				}
			}
		}
		
		div.empty();
		div.append(table);
	};

	function performQueryAll(div, capability) {
		$.NUNALIIT_DBWEB.query({
			tableName: capability.table
			,onSuccess: function(results){
				displayQueryResults(div, capability, results);
			}
			,onError: function(error){
				div.empty();
				div.text('Error: '+error.message);
			}
		});		
	}

	function displayCapability(jqSet, capability) {
		jqSet.empty();
		jqSet.append( $('<h1>Table '+capability.table+' ('
			+(capability.isQueryAllowed ? 'Q' : '-')
			+(capability.isInsertAllowed ? 'I' : '-')
			+(capability.isUpdateAllowed ? 'U' : '-')
			+(capability.isDeleteAllowed ? 'D' : '-')
			+')</h1>') );
		
		var table = $('<table></table>');
		jqSet.append(table);
		
		table.append( $('<tr><th>Column</th><th>Type</th><th>read?</th><th>write?</th></tr>') );
		
		for(var loop=0; loop<capability.columns.length; ++loop) {
			var column = capability.columns[loop];
			
			var tr = $('<tr></tr>');
			table.append(tr);

			var td = $('<td>'+column.column+'</td>');
			tr.append(td);

			tr.append( $('<td>'+column.type+'</td>') );
			tr.append( $('<td>'+column.read+'</td>') );
			tr.append( $('<td>'+column.write+'</td>') );
		};
		
		var queryAllButton = $('<input type="button" value="Query All"/>');
		jqSet.append(queryAllButton);
		
		var insertButton = $('<input type="button" value="Insert Record"/>');
		jqSet.append(insertButton);
		
		var div = $('<div></div>');
		jqSet.append(div);
		
		queryAllButton.click(function(evt){
			performQueryAll(div, capability);
			return false;
		});
		
		insertButton.click(function(evt){
			performInsertRecord(div, capability);
			return false;
		});
	};

	function displayCapabilities(jqSet, capabilities) {
		var table = $('<table></table>');
		
		table.append( $('<tr><th>Table</th><th>query?</th><th>insert?</th><th>update?</th><th>delete?</th></tr>') );
		
		for(var loop=0; loop<capabilities.length; ++loop) {
			var capability = capabilities[loop];
			
			var tr = $('<tr></tr>');
			table.append(tr);

			var td = $('<td></td>');
			var link = $('<a href=".">'+capability.table+'</a>');
			selectTableClick(link, capability);
			td.append(link);
			tr.append(td);

			tr.append( $('<td>'+capability.isQueryAllowed+'</td>') );
			tr.append( $('<td>'+capability.isInsertAllowed+'</td>') );
			tr.append( $('<td>'+capability.isUpdateAllowed+'</td>') );
			tr.append( $('<td>'+capability.isDeleteAllowed+'</td>') );
		};
		
		jqSet.empty().append( table );
		
		function selectTableClick(link, capability) {
			link.click(function(evt){
				displayCapability(jqSet, capability);
				return false;
			});
		};
	};

	$.fn.dbBrowse = function(options_) {
		var jqSet = this;

		var options = $.extend({
			},options_);

		$.NUNALIIT_DBWEB.getCapabilities({
			onSuccess: function(capabilities) {
				displayCapabilities(jqSet, capabilities);
			}
			,onError: function() {
				jqSet.text('Error obtaining schema');
			}
		});
	};

})(jQuery);