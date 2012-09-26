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
import java.util.List;

import ca.carleton.gcrc.dbSec.impl.TypedValue;

public class FieldSelectorCentroid implements FieldSelector {
	
	public enum Type {
		X
		,Y
		;
	}

	String fieldName = null;
	Type type = null;
	
	public FieldSelectorCentroid(String fieldName, Type type) {
		this.fieldName = fieldName;
		this.type = type;
	}

	public String getFieldName() {
		return fieldName;
	}

	public Type getType() {
		return type;
	}

	public List<ColumnData> getColumnData(
			TableSchema tableSchema
			) throws Exception {
		List<ColumnData> columnDataList = new ArrayList<ColumnData>(1);
		
		columnDataList.add( tableSchema.getColumnFromName(fieldName) );
		
		return columnDataList;
	}
	
	/*
		ST_X(ST_Centroid(coalesce(ST_GeometryN(the_geom,1),the_geom)))
		ST_Y(ST_Centroid(coalesce(ST_GeometryN(the_geom,1),the_geom)))
		
		ST_GeometryN - Return the 1-based Nth geometry if the geometry is a 
		               GEOMETRYCOLLECTION, MULTIPOINT, MULTILINESTRING, MULTICURVE or 
		               MULTIPOLYGON. Otherwise, return NULL.
		ST_Centroid  - Returns the geometric center of a geometry
		coalesce     - The COALESCE function returns the first of its arguments that 
		               is not null. Null is returned only if all arguments are null.

		ST_X(
			ST_Centroid(
				coalesce(
					ST_GeometryN(
						the_geom
						,1
					)
					,the_geom
				)
			)
		)
	 */
	public String getQueryString(TableSchema tableSchema, Phase phase) throws Exception {
		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);
		
		if( Type.X == type ) {
			pw.print("ST_X");
		} else if( Type.Y == type ) {
			pw.print("ST_Y");
		} else {
			throw new Exception("Can not handle type: "+type);
		}

		pw.print("(ST_Centroid(coalesce(ST_GeometryN(");
		pw.print(fieldName);
		pw.print(",1),");
		pw.print(fieldName);
		pw.print(")))");

		if( Phase.SELECT == phase ) {
			if( Type.X == type ) {
				pw.print(" AS x");
			} else if( Type.Y == type ) {
				pw.print(" AS y");
			} else {
				throw new Exception("Can not handle type: "+type);
			}
		}

		pw.flush();
		return sw.toString();
	}


	public List<TypedValue> getQueryValues(
			TableSchema tableSchema
			,Variables variables
			) throws Exception {
		return new ArrayList<TypedValue>();
	}

	public String toString() {
		return "_centroid("+type+","+fieldName+")";
	}
}
