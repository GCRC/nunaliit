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
package ca.carleton.gcrc.contributionsImpl;

import java.sql.PreparedStatement;
import java.util.HashMap;
import java.util.Map;
import java.util.Iterator;

import ca.carleton.gcrc.dbSec.ColumnData;
import ca.carleton.gcrc.dbSec.impl.ColumnDataImpl;
import ca.carleton.gcrc.dbSec.impl.ColumnDataUtils;

public class ContributionsFieldSubsetImpl {
	protected Map<String,ColumnData> fieldMap = new HashMap<String,ColumnData>();
	
	public ContributionsFieldSubsetImpl() {
		
	}
	
	public void addColumn(String columnName, int sqlType, String sqlTypeName) throws Exception {
		ColumnDataImpl c = new ColumnDataImpl();
		c.setColumnName(columnName);

		ColumnData.Type colType = ColumnDataUtils.columnDataTypeFromSQLType(sqlType, columnName, sqlTypeName);
		c.setColumnType(colType);
		
		/* 
		 * If the contributions table is readable/writable, all optional fields must be as well.
		 */
		c.setReadable(true);
		c.setWriteable(true);
		fieldMap.put(columnName, c);		
	}
	
	public boolean includes(String fieldName) {
		return(fieldMap.containsKey(fieldName));
	}
	
	public ColumnData getColumnData(String fieldName) {
		return(fieldMap.get(fieldName));
	}
	
	public String getFieldNamesList() {
		String retString = "";
		
		Iterator<String> iter = fieldMap.keySet().iterator();
		boolean first = true;
		while(iter.hasNext()) {
			String token = iter.next();
			if (first) {
				first = false;
			} else {
				retString += ",";
			}
			retString += token;
		}
		
		return(retString);
	}
	
	public String getInsertWildcard(String fieldName) throws Exception {
		ColumnData c = fieldMap.get(fieldName);
		if (null != c) {
			return(c.getInsertWildcard());
		} else {
			throw new Exception("unknown field: "+fieldName);
		}
	}

	public String getUpdateWildcard(String fieldName) throws Exception {
		return(getInsertWildcard(fieldName)); // I think they are all the same
	}

	public String getWhereWildcard(String fieldName) throws Exception {
		ColumnData c = fieldMap.get(fieldName);
		if (null != c) {
			return(c.getWhereWildcard());
		} else {
			throw new Exception("unknown field: "+fieldName);
		}
	}

	public void writeToPreparedStatement(
			PreparedStatement ps,
			String key,
			int index,
			String value) throws Exception {
		ColumnDataUtils.writeToPreparedStatement(ps, index, value, fieldMap.get(key).getColumnType());
	}
}
