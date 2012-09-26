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

import ca.carleton.gcrc.dbSec.RecordSelector;
import ca.carleton.gcrc.dbSec.Expression;
import ca.carleton.gcrc.dbSec.ExpressionConstant;
import ca.carleton.gcrc.dbSec.RecordSelectorComparison;
import junit.framework.TestCase;

public class ColumnOptionsParserTest extends TestCase {

	public void testOnInsertAssignValue() throws Exception {
		ColumnDataImpl columnData = new ColumnDataImpl();
		ColumnOptionsParser.parseColumnOptions("onInsert:{assignValue:'allo'}", columnData);
		
		String assignValue = columnData.getAssignValueOnInsert();
		if( null == assignValue ) {
			fail("Assign value returned null");
		} else if( false == "allo".equals(assignValue) ) {
			fail("Unexpected assign value returned: "+assignValue);
		}
	}

	public void testOnInsertAssignValueInt() throws Exception {
		ColumnDataImpl columnData = new ColumnDataImpl();
		ColumnOptionsParser.parseColumnOptions("onInsert:{assignValue:1}", columnData);
		
		String assignValue = columnData.getAssignValueOnInsert();
		if( null == assignValue ) {
			fail("Assign value returned null");
		} else if( false == "1".equals(assignValue) ) {
			fail("Unexpected assign value returned: "+assignValue);
		}
	}

	public void testOnInsertAssignValueDoubleQuotes() throws Exception {
		ColumnDataImpl columnData = new ColumnDataImpl();
		ColumnOptionsParser.parseColumnOptions("onInsert:{assignValue:\"allo\"}", columnData);
		
		String assignValue = columnData.getAssignValueOnInsert();
		if( null == assignValue ) {
			fail("Assign value returned null");
		} else if( false == "allo".equals(assignValue) ) {
			fail("Unexpected assign value returned: "+assignValue);
		}
	}

	public void testOnInsertAssignVariable() throws Exception {
		ColumnDataImpl columnData = new ColumnDataImpl();
		ColumnOptionsParser.parseColumnOptions("onInsert:{assignVariable:'user.id'}", columnData);
		
		String assignedVariable = columnData.getAssignVariableOnInsert();
		if( null == assignedVariable ) {
			fail("Assign value returned null");
		} else if( false == "user.id".equals(assignedVariable) ) {
			fail("Unexpected assign value returned: "+assignedVariable);
		}
	}

	public void testOnInsertIncrementInteger() throws Exception {
		ColumnDataImpl columnData = new ColumnDataImpl();
		ColumnOptionsParser.parseColumnOptions("onInsert:{incrementInteger:'sequence'}", columnData);
		
		if( false == columnData.isAutoIncrementInteger() ) {
			fail("Auto increment is not set");
		} else {
			String sequence = columnData.getAutoIncrementSequence();
			if( null == sequence ) {
				fail("Auto increment sequence returned null");
			} else if( false == "sequence".equals(sequence) ) {
				fail("Unexpected auto increment sequence returned: "+sequence);
			}
		}
	}

	public void testWhereEqual() throws Exception {
		ColumnDataImpl columnData = new ColumnDataImpl();
		ColumnOptionsParser.parseColumnOptions("where:[{comparison:'EQUAL',value:'allo'}]", columnData);

		List<RecordSelector> whereClauses = columnData.getRowSelectors();
		if( null == whereClauses ) {
			fail("Null where clauses");
		} else if( 1 != whereClauses.size() ) {
			fail("Unexpected size for where clauses: "+whereClauses.size());
		} else {
			RecordSelector whereClause = whereClauses.get(0);
			
			if( false == (whereClause instanceof RecordSelectorComparison) ) {
				fail("Unexpected selector class: "+whereClause.getClass().getName());
			}
			RecordSelectorComparison rsComp = (RecordSelectorComparison)whereClause;
			
			if( RecordSelectorComparison.Comparison.EQUAL != rsComp.getComparison() ) {
				fail("Unexpected comparison: "+rsComp.getComparison().name());
			}
			Expression expression = rsComp.getExpression();
			if( expression instanceof ExpressionConstant ) {
				ExpressionConstant expressionConstant = (ExpressionConstant)expression;
				if( false == "allo".equals(expressionConstant.getValue()) ) {
					fail("Unexpected value: "+expressionConstant.getValue());
				}
			} else {
				fail("Unexpected expression type: "+expression.getClass().getName());
			}
		}
	}

	public void testWhereEqualInt() throws Exception {
		ColumnDataImpl columnData = new ColumnDataImpl();
		ColumnOptionsParser.parseColumnOptions("where:[{comparison:'EQUAL',value:1}]", columnData);

		List<RecordSelector> whereClauses = columnData.getRowSelectors();
		if( null == whereClauses ) {
			fail("Null where clauses");
		} else if( 1 != whereClauses.size() ) {
			fail("Unexpected size for where clauses: "+whereClauses.size());
		} else {
			RecordSelector whereClause = whereClauses.get(0);
			
			if( false == (whereClause instanceof RecordSelectorComparison) ) {
				fail("Unexpected selector class: "+whereClause.getClass().getName());
			}
			RecordSelectorComparison rsComp = (RecordSelectorComparison)whereClause;
			
			if( RecordSelectorComparison.Comparison.EQUAL != rsComp.getComparison() ) {
				fail("Unexpected comparison: "+rsComp.getComparison().name());
			}
			Expression expression = rsComp.getExpression();
			if( expression instanceof ExpressionConstant ) {
				ExpressionConstant expressionConstant = (ExpressionConstant)expression;
				if( false == "1".equals(expressionConstant.getValue()) ) {
					fail("Unexpected value: "+expressionConstant.getValue());
				}
			} else {
				fail("Unexpected expression type: "+expression.getClass().getName());
			}
		}
	}

	public void testWhereNull() throws Exception {
		ColumnDataImpl columnData = new ColumnDataImpl();
		ColumnOptionsParser.parseColumnOptions("where:[{comparison:'IS_NULL'}]", columnData);

		List<RecordSelector> whereClauses = columnData.getRowSelectors();
		if( null == whereClauses ) {
			fail("Null where clauses");
		} else if( 1 != whereClauses.size() ) {
			fail("Unexpected size for where clauses: "+whereClauses.size());
		} else {
			RecordSelector whereClause = whereClauses.get(0);
			
			if( false == (whereClause instanceof RecordSelectorComparison) ) {
				fail("Unexpected selector class: "+whereClause.getClass().getName());
			}
			RecordSelectorComparison rsComp = (RecordSelectorComparison)whereClause;
			
			if( RecordSelectorComparison.Comparison.IS_NULL != rsComp.getComparison() ) {
				fail("Unexpected comparison: "+rsComp.getComparison().name());
			}
			if( null != rsComp.getExpression() ) {
				fail("Unexpected value: "+rsComp.getExpression());
			}
		}
	}

	public void testMultiple() throws Exception {
		ColumnDataImpl columnData = new ColumnDataImpl();
		ColumnOptionsParser.parseColumnOptions("onInsert:{assignValue:'allo'},where:[{comparison:'EQUAL',value:'allo'}]", columnData);
		
		String assignValue = columnData.getAssignValueOnInsert();
		if( null == assignValue ) {
			fail("Assign value returned null");
		}
		
		List<RecordSelector> whereClauses = columnData.getRowSelectors();
		if( null == whereClauses ) {
			fail("Null where clauses");
		} else if( 1 != whereClauses.size() ) {
			fail("Unexpected size for where clauses: "+whereClauses.size());
		}		
	}

	
}
