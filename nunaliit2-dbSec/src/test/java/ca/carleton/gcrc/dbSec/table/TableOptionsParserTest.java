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
package ca.carleton.gcrc.dbSec.table;

import java.util.List;

import ca.carleton.gcrc.dbSec.RecordSelector;
import ca.carleton.gcrc.dbSec.Expression;
import ca.carleton.gcrc.dbSec.ExpressionConstant;
import ca.carleton.gcrc.dbSec.RecordSelectorComparison;
import ca.carleton.gcrc.dbSec.impl.TableSchemaImpl;
import junit.framework.TestCase;

public class TableOptionsParserTest extends TestCase {

	public void testParseTableOptionsTrue() throws Exception {
		TableSchemaImpl tableSchema = new TableSchemaImpl();
		TableOptionsParser.parseTableOptions("query:true,insert:true,update:true,delete:true", tableSchema);
		
		if( false == tableSchema.getQueryAccess().isAllowed() ) {
			fail("Error parsing on query");
		}
		if( false == tableSchema.getInsertAccess().isAllowed() ) {
			fail("Error parsing on insert");
		}
		if( false == tableSchema.getUpdateAccess().isAllowed() ) {
			fail("Error parsing on update");
		}
		if( false == tableSchema.getDeleteAccess().isAllowed() ) {
			fail("Error parsing on delete");
		}
	}

	public void testParseTableOptionsFalse() throws Exception {
		TableSchemaImpl tableSchema = new TableSchemaImpl();
		TableOptionsParser.parseTableOptions("query:false,insert:false,update:false,delete:false", tableSchema);
		
		if( true == tableSchema.getQueryAccess().isAllowed() ) {
			fail("Error parsing on query");
		}
		if( true == tableSchema.getInsertAccess().isAllowed() ) {
			fail("Error parsing on insert");
		}
		if( true == tableSchema.getUpdateAccess().isAllowed() ) {
			fail("Error parsing on update");
		}
		if( true == tableSchema.getDeleteAccess().isAllowed() ) {
			fail("Error parsing on delete");
		}
	}

	public void testParseTableOptionsDefault() throws Exception {
		TableSchemaImpl tableSchema = new TableSchemaImpl();
		TableOptionsParser.parseTableOptions("", tableSchema);
		
		if( true == tableSchema.getQueryAccess().isAllowed() ) {
			fail("Error parsing on query");
		}
		if( true == tableSchema.getInsertAccess().isAllowed() ) {
			fail("Error parsing on insert");
		}
		if( true == tableSchema.getUpdateAccess().isAllowed() ) {
			fail("Error parsing on update");
		}
		if( true == tableSchema.getDeleteAccess().isAllowed() ) {
			fail("Error parsing on delete");
		}
	}

	public void testParseTableOptionsSelectEmpty() throws Exception {
		TableSchemaImpl tableSchema = new TableSchemaImpl();
		TableOptionsParser.parseTableOptions("query:[]", tableSchema);
		
		if( true == tableSchema.getQueryAccess().isAllowed() ) {
			fail("Error parsing on query");
		}
	}

	public void testParseTableOptionsSelectSingle() throws Exception {
		TableSchemaImpl tableSchema = new TableSchemaImpl();
		TableOptionsParser.parseTableOptions("query:[{column:'allo',comparison:'EQUAL',value:2}]", tableSchema);
		
		if( false == tableSchema.getQueryAccess().isAllowed() ) {
			fail("Error parsing on query allowed flag");
		} else {
			List<RecordSelector> whereClauses = tableSchema.getQueryAccess().getWhereClauses();
			if( null == whereClauses ) {
				fail("Partial access returned a null 'where clauses' list");
			} else if( 1 != whereClauses.size() ) {
				fail("Partial access returned a 'where clauses' list with unexpected size: "+whereClauses.size());
			} else {
				RecordSelector whereClause = whereClauses.get(0);
				
				if( false == (whereClause instanceof RecordSelectorComparison) ) {
					fail("Unexpected selector class: "+whereClause.getClass().getName());
				}
				RecordSelectorComparison rsComp = (RecordSelectorComparison)whereClause;
				
				if( false == "allo".equals(rsComp.getColumnName()) ) {
					fail("Unexpected column name: "+rsComp.getColumnName());
				}
				if( RecordSelectorComparison.Comparison.EQUAL != rsComp.getComparison() ) {
					fail("Unexpected comparison: "+rsComp.getComparison().name());
				}
				Expression expression = rsComp.getExpression();
				if( expression instanceof ExpressionConstant ) {
					ExpressionConstant expressionConstant = (ExpressionConstant)expression;
					if( false == "2".equals(expressionConstant.getValue()) ) {
						fail("Unexpected value: "+expressionConstant.getValue());
					}
				} else {
					fail("Unexpected expression type: "+expression.getClass().getName());
				}
			}
		}
	}

	public void testParseTableOptionsSelectMultiple() throws Exception {
		TableSchemaImpl tableSchema = new TableSchemaImpl();
		TableOptionsParser.parseTableOptions("query:[{column:'allo',comparison:'GREATER_THAN',value:2},{column:'allo',comparison:'LESS_THAN',value:5}]", tableSchema);
		
		if( false == tableSchema.getQueryAccess().isAllowed() ) {
			fail("Error parsing on query allowed flag");
		} else {
			List<RecordSelector> whereClauses = tableSchema.getQueryAccess().getWhereClauses();
			if( null == whereClauses ) {
				fail("Partial access returned a null 'where clauses' list");
			} else if( 2 != whereClauses.size() ) {
				fail("Partial access returned a 'where clauses' list with unexpected size: "+whereClauses.size());
			} else {
				{
					RecordSelector whereClause = whereClauses.get(0);
					
					if( false == (whereClause instanceof RecordSelectorComparison) ) {
						fail("Unexpected selector class: "+whereClause.getClass().getName());
					}
					RecordSelectorComparison rsComp = (RecordSelectorComparison)whereClause;
					
					if( false == "allo".equals(rsComp.getColumnName()) ) {
						fail("Unexpected column name: "+rsComp.getColumnName());
					}
					if( RecordSelectorComparison.Comparison.GREATER_THAN != rsComp.getComparison() ) {
						fail("Unexpected comparison: "+rsComp.getComparison().name());
					}
					Expression expression = rsComp.getExpression();
					if( expression instanceof ExpressionConstant ) {
						ExpressionConstant expressionConstant = (ExpressionConstant)expression;
						if( false == "2".equals(expressionConstant.getValue()) ) {
							fail("Unexpected value: "+expressionConstant.getValue());
						}
					} else {
						fail("Unexpected expression type: "+expression.getClass().getName());
					}
				}
				{
					RecordSelector whereClause = whereClauses.get(1);
					
					if( false == (whereClause instanceof RecordSelectorComparison) ) {
						fail("Unexpected selector class: "+whereClause.getClass().getName());
					}
					RecordSelectorComparison rsComp = (RecordSelectorComparison)whereClause;
					
					if( false == "allo".equals(rsComp.getColumnName()) ) {
						fail("Unexpected column name: "+rsComp.getColumnName());
					}
					if( RecordSelectorComparison.Comparison.LESS_THAN != rsComp.getComparison() ) {
						fail("Unexpected comparison: "+rsComp.getComparison().name());
					}
					Expression expression = rsComp.getExpression();
					if( expression instanceof ExpressionConstant ) {
						ExpressionConstant expressionConstant = (ExpressionConstant)expression;
						if( false == "5".equals(expressionConstant.getValue()) ) {
							fail("Unexpected value: "+expressionConstant.getValue());
						}
					} else {
						fail("Unexpected expression type: "+expression.getClass().getName());
					}
				}
			}
		}
	}

	public void testParseTableOptionsSelectQuery() throws Exception {
		TableSchemaImpl tableSchema = new TableSchemaImpl();
		TableOptionsParser.parseTableOptions("query:[{column:'allo',comparison:'EQUAL',value:2}]", tableSchema);
		
		if( false == tableSchema.getQueryAccess().isAllowed() ) {
			fail("Unexpected access");
		}
	}

	public void testParseTableOptionsSelectInsert() throws Exception {
		TableSchemaImpl tableSchema = new TableSchemaImpl();
		
		try {
			TableOptionsParser.parseTableOptions("insert:[{column:'allo',comparison:'EQUAL',value:2}]", tableSchema);
			
			fail("Selection on insert must produce an error");
		} catch(Exception e) {
			// OK
		}
	}

	public void testParseTableOptionsSelectUpdate() throws Exception {
		TableSchemaImpl tableSchema = new TableSchemaImpl();
		TableOptionsParser.parseTableOptions("update:[{column:'allo',comparison:'EQUAL',value:2}]", tableSchema);
		
		if( false == tableSchema.getUpdateAccess().isAllowed() ) {
			fail("Unexpected access");
		}
	}

	public void testParseTableOptionsSelectDelete() throws Exception {
		TableSchemaImpl tableSchema = new TableSchemaImpl();
		TableOptionsParser.parseTableOptions("delete:[{column:'allo',comparison:'EQUAL',value:2}]", tableSchema);
		
		if( false == tableSchema.getDeleteAccess().isAllowed() ) {
			fail("Unexpected access");
		}
	}
}
