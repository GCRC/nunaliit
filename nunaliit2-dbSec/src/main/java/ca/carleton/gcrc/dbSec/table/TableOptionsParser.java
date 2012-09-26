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

$Id$
*/
package ca.carleton.gcrc.dbSec.table;

import java.util.List;

import ca.carleton.gcrc.dbSec.OperationAccess;
import ca.carleton.gcrc.dbSec.RecordSelector;
import ca.carleton.gcrc.dbSec.RecordSelectorComparison;
import ca.carleton.gcrc.dbSec.impl.TableSchemaImpl;
import ca.carleton.gcrc.json.JSONSupport;

import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONTokener;

public class TableOptionsParser {
	
	private enum Option {
		QUERY("query")
		,INSERT("insert")
		,UPDATE("update")
		,DELETE("delete");
		
		private String jsonLabel;
		Option(String jsonLabel) {
			this.jsonLabel = jsonLabel;
		}
		public String getJsonLabel() {
			return jsonLabel;
		}
	}

	static public void parseTableOptions(String optionsString, TableSchemaImpl tableSchema) throws Exception {
		if( null == optionsString ) {
			// nothing to do
			return;
		}

		JSONObject jsonObj = null;
		try {
			JSONTokener jsonTokener = new JSONTokener("{"+optionsString+"}");
			Object obj = jsonTokener.nextValue();
			if( obj instanceof JSONObject ) {
				jsonObj = (JSONObject)obj;
			} else {
				throw new Exception("Unexpected returned object type: "+obj.getClass().getSimpleName());
			}
		} catch(Exception e) {
			throw new Exception("Error while parsing table options: "+optionsString,e);
		}
		
		{
			OperationAccess access = parseOption(jsonObj, Option.QUERY, tableSchema);
			tableSchema.setQueryAccess(access);
		}
		{
			OperationAccess access = parseOption(jsonObj, Option.INSERT, tableSchema);
			if( access.isAllowed() && access.getWhereClauses().size() > 0 ) {
				throw new Exception("Selection is not allowed on insert");
			}
			tableSchema.setInsertAccess(access);
		}
		{
			OperationAccess access = parseOption(jsonObj, Option.UPDATE, tableSchema);
			tableSchema.setUpdateAccess(access);
		}
		{
			OperationAccess access = parseOption(jsonObj, Option.DELETE, tableSchema);
			tableSchema.setDeleteAccess(access);
		}
	}

	static public OperationAccess parseOption(
		JSONObject jsonObj
		,Option option
		,TableSchemaImpl tableSchema
		) throws Exception {

		if( false == JSONSupport.containsKey(jsonObj, option.getJsonLabel()) ) {
			return OperationAccessDisallowed.instance;
		}
		
		Object value = jsonObj.get( option.getJsonLabel() );
		
		// Handle boolean value
		if( value instanceof Boolean ) {
			Boolean b = (Boolean)value;
			
			if( b.booleanValue() ) {
				return OperationAccessAllowed.instance;
			}

			return OperationAccessDisallowed.instance;
		}
		
		// Handle JSONArray
		if( value instanceof JSONArray ) {
			JSONArray array = (JSONArray)value;
			
			if( 0 == array.length() ) {
				return OperationAccessDisallowed.instance;
			}
			
			List<RecordSelector> columnComparisons = 
				RecordSelectorComparison.columnComparisonsFromJson(array, null);

			OperationAccessPartial access = new OperationAccessPartial();
			access.setWhereClauses(columnComparisons);
			return access;
		}
		
		return OperationAccessDisallowed.instance;
	}
}
