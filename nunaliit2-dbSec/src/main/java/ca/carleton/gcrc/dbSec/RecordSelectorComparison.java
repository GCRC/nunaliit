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
import java.util.Vector;

import org.json.JSONArray;
import org.json.JSONObject;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.dbSec.impl.ExpressionConstantImpl;
import ca.carleton.gcrc.dbSec.impl.ExpressionVariableImpl;
import ca.carleton.gcrc.dbSec.impl.TypedValue;
import ca.carleton.gcrc.json.JSONSupport;

public class RecordSelectorComparison implements RecordSelector {
	public enum Comparison {
		EQUAL(true)
		,NOT_EQUAL(true)
		,GREATER_THAN_OR_EQUAL(true)
		,LESS_THAN_OR_EQUAL(true)
		,GREATER_THAN(true)
		,LESS_THAN(true)
		,IS_NULL(false)
		,IS_NOT_NULL(false)
		;
		
		private boolean fRequiresValue;
		Comparison(boolean fRequiresValue) {
			this.fRequiresValue = fRequiresValue;
		}
		public boolean requiresValue() {
			return fRequiresValue;
		}
	}

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	static public List<RecordSelector> columnComparisonsFromJson(
		JSONArray array
		,ColumnData columnData
		) throws Exception {

		List<RecordSelector> columnComparisons = new Vector<RecordSelector>();
		
		for(int loop=0; loop<array.length(); ++loop) {
			JSONObject jsonComparison = array.getJSONObject(loop);

			RecordSelector whereClause = columnComparisonFromJson(jsonComparison,columnData);
			
			columnComparisons.add(whereClause);
		}

		return columnComparisons;
	}

	static public RecordSelector columnComparisonFromJson(
		JSONObject jsonComparison
		,ColumnData columnData
		) throws Exception {

		String columnName = null;
		if( null != columnData ) {
			columnName = columnData.getColumnName();
		} else {
			if( JSONSupport.containsKey(jsonComparison, "column") ) {
				columnName = jsonComparison.getString("column");
			} else {
				throw new Exception("Column name required");
			}
		}

		Expression expression = null;
		if( JSONSupport.containsKey(jsonComparison, "value") ) {
			String valueString = jsonComparison.get("value").toString();
			expression = new ExpressionConstantImpl(valueString);
		}
		if( JSONSupport.containsKey(jsonComparison, "variable") ) {
			String valueString = jsonComparison.get("variable").toString();
			expression = new ExpressionVariableImpl(valueString);
		}
		
		String comparisonName = jsonComparison.getString("comparison");
		Comparison selectedComparison = null;
		for(Comparison comparison : Comparison.values()) {
			if( comparison.name().equals(comparisonName) ) {
				selectedComparison = comparison;
				break;
			}
		}
		if( null == selectedComparison ) {
			throw new Exception("Unknown comparison: "+comparisonName);
		}
		
		if( selectedComparison.requiresValue() 
		 && null == expression ) {
			throw new Exception("Expression required (value or variable) for comparison: "+selectedComparison.name());
		}

		RecordSelectorComparison comparison = new RecordSelectorComparison(columnName, selectedComparison, expression);
		return comparison;
	}

	
	private String columnName;
	private Comparison comparison;
	private Expression expression;
	
	public RecordSelectorComparison(String columnName, Comparison comparison, Expression expression) {
		this.columnName = columnName;
		this.comparison = comparison;
		this.expression = expression;
	}
	
	public RecordSelectorComparison(String columnName, Comparison comparison, String constantExpression) {
		this.columnName = columnName;
		this.comparison = comparison;
		this.expression = new ExpressionConstantImpl(constantExpression);
	}
	
	public String getColumnName() {
		return columnName;
	}

	public Comparison getComparison() {
		return comparison;
	}

	public Expression getExpression() {
		return expression;
	}

	public String getQueryString(TableSchema tableSchema, Phase phase) throws Exception {
		return "("+columnName+" "+getSqlExpression()+")";
	}

	private String getSqlExpression() throws Exception {
		if( Comparison.EQUAL == comparison ) {
			return " = ?";
		}
		if( Comparison.NOT_EQUAL == comparison ) {
			return " <> ?";
		}
		if( Comparison.GREATER_THAN == comparison ) {
			return " > ?";
		}
		if( Comparison.GREATER_THAN_OR_EQUAL == comparison ) {
			return " >= ?";
		}
		if( Comparison.LESS_THAN == comparison ) {
			return " < ?";
		}
		if( Comparison.LESS_THAN_OR_EQUAL == comparison ) {
			return " <= ?";
		}
		if( Comparison.IS_NULL == comparison ) {
			return " IS NULL";
		}
		if( Comparison.IS_NOT_NULL == comparison ) {
			return " IS NOT NULL";
		}
		throw new Exception("Can not compute SQL expression for: "+comparison);
	}

	public List<ColumnData> getColumnData(
			TableSchema tableSchema
			) throws Exception {
		List<ColumnData> columnDataList = new ArrayList<ColumnData>(1);
		columnDataList.add( tableSchema.getColumnFromName(columnName) );
		return columnDataList;
	}

	public List<TypedValue> getQueryValues(
			TableSchema tableSchema
			,Variables variables
			) throws Exception {
		List<TypedValue> values = new Vector<TypedValue>();

		if( comparison.requiresValue() ) {
			String value = expression.getValue(variables);
			ColumnData columnData = tableSchema.getColumnFromName(columnName);
			values.add( new TypedValue(columnData.getColumnType(), value) );
		}
		
		return values;
	}

	public String getComparisonString() {
		return columnName+"|"+comparison.name();
	}

	public String toString() {
		return comparison.name()+"("+columnName+")"+expression;
	}
}
