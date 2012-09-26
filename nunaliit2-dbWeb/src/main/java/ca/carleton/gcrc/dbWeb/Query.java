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
package ca.carleton.gcrc.dbWeb;

import java.util.List;

import ca.carleton.gcrc.dbSec.OrderSpecifier;
import ca.carleton.gcrc.dbSec.RecordSelector;
import ca.carleton.gcrc.dbSec.FieldSelector;

public class Query {

	private String queryKey;
	private String tableName;
	private List<RecordSelector> whereExpressions = null;
	private List<FieldSelector> fieldSelectors = null;
	private List<FieldSelector> groupByColumnNames = null;
	private List<OrderSpecifier> orderBySpecifiers = null;
	private Integer limit = null;
	private Integer offset = null;
	
	public Query(String queryKey, String tableName) {
		this.queryKey = queryKey;
		this.tableName = tableName;
	}

	public String getQueryKey() {
		return queryKey;
	}

	public String getTableName() {
		return tableName;
	}

	public List<RecordSelector> getWhereExpressions() {
		return whereExpressions;
	}

	public void setWhereExpressions(List<RecordSelector> whereExpressions) {
		this.whereExpressions = whereExpressions;
	}

	public List<FieldSelector> getFieldSelectors() {
		return fieldSelectors;
	}

	public void setFieldSelectors(List<FieldSelector> fieldSelectors) {
		this.fieldSelectors = fieldSelectors;
	}

	public List<FieldSelector> getGroupByColumnNames() {
		return groupByColumnNames;
	}

	public void setGroupByColumnNames(List<FieldSelector> groupByColumnNames) {
		this.groupByColumnNames = groupByColumnNames;
	}

	public List<OrderSpecifier> getOrderBySpecifiers() {
		return orderBySpecifiers;
	}

	public void setOrderBySpecifiers(List<OrderSpecifier> orderBySpecifiers) {
		this.orderBySpecifiers = orderBySpecifiers;
	}

	public Integer getLimit() {
		return limit;
	}

	public void setLimit(Integer limit) {
		this.limit = limit;
	}

	public Integer getOffset() {
		return offset;
	}

	public void setOffset(Integer offset) {
		this.offset = offset;
	}
}
