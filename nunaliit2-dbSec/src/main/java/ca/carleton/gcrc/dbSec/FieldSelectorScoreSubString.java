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
package ca.carleton.gcrc.dbSec;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import ca.carleton.gcrc.dbSec.impl.TypedValue;

public class FieldSelectorScoreSubString implements FieldSelector {

	List<String> fieldNames = null;
	String searchedString = null;
	
	public FieldSelectorScoreSubString(List<String> fieldNames, String searchedString) {
		this.fieldNames = new ArrayList<String>(fieldNames);
		this.searchedString = searchedString;
		
		Collections.sort(this.fieldNames);
	}

	public FieldSelectorScoreSubString(String[] fieldNames, String searchedString) {
		this.fieldNames = new ArrayList<String>(fieldNames.length);
		for(String fieldName : fieldNames) {
			this.fieldNames.add(fieldName);
		}
		this.searchedString = searchedString;
		
		Collections.sort(this.fieldNames);
	}

	public List<String> getFieldNames() {
		return fieldNames;
	}

	public String getSearchedString() {
		return searchedString;
	}

	public List<ColumnData> getColumnData(
			TableSchema tableSchema
			) throws Exception {
		List<ColumnData> columnDataList = new ArrayList<ColumnData>(fieldNames.size());
		
		for(String fieldName : fieldNames) {
			columnDataList.add( tableSchema.getColumnFromName(fieldName) );
		}
		
		return columnDataList;
	}
	
	/*
		least(
			coalesce(
				nullif(
					position(lower(?) IN lower(title))
					,0
				)
				,9999
			)
			,coalesce(
				nullif(
					position(lower(?) IN lower(notes))
					,0
				)
				,9999
			)
		) AS score
		
		coalesce - The COALESCE function returns the first of its arguments that 
		           is not null. Null is returned only if all arguments are null.
		nullif   - The NULLIF function returns a null value if value1 and value2 
		           are equal; otherwise it returns value1. 
				
	 */
	public String getQueryString(TableSchema tableSchema, Phase phase) throws Exception {
		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);
		boolean first = true;
		for(String fieldName : fieldNames) {
			if( first ) {
				pw.print("least(coalesce(nullif(position(lower(?) IN lower(");
				first = false;
			} else {
				pw.print(")),0),9999),coalesce(nullif(position(lower(?) IN lower(");
			}
			pw.print(fieldName);
		}
		pw.print(")),0),9999))");
		if( Phase.SELECT == phase ) {
			pw.print(" AS score");
		}
		pw.flush();
		return sw.toString();
	}


	public List<TypedValue> getQueryValues(
			TableSchema tableSchema
			,Variables variables
			) throws Exception {
		List<TypedValue> values = new ArrayList<TypedValue>(fieldNames.size());
		for(String fieldName : fieldNames) {
			ColumnData columnData = tableSchema.getColumnFromName(fieldName);
			values.add( new TypedValue(columnData.getColumnType(), searchedString) );
		}
		return values;
	}

	public String toString() {
		return "_scoreSubString";
	}
}
