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

import java.util.ArrayList;
import java.util.List;

import ca.carleton.gcrc.dbSec.impl.TypedValue;

/**
 * Instance of field selector which specifies a column name
 *
 */
public class FieldSelectorColumn implements FieldSelector {

	private String columnName;

	public FieldSelectorColumn(String columnName) {
		this.columnName = columnName;
	}
	
	public String getColumnName() {
		return columnName;
	}

	public List<ColumnData> getColumnData(
			TableSchema tableSchema
			) throws Exception {
		List<ColumnData> columnDataList = new ArrayList<ColumnData>(1);
		columnDataList.add( tableSchema.getColumnFromName(columnName) );
		return columnDataList;
	}

	public String getQueryString(TableSchema tableSchema, Phase phase) throws Exception {
		ColumnData cData = tableSchema.getColumnFromName(columnName);
		
		// Check that we can read
		if( null != cData && false == cData.isReadable() ) {
			cData = null;
		}
		
		if( null == cData ) {
			throw new Exception("Select Expression column "+columnName+" is not available in table "+tableSchema.getLogicalName()+ "("+tableSchema.getPhysicalName()+")");
		} 
		
		return cData.getQuerySelector();
	}

	public List<TypedValue> getQueryValues(
			TableSchema tableSchema
			,Variables variables
			) throws Exception {
		return new ArrayList<TypedValue>();
	}

	public String toString() {
		return "column("+columnName+")";
	}
}
