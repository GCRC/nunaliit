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
import java.util.Vector;

import org.json.JSONObject;
import ca.carleton.gcrc.dbSec.ColumnData;
import ca.carleton.gcrc.dbSec.RecordSelector;

public class ColumnDataImpl implements ColumnData {

	private String columnName;
	private ColumnData.Type columnType = ColumnData.Type.UNKNOWN;
	private boolean readable = true;
	private boolean writeable = true;
	private String autoIncrementSequence = null;
	private String assignValueOnInsert = null;
	private String assignVariableOnInsert = null;
	private List<RecordSelector> rowSelectors;
	private String geomSrid = "4326";

	public String getColumnName() {
		return columnName;
	}
	public void setColumnName(String columnName) {
		this.columnName = columnName;
	}

	public ColumnData.Type getColumnType() {
		return columnType;
	}
	public void setColumnType(ColumnData.Type columnType) {
		this.columnType = columnType;
	}
	
	public boolean isReadable() {
		return readable;
	}
	public void setReadable(boolean readable) {
		this.readable = readable;
	}
	
	public boolean isWriteable() {
		return writeable;
	}
	public void setWriteable(boolean writeable) {
		this.writeable = writeable;
	}

	public boolean isAutoIncrementInteger() {
		return (null != autoIncrementSequence);
	}
	public String getAutoIncrementSequence() throws Exception {
		if( null == autoIncrementSequence ) {
			throw new Exception("No auto increment sequence specified for column "+columnName);
		}
		return autoIncrementSequence;
	}
	public void setAutoIncrementSequence(String autoIncrementSequence) {
		this.autoIncrementSequence = autoIncrementSequence;
	}

	public String getAssignValueOnInsert() {
		return assignValueOnInsert;
	}
	public void setAssignValueOnInsert(String value) {
		this.assignValueOnInsert = value;
	}

	public String getAssignVariableOnInsert() {
		return assignVariableOnInsert;
	}
	public void setAssignVariableOnInsert(String variable) {
		this.assignVariableOnInsert = variable;
	}

	public List<RecordSelector> getRowSelectors() {
		return rowSelectors;
	}
	public void setRowSelectors(List<RecordSelector> rowSelectors) {
		this.rowSelectors = rowSelectors;
	}
	public void addRowSelector(RecordSelector rowSelector) {
		if( null == rowSelectors ) {
			rowSelectors = new Vector<RecordSelector>();
		}
		rowSelectors.add(rowSelector);
	}

	public JSONObject toJSON() throws Exception {
		JSONObject obj = new JSONObject();
		
		obj.put("column", columnName);
		obj.put("read", readable);
		obj.put("write", writeable);
		obj.put("type", columnType.toString());
		
		return obj;
	}
	
	public String getQuerySelector() throws Exception {
		if( ColumnData.Type.DOUBLE == columnType ) {
			return columnName;
		}
		else if( ColumnData.Type.INTEGER == columnType ) {
			return columnName;
		}
		else if( ColumnData.Type.BIGINT == columnType ) {
			return columnName;
		}
		else if( ColumnData.Type.STRING == columnType ) {
			return columnName;
		}
		else if( ColumnData.Type.TIME == columnType ) {
			return columnName;
		}
		else if( ColumnData.Type.TIMESTAMP == columnType ) {
			return columnName;
		}
		else if( ColumnData.Type.DATE == columnType ) {
			return columnName;
		}
		else if( ColumnData.Type.GEOMETRY == columnType ) {
			return "AsText("+columnName+") AS "+columnName;
		}
		else if( ColumnData.Type.BOOLEAN == columnType ) {
			return columnName;
		}

		throw new Exception("Unknown query selector for type: "+columnType+" (column name: "+columnName+")");
	}
	
	public String getWhereWildcard() throws Exception {
		if( ColumnData.Type.DOUBLE == columnType ) {
			return "?";
		}
		else if( ColumnData.Type.INTEGER == columnType ) {
			return "?";
		}
		else if( ColumnData.Type.BIGINT == columnType ) {
			return "?";
		}
		else if( ColumnData.Type.STRING == columnType ) {
			return "?";
		}
		else if( ColumnData.Type.TIME == columnType ) {
			return "?";
		}
		else if( ColumnData.Type.TIMESTAMP == columnType ) {
			return "?";
		}
		else if( ColumnData.Type.DATE == columnType ) {
			return "?";
		}
		else if( ColumnData.Type.GEOMETRY == columnType ) {
			return "GeomFromText(?,"+geomSrid+")";
		}
		else if( ColumnData.Type.BOOLEAN == columnType ) {
			return "?";
		}

		throw new Exception("Unknown query wildcard for type: "+columnType+" (column name: "+columnName+")");
	}
	
	public String getInsertWildcard() throws Exception {
		if( ColumnData.Type.DOUBLE == columnType ) {
			return "?";
		}
		else if( ColumnData.Type.INTEGER == columnType ) {
			return "?";
		}
		else if( ColumnData.Type.BIGINT == columnType ) {
			return "?";
		}
		else if( ColumnData.Type.STRING == columnType ) {
			return "?";
		}
		else if( ColumnData.Type.TIME == columnType ) {
			return "?";
		}
		else if( ColumnData.Type.TIMESTAMP == columnType ) {
			return "?";
		}
		else if( ColumnData.Type.DATE == columnType ) {
			return "?";
		}
		else if( ColumnData.Type.GEOMETRY == columnType ) {
			return "GeomFromText(?,"+geomSrid+")";
		}
		else if( ColumnData.Type.BOOLEAN == columnType ) {
			return "?";
		}

		throw new Exception("Unknown insert wildcard for type: "+columnType+" (column name: "+columnName+")");
	}
}
