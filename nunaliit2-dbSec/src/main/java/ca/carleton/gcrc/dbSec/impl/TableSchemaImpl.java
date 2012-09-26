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

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Vector;

import org.json.JSONArray;
import org.json.JSONObject;

import ca.carleton.gcrc.dbSec.ColumnData;
import ca.carleton.gcrc.dbSec.OperationAccess;
import ca.carleton.gcrc.dbSec.TableSchema;

public class TableSchemaImpl implements TableSchema {

	private String logicalName;
	private String physicalName;
	private int groupId;
	private OperationAccess queryAccess;
	private OperationAccess insertAccess;
	private OperationAccess updateAccess;
	private OperationAccess deleteAccess;
	private Map<String,ColumnDataImpl> columnMap = new HashMap<String,ColumnDataImpl>();

	public String getLogicalName() {
		return logicalName;
	}
	public void setLogicalName(String tableName) {
		this.logicalName = tableName;
	}
	
	public String getPhysicalName() {
		return physicalName;
	}
	public void setPhysicalName(String viewName) {
		this.physicalName = viewName;
	}

	public int getGroupId() {
		return groupId;
	}
	public void setGroupId(int groupId) {
		this.groupId = groupId;
	}

	public OperationAccess getQueryAccess() {
		return queryAccess;
	}
	public void setQueryAccess(OperationAccess queryAccess) {
		this.queryAccess = queryAccess;
	}
	
	public OperationAccess getInsertAccess() {
		return insertAccess;
	}
	public void setInsertAccess(OperationAccess insertAccess) {
		this.insertAccess = insertAccess;
	}
	
	public OperationAccess getUpdateAccess() {
		return updateAccess;
	}
	public void setUpdateAccess(OperationAccess updateAccess) {
		this.updateAccess = updateAccess;
	}

	public OperationAccess getDeleteAccess() {
		return deleteAccess;
	}
	public void setDeleteAccess(OperationAccess deleteAccess) {
		this.deleteAccess = deleteAccess;
	}

	public List<ColumnData> getColumns() {
		List<ColumnData> result = new Vector<ColumnData>();
		result.addAll( columnMap.values() );
		return result;
	}
	public ColumnData getColumnFromName(String columnName) {
		return columnMap.get(columnName);
	}
	public ColumnDataImpl createColumnDataFromName(String columnName) {
		ColumnDataImpl columnData = columnMap.get(columnName);
		if( null == columnData ) {
			columnData = new ColumnDataImpl();
			columnData.setColumnName(columnName);
			columnMap.put(columnName,columnData);
		}
		return columnData;
	}
	
	public JSONObject toJSON() throws Exception {
		JSONObject obj = new JSONObject();
		
		obj.put("table", logicalName);

		obj.put("isQueryAllowed", queryAccess.isAllowed());
		obj.put("isInsertAllowed", insertAccess.isAllowed());
		obj.put("isUpdateAllowed", updateAccess.isAllowed());
		obj.put("isDeleteAllowed", deleteAccess.isAllowed());
		
		JSONArray array = new JSONArray();
		for(ColumnData columnData : getColumns()) {
			if( columnData.isReadable() ) {
				JSONObject col = columnData.toJSON();
				array.put(col);
			}
		}
		obj.put("columns", array);
		
		return obj;
	}
}
