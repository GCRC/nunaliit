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
package ca.carleton.gcrc.dbSec.impl;

import java.util.List;

import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONTokener;

import ca.carleton.gcrc.dbSec.RecordSelector;
import ca.carleton.gcrc.dbSec.RecordSelectorComparison;
import ca.carleton.gcrc.json.JSONSupport;

public class ColumnOptionsParser {

	static public void parseColumnOptions(String optionsString, ColumnDataImpl columnData) throws Exception {
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
			throw new Exception("Error while parsing column options: "+optionsString,e);
		}
		
		parseWhereOptions(jsonObj, columnData);
		parseOnInsertOptions(jsonObj, columnData);
	}
	
	static private void parseWhereOptions(JSONObject jsonObj, ColumnDataImpl columnData) throws Exception {
		if( null == jsonObj ) {
			// nothing to do
			return;
		}
		
		if( false == JSONSupport.containsKey(jsonObj, "where") ) {
			// nothing to do
			return;
		}
		
		try {
			JSONArray whereArray = jsonObj.getJSONArray("where");
		
			List<RecordSelector> columnComparisons = 
				RecordSelectorComparison.columnComparisonsFromJson(whereArray, columnData);
			
			for(RecordSelector columnComparison : columnComparisons) {
				columnData.addRowSelector(columnComparison);
			}
			
		} catch(Exception e) {
			throw new Exception("Error while parsing 'where' options: "+jsonObj.toString(), e);
		}
	}
		
	static private void parseOnInsertOptions(JSONObject jsonObj, ColumnDataImpl columnData) throws Exception {
		if( null == jsonObj ) {
			// nothing to do
			return;
		}
		
		if( false == JSONSupport.containsKey(jsonObj, "onInsert") ) {
			// nothing to do
			return;
		}
		
		try {
			JSONObject onInsert = jsonObj.getJSONObject("onInsert");
			
			if( JSONSupport.containsKey(onInsert, "incrementInteger") ) {
				String sequenceName = onInsert.getString("incrementInteger");
				columnData.setAutoIncrementSequence(sequenceName);
			}

			if( JSONSupport.containsKey(onInsert, "assignValue") ) {
				String value = onInsert.get("assignValue").toString();
				columnData.setAssignValueOnInsert(value);
			}

			if( JSONSupport.containsKey(onInsert, "assignVariable") ) {
				String value = onInsert.get("assignVariable").toString();
				columnData.setAssignVariableOnInsert(value);
			}
			
		} catch(Exception e) {
			throw new Exception("Error while parsing 'onInsert' options: "+jsonObj.toString(), e);
		}
	}
}
