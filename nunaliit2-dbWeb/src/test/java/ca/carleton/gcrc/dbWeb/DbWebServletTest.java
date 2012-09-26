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

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import ca.carleton.gcrc.dbSec.FieldSelectorCentroid;
import ca.carleton.gcrc.dbSec.FieldSelectorScoreSubString;
import ca.carleton.gcrc.dbSec.RecordSelector;
import ca.carleton.gcrc.dbSec.Expression;
import ca.carleton.gcrc.dbSec.ExpressionConstant;
import ca.carleton.gcrc.dbSec.FieldSelector;
import ca.carleton.gcrc.dbSec.FieldSelectorColumn;
import ca.carleton.gcrc.dbSec.FieldSelectorFunction;
import ca.carleton.gcrc.dbSec.RecordSelectorComparison;

import junit.framework.TestCase;

public class DbWebServletTest extends TestCase {

	public void testParseQueriesJson() throws Exception {
		DbWebServlet servlet = new DbWebServlet();
		
		{
			List<Query> queries = servlet.parseQueriesJson("{" +
					"k1: { table:'t1',where:['eq(a)1'] }" +
					"}");
			if( 1 != queries.size() ) {
				fail("Expected: 1  Returned: "+queries.size());
			}
			if( false == ("k1".equals(queries.get(0).getQueryKey())) ) {
				fail("Expected: k1  Returned: "+queries.get(0).getQueryKey());
			}
		}
		
		{
			List<Query> queries = servlet.parseQueriesJson("{" +
					"l1: { table:'t1',where:['eq(a)1'] }" +
					",l2: { table:'t1',where:['eq(a)1'] }" +
					"}");
			if( 2 != queries.size() ) {
				fail("Expected: 2  Returned: "+queries.size());
			}
			Set<String> keys = new HashSet<String>();
			for(Query query : queries) {
				keys.add( query.getQueryKey() );
			}
			if( false == keys.contains("l1") ) {
				fail("Can not find key: l1");
			}
			if( false == keys.contains("l2") ) {
				fail("Can not find key: l2");
			}
		}
	}
	
	public void testTableName() throws Exception {
		DbWebServlet servlet = new DbWebServlet();

		{
			String key = "aKey";
			String table = "aTable";
			List<Query> queries = servlet.parseQueriesJson("{"+key+":{table:'"+table+"',where:['eq(a)1']}}");
			if( 1 != queries.size() ) {
				fail("Expected: 1  Returned: "+queries.size());
			}
			Query q = queries.get(0);
			if( false == (key.equals(q.getQueryKey())) ) {
				fail("Unexpected key: "+q.getQueryKey());
			}
			if( false == (table.equals(q.getTableName())) ) {
				fail("Unexpected table: "+q.getTableName());
			}
			if( null != q.getFieldSelectors() ) {
				fail("Expected null select specifiers");
			}
			if( null != q.getGroupByColumnNames() ) {
				fail("Expected null group by specifiers");
			}
		}
	}
	
	public void testWhereCount() throws Exception {
		DbWebServlet servlet = new DbWebServlet();

		{
			List<Query> queries = servlet.parseQueriesJson("{key:{table:'table',where:['eq(a)1']}}");
			if( 1 != queries.size() ) {
				fail("Expected: 1  Returned: "+queries.size());
			}
			Query q = queries.get(0);
			if( 1 != q.getWhereExpressions().size() ) {
				fail("Expected 1");
			}
		}

		{
			List<Query> queries = servlet.parseQueriesJson("{key:{table:'table',where:['eq(a)1','eq(b)1']}}");
			if( 1 != queries.size() ) {
				fail("Expected: 1  Returned: "+queries.size());
			}
			Query q = queries.get(0);
			if( 2 != q.getWhereExpressions().size() ) {
				fail("Expected 2");
			}
		}
	}
	
	public void testWhereColumn() throws Exception {
		DbWebServlet servlet = new DbWebServlet();

		{
			List<Query> queries = servlet.parseQueriesJson("{key:{table:'table',where:['eq(abcde)1']}}");
			if( 1 != queries.size() ) {
				fail("Expected: 1  Returned: "+queries.size());
			}
			Query q = queries.get(0);
			if( 1 != q.getWhereExpressions().size() ) {
				fail("Expected 1");
			}
			RecordSelector columnComparison = q.getWhereExpressions().get(0);
			
			if( false == (columnComparison instanceof RecordSelectorComparison) ) {
				fail("Unexpected selector class: "+columnComparison.getClass().getName());
			}
			RecordSelectorComparison rsComp = (RecordSelectorComparison)columnComparison;

			if( false == ("abcde".equals(rsComp.getColumnName())) ) {
				fail("Unexpected column name: "+rsComp.getColumnName());
			}
		}
	}
	
	public void testWhereEq() throws Exception {
		DbWebServlet servlet = new DbWebServlet();

		{
			List<Query> queries = servlet.parseQueriesJson("{key:{table:'table',where:['eq(a)25']}}");
			if( 1 != queries.size() ) {
				fail("Expected: 1  Returned: "+queries.size());
			}
			Query q = queries.get(0);
			if( 1 != q.getWhereExpressions().size() ) {
				fail("Expected 1");
			}
			RecordSelector columnComparison = q.getWhereExpressions().get(0);
			
			if( false == (columnComparison instanceof RecordSelectorComparison) ) {
				fail("Unexpected selector class: "+columnComparison.getClass().getName());
			}
			RecordSelectorComparison rsComp = (RecordSelectorComparison)columnComparison;

			if( RecordSelectorComparison.Comparison.EQUAL != rsComp.getComparison() ) {
				fail("Unexpected comparison: "+rsComp.getComparison());
			}
			Expression exp = rsComp.getExpression();
			if( false == (exp instanceof ExpressionConstant ) ) {
				fail("Unexpected expression: "+exp);
			}
			ExpressionConstant constant = (ExpressionConstant)exp;
			if( false == "25".equals(constant.getValue()) ) {
				fail("Unexpected constant: "+constant.getValue());
			}
		}
	}
	
	public void testWhereNe() throws Exception {
		DbWebServlet servlet = new DbWebServlet();

		{
			List<Query> queries = servlet.parseQueriesJson("{key:{table:'table',where:['ne(a)5']}}");
			if( 1 != queries.size() ) {
				fail("Expected: 1  Returned: "+queries.size());
			}
			Query q = queries.get(0);
			if( 1 != q.getWhereExpressions().size() ) {
				fail("Expected 1");
			}
			RecordSelector columnComparison = q.getWhereExpressions().get(0);
			
			if( false == (columnComparison instanceof RecordSelectorComparison) ) {
				fail("Unexpected selector class: "+columnComparison.getClass().getName());
			}
			RecordSelectorComparison rsComp = (RecordSelectorComparison)columnComparison;

			if( RecordSelectorComparison.Comparison.NOT_EQUAL != rsComp.getComparison() ) {
				fail("Unexpected comparison: "+rsComp.getComparison());
			}
			Expression exp = rsComp.getExpression();
			if( false == (exp instanceof ExpressionConstant ) ) {
				fail("Unexpected expression: "+exp);
			}
			ExpressionConstant constant = (ExpressionConstant)exp;
			if( false == "5".equals(constant.getValue()) ) {
				fail("Unexpected constant: "+constant.getValue());
			}
		}
	}
	
	public void testWhereGt() throws Exception {
		DbWebServlet servlet = new DbWebServlet();

		{
			List<Query> queries = servlet.parseQueriesJson("{key:{table:'table',where:['gt(a)5']}}");
			if( 1 != queries.size() ) {
				fail("Expected: 1  Returned: "+queries.size());
			}
			Query q = queries.get(0);
			if( 1 != q.getWhereExpressions().size() ) {
				fail("Expected 1");
			}
			RecordSelector columnComparison = q.getWhereExpressions().get(0);
			
			if( false == (columnComparison instanceof RecordSelectorComparison) ) {
				fail("Unexpected selector class: "+columnComparison.getClass().getName());
			}
			RecordSelectorComparison rsComp = (RecordSelectorComparison)columnComparison;

			if( RecordSelectorComparison.Comparison.GREATER_THAN != rsComp.getComparison() ) {
				fail("Unexpected comparison: "+rsComp.getComparison());
			}
			Expression exp = rsComp.getExpression();
			if( false == (exp instanceof ExpressionConstant ) ) {
				fail("Unexpected expression: "+exp);
			}
			ExpressionConstant constant = (ExpressionConstant)exp;
			if( false == "5".equals(constant.getValue()) ) {
				fail("Unexpected constant: "+constant.getValue());
			}
		}
	}
	
	public void testWhereGe() throws Exception {
		DbWebServlet servlet = new DbWebServlet();

		{
			List<Query> queries = servlet.parseQueriesJson("{key:{table:'table',where:['ge(a)5']}}");
			if( 1 != queries.size() ) {
				fail("Expected: 1  Returned: "+queries.size());
			}
			Query q = queries.get(0);
			if( 1 != q.getWhereExpressions().size() ) {
				fail("Expected 1");
			}
			RecordSelector columnComparison = q.getWhereExpressions().get(0);
			
			if( false == (columnComparison instanceof RecordSelectorComparison) ) {
				fail("Unexpected selector class: "+columnComparison.getClass().getName());
			}
			RecordSelectorComparison rsComp = (RecordSelectorComparison)columnComparison;

			if( RecordSelectorComparison.Comparison.GREATER_THAN_OR_EQUAL != rsComp.getComparison() ) {
				fail("Unexpected comparison: "+rsComp.getComparison());
			}
			Expression exp = rsComp.getExpression();
			if( false == (exp instanceof ExpressionConstant ) ) {
				fail("Unexpected expression: "+exp);
			}
			ExpressionConstant constant = (ExpressionConstant)exp;
			if( false == "5".equals(constant.getValue()) ) {
				fail("Unexpected constant: "+constant.getValue());
			}
		}
	}
	
	public void testWhereLt() throws Exception {
		DbWebServlet servlet = new DbWebServlet();

		{
			List<Query> queries = servlet.parseQueriesJson("{key:{table:'table',where:['lt(a)5']}}");
			if( 1 != queries.size() ) {
				fail("Expected: 1  Returned: "+queries.size());
			}
			Query q = queries.get(0);
			if( 1 != q.getWhereExpressions().size() ) {
				fail("Expected 1");
			}
			RecordSelector columnComparison = q.getWhereExpressions().get(0);
			
			if( false == (columnComparison instanceof RecordSelectorComparison) ) {
				fail("Unexpected selector class: "+columnComparison.getClass().getName());
			}
			RecordSelectorComparison rsComp = (RecordSelectorComparison)columnComparison;

			if( RecordSelectorComparison.Comparison.LESS_THAN != rsComp.getComparison() ) {
				fail("Unexpected comparison: "+rsComp.getComparison());
			}
			Expression exp = rsComp.getExpression();
			if( false == (exp instanceof ExpressionConstant ) ) {
				fail("Unexpected expression: "+exp);
			}
			ExpressionConstant constant = (ExpressionConstant)exp;
			if( false == "5".equals(constant.getValue()) ) {
				fail("Unexpected constant: "+constant.getValue());
			}
		}
	}
	
	public void testWhereLe() throws Exception {
		DbWebServlet servlet = new DbWebServlet();

		{
			List<Query> queries = servlet.parseQueriesJson("{key:{table:'table',where:['le(a)5']}}");
			if( 1 != queries.size() ) {
				fail("Expected: 1  Returned: "+queries.size());
			}
			Query q = queries.get(0);
			if( 1 != q.getWhereExpressions().size() ) {
				fail("Expected 1");
			}
			RecordSelector columnComparison = q.getWhereExpressions().get(0);
			
			if( false == (columnComparison instanceof RecordSelectorComparison) ) {
				fail("Unexpected selector class: "+columnComparison.getClass().getName());
			}
			RecordSelectorComparison rsComp = (RecordSelectorComparison)columnComparison;

			if( RecordSelectorComparison.Comparison.LESS_THAN_OR_EQUAL != rsComp.getComparison() ) {
				fail("Unexpected comparison: "+rsComp.getComparison());
			}
			Expression exp = rsComp.getExpression();
			if( false == (exp instanceof ExpressionConstant ) ) {
				fail("Unexpected expression: "+exp);
			}
			ExpressionConstant constant = (ExpressionConstant)exp;
			if( false == "5".equals(constant.getValue()) ) {
				fail("Unexpected constant: "+constant.getValue());
			}
		}
	}
	
	public void testWhereIsNull() throws Exception {
		DbWebServlet servlet = new DbWebServlet();

		{
			List<Query> queries = servlet.parseQueriesJson("{key:{table:'table',where:['null(a)']}}");
			if( 1 != queries.size() ) {
				fail("Expected: 1  Returned: "+queries.size());
			}
			Query q = queries.get(0);
			if( 1 != q.getWhereExpressions().size() ) {
				fail("Expected 1");
			}
			RecordSelector columnComparison = q.getWhereExpressions().get(0);
			
			if( false == (columnComparison instanceof RecordSelectorComparison) ) {
				fail("Unexpected selector class: "+columnComparison.getClass().getName());
			}
			RecordSelectorComparison rsComp = (RecordSelectorComparison)columnComparison;

			if( RecordSelectorComparison.Comparison.IS_NULL != rsComp.getComparison() ) {
				fail("Unexpected comparison: "+rsComp.getComparison());
			}
			Expression exp = rsComp.getExpression();
			if( null != exp ) {
				fail("Expected null expression: "+exp);
			}
		}
	}
	
	public void testWhereIsNotNull() throws Exception {
		DbWebServlet servlet = new DbWebServlet();

		{
			List<Query> queries = servlet.parseQueriesJson("{key:{table:'table',where:['notNull(a)']}}");
			if( 1 != queries.size() ) {
				fail("Expected: 1  Returned: "+queries.size());
			}
			Query q = queries.get(0);
			if( 1 != q.getWhereExpressions().size() ) {
				fail("Expected 1");
			}
			RecordSelector columnComparison = q.getWhereExpressions().get(0);
			
			if( false == (columnComparison instanceof RecordSelectorComparison) ) {
				fail("Unexpected selector class: "+columnComparison.getClass().getName());
			}
			RecordSelectorComparison rsComp = (RecordSelectorComparison)columnComparison;

			if( RecordSelectorComparison.Comparison.IS_NOT_NULL != rsComp.getComparison() ) {
				fail("Unexpected comparison: "+rsComp.getComparison());
			}
			Expression exp = rsComp.getExpression();
			if( null != exp ) {
				fail("Expected null expression: "+exp);
			}
		}
	}
	
	public void testSelectNull() throws Exception {
		DbWebServlet servlet = new DbWebServlet();

		{
			List<Query> queries = servlet.parseQueriesJson("{key:{table:'table',where:['notNull(a)']}}");
			if( 1 != queries.size() ) {
				fail("Expected: 1  Returned: "+queries.size());
			}
			Query q = queries.get(0);
			if( 1 != q.getWhereExpressions().size() ) {
				fail("Expected 1");
			}
			List<FieldSelector> selectSpecifiers = q.getFieldSelectors();
			if( null != selectSpecifiers ) {
				fail("Expected null select specifiers");
			}
		}
	}
	
	public void testSelectSingle() throws Exception {
		DbWebServlet servlet = new DbWebServlet();

		{
			List<Query> queries = servlet.parseQueriesJson("{key:{table:'table',select:['a'],where:['notNull(a)']}}");
			if( 1 != queries.size() ) {
				fail("Expected: 1  Returned: "+queries.size());
			}
			Query q = queries.get(0);
			if( 1 != q.getWhereExpressions().size() ) {
				fail("Expected 1");
			}
			List<FieldSelector> fieldSelectors = q.getFieldSelectors();
			if( 1 != fieldSelectors.size() ) {
				fail("Unexpected size: "+fieldSelectors.size());
			}
		}
	}
	
	public void testSelectMultiple() throws Exception {
		DbWebServlet servlet = new DbWebServlet();

		{
			List<Query> queries = servlet.parseQueriesJson("{key:{table:'table',select:['a','b'],where:['notNull(a)']}}");
			if( 1 != queries.size() ) {
				fail("Expected: 1  Returned: "+queries.size());
			}
			Query q = queries.get(0);
			if( 1 != q.getWhereExpressions().size() ) {
				fail("Expected 1");
			}
			List<FieldSelector> fieldSelectors = q.getFieldSelectors();
			if( 2 != fieldSelectors.size() ) {
				fail("Unexpected size: "+fieldSelectors.size());
			}
		}
	}
	
	public void testSelectColumn() throws Exception {
		DbWebServlet servlet = new DbWebServlet();

		{
			List<Query> queries = servlet.parseQueriesJson("{key:{table:'table',select:['a'],where:['notNull(a)']}}");
			if( 1 != queries.size() ) {
				fail("Expected: 1  Returned: "+queries.size());
			}
			Query q = queries.get(0);
			if( 1 != q.getWhereExpressions().size() ) {
				fail("Expected 1");
			}
			List<FieldSelector> fieldSelectors = q.getFieldSelectors();
			if( 1 != fieldSelectors.size() ) {
				fail("Unexpected size: "+fieldSelectors.size());
			}
			FieldSelector fieldSelector = fieldSelectors.get(0);
			if( false == (fieldSelector instanceof FieldSelectorColumn) ) {
				fail("Unexpected field selector class: "+fieldSelector.getClass().getName());
			}
			FieldSelectorColumn fieldSelectorColumn = (FieldSelectorColumn)fieldSelector;
			if( false == "a".equals(fieldSelectorColumn.getColumnName()) ) {
				fail("Unexpected column name: "+fieldSelectorColumn.getColumnName());
			}
		}
	}
	
	public void testSelectSum() throws Exception {
		DbWebServlet servlet = new DbWebServlet();

		{
			List<Query> queries = servlet.parseQueriesJson("{key:{table:'table',select:['sum(a)'],where:['notNull(a)']}}");
			if( 1 != queries.size() ) {
				fail("Expected: 1  Returned: "+queries.size());
			}
			Query q = queries.get(0);
			if( 1 != q.getWhereExpressions().size() ) {
				fail("Expected 1");
			}
			List<FieldSelector> fieldSelectors = q.getFieldSelectors();
			if( 1 != fieldSelectors.size() ) {
				fail("Unexpected size: "+fieldSelectors.size());
			}
			FieldSelector fieldSelector = fieldSelectors.get(0);
			if( false == (fieldSelector instanceof FieldSelectorFunction) ) {
				fail("Unexpected field selector class: "+fieldSelector.getClass().getName());
			}
			FieldSelectorFunction fieldSelectorFunction = (FieldSelectorFunction)fieldSelector;
			if( false == "a".equals(fieldSelectorFunction.getColumnName()) ) {
				fail("Unexpected column name: "+fieldSelectorFunction.getColumnName());
			}
			if( FieldSelectorFunction.Type.SUM != fieldSelectorFunction.getFunctionType() ) {
				fail("Unexpected function type: "+fieldSelectorFunction.getFunctionType());
			}
		}
	}
	
	public void testSelectMin() throws Exception {
		DbWebServlet servlet = new DbWebServlet();

		{
			List<Query> queries = servlet.parseQueriesJson("{key:{table:'table',select:['min(a)'],where:['notNull(a)']}}");
			if( 1 != queries.size() ) {
				fail("Expected: 1  Returned: "+queries.size());
			}
			Query q = queries.get(0);
			if( 1 != q.getWhereExpressions().size() ) {
				fail("Expected 1");
			}
			List<FieldSelector> fieldSelectors = q.getFieldSelectors();
			if( 1 != fieldSelectors.size() ) {
				fail("Unexpected size: "+fieldSelectors.size());
			}
			FieldSelector fieldSelector = fieldSelectors.get(0);
			if( false == (fieldSelector instanceof FieldSelectorFunction) ) {
				fail("Unexpected field selector class: "+fieldSelector.getClass().getName());
			}
			FieldSelectorFunction fieldSelectorFunction = (FieldSelectorFunction)fieldSelector;
			if( false == "a".equals(fieldSelectorFunction.getColumnName()) ) {
				fail("Unexpected column name: "+fieldSelectorFunction.getColumnName());
			}
			if( FieldSelectorFunction.Type.MIN != fieldSelectorFunction.getFunctionType() ) {
				fail("Unexpected function type: "+fieldSelectorFunction.getFunctionType());
			}
		}
	}
	
	public void testSelectMax() throws Exception {
		DbWebServlet servlet = new DbWebServlet();

		{
			List<Query> queries = servlet.parseQueriesJson("{key:{table:'table',select:['max(a)'],where:['notNull(a)']}}");
			if( 1 != queries.size() ) {
				fail("Expected: 1  Returned: "+queries.size());
			}
			Query q = queries.get(0);
			if( 1 != q.getWhereExpressions().size() ) {
				fail("Expected 1");
			}
			List<FieldSelector> fieldSelectors = q.getFieldSelectors();
			if( 1 != fieldSelectors.size() ) {
				fail("Unexpected size: "+fieldSelectors.size());
			}
			FieldSelector fieldSelector = fieldSelectors.get(0);
			if( false == (fieldSelector instanceof FieldSelectorFunction) ) {
				fail("Unexpected field selector class: "+fieldSelector.getClass().getName());
			}
			FieldSelectorFunction fieldSelectorFunction = (FieldSelectorFunction)fieldSelector;
			if( false == "a".equals(fieldSelectorFunction.getColumnName()) ) {
				fail("Unexpected column name: "+fieldSelectorFunction.getColumnName());
			}
			if( FieldSelectorFunction.Type.MAX != fieldSelectorFunction.getFunctionType() ) {
				fail("Unexpected function type: "+fieldSelectorFunction.getFunctionType());
			}
		}
	}
	
	public void testSelectCentroidX() throws Exception {
		DbWebServlet servlet = new DbWebServlet();

		{
			List<Query> queries = servlet.parseQueriesJson("{key:{table:'table',select:['centroid(x,a)']}}");
			if( 1 != queries.size() ) {
				fail("Expected: 1  Returned: "+queries.size());
			}
			Query q = queries.get(0);
			List<FieldSelector> fieldSelectors = q.getFieldSelectors();
			if( 1 != fieldSelectors.size() ) {
				fail("Unexpected size: "+fieldSelectors.size());
			}
			FieldSelector fieldSelector = fieldSelectors.get(0);
			if( false == (fieldSelector instanceof FieldSelectorCentroid) ) {
				fail("Unexpected field selector class: "+fieldSelector.getClass().getName());
			}
			FieldSelectorCentroid fieldSelectorCentroid = (FieldSelectorCentroid)fieldSelector;
			if( false == "a".equals(fieldSelectorCentroid.getFieldName()) ) {
				fail("Unexpected column name: "+fieldSelectorCentroid.getFieldName());
			}
			if( FieldSelectorCentroid.Type.X != fieldSelectorCentroid.getType() ) {
				fail("Unexpected function type: "+fieldSelectorCentroid.getType());
			}
		}
	}
	
	public void testSelectCentroidY() throws Exception {
		DbWebServlet servlet = new DbWebServlet();

		{
			List<Query> queries = servlet.parseQueriesJson("{key:{table:'table',select:['centroid(y,a)']}}");
			if( 1 != queries.size() ) {
				fail("Expected: 1  Returned: "+queries.size());
			}
			Query q = queries.get(0);
			List<FieldSelector> fieldSelectors = q.getFieldSelectors();
			if( 1 != fieldSelectors.size() ) {
				fail("Unexpected size: "+fieldSelectors.size());
			}
			FieldSelector fieldSelector = fieldSelectors.get(0);
			if( false == (fieldSelector instanceof FieldSelectorCentroid) ) {
				fail("Unexpected field selector class: "+fieldSelector.getClass().getName());
			}
			FieldSelectorCentroid fieldSelectorCentroid = (FieldSelectorCentroid)fieldSelector;
			if( false == "a".equals(fieldSelectorCentroid.getFieldName()) ) {
				fail("Unexpected column name: "+fieldSelectorCentroid.getFieldName());
			}
			if( FieldSelectorCentroid.Type.Y != fieldSelectorCentroid.getType() ) {
				fail("Unexpected function type: "+fieldSelectorCentroid.getType());
			}
		}
	}
	
	public void testSelectScoreSingle() throws Exception {
		DbWebServlet servlet = new DbWebServlet();

		{
			List<Query> queries = servlet.parseQueriesJson("{key:{table:'table',select:['score(a)value']}}");
			if( 1 != queries.size() ) {
				fail("Expected: 1  Returned: "+queries.size());
			}
			Query q = queries.get(0);
			List<FieldSelector> fieldSelectors = q.getFieldSelectors();
			if( 1 != fieldSelectors.size() ) {
				fail("Unexpected size: "+fieldSelectors.size());
			}
			FieldSelector fieldSelector = fieldSelectors.get(0);
			if( false == (fieldSelector instanceof FieldSelectorScoreSubString) ) {
				fail("Unexpected field selector class: "+fieldSelector.getClass().getName());
			}
			FieldSelectorScoreSubString fieldSelectorScore = (FieldSelectorScoreSubString)fieldSelector;
			if( false == "value".equals(fieldSelectorScore.getSearchedString()) ) {
				fail("Unexpected search value: "+fieldSelectorScore.getSearchedString());
			}
			Set<String> fieldNames = new HashSet<String>( fieldSelectorScore.getFieldNames() );
			if( 1 != fieldNames.size() ) {
				fail("Unexpected number of field names: "+fieldNames.size());
			}
			if( false == fieldNames.contains("a") ) {
				fail("Can not find field name: a");
			}
		}
	}
	
	public void testSelectScoreMulti() throws Exception {
		DbWebServlet servlet = new DbWebServlet();

		{
			List<Query> queries = servlet.parseQueriesJson("{key:{table:'table',select:['score(a,b)value']}}");
			if( 1 != queries.size() ) {
				fail("Expected: 1  Returned: "+queries.size());
			}
			Query q = queries.get(0);
			List<FieldSelector> fieldSelectors = q.getFieldSelectors();
			if( 1 != fieldSelectors.size() ) {
				fail("Unexpected size: "+fieldSelectors.size());
			}
			FieldSelector fieldSelector = fieldSelectors.get(0);
			if( false == (fieldSelector instanceof FieldSelectorScoreSubString) ) {
				fail("Unexpected field selector class: "+fieldSelector.getClass().getName());
			}
			FieldSelectorScoreSubString fieldSelectorScore = (FieldSelectorScoreSubString)fieldSelector;
			if( false == "value".equals(fieldSelectorScore.getSearchedString()) ) {
				fail("Unexpected search value: "+fieldSelectorScore.getSearchedString());
			}
			Set<String> fieldNames = new HashSet<String>( fieldSelectorScore.getFieldNames() );
			if( 2 != fieldNames.size() ) {
				fail("Unexpected number of field names: "+fieldNames.size());
			}
			if( false == fieldNames.contains("a") ) {
				fail("Can not find field name: a");
			}
			if( false == fieldNames.contains("b") ) {
				fail("Can not find field name: b");
			}
		}
	}
}
