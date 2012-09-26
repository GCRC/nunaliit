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
package ca.carleton.gcrc.jdbcJson;

public class Where {
	enum OpTypes {
		EQUAL("eq","=")
		,GE("ge",">=")
		,GT("gt",">")
		,LE("le","<=")
		,LT("lt","<")
		,NE("ne","<>")
		,IS("is","IS")
		,ISNOT("isnot","IS NOT")
		;
		
		private String httpParam;
		private String sqlQuery;
		private OpTypes(String httpParam, String sqlQuery) {
			this.httpParam = httpParam;
			this.sqlQuery = sqlQuery;
		}
		public String getHttpParam() {
			return httpParam;
		}
		public String getSqlQuery() {
			return sqlQuery;
		}
	};
	
	static public OpTypes opTypeFromHttpParam(String httpParam) {
		OpTypes op = null;
		OpTypes[] opTypes = OpTypes.values();
		for(int loop=0; loop<opTypes.length; ++loop) {
			if( opTypes[loop].httpParam.equalsIgnoreCase(httpParam) ) {
				op = opTypes[loop];
				break;
			}
		}
		return op;
	}
	
	private String left;
	private OpTypes op;
	private String stringValue = null;
	private int intValue;
	
	public Where(String left, OpTypes op, String right) {
		this.left = left;
		this.op = op;
		this.stringValue = right;
	}
	
	public Where(String left, OpTypes op, int right) {
		this.left = left;
		this.op = op;
		this.intValue = right;
	}
	
	public Where(String left, String httpParam, String right) throws Exception {
		OpTypes op = opTypeFromHttpParam(httpParam);
		if( null == op ) {
			throw new Exception("Invalid where operation type: "+httpParam);
		}
		this.left = left;
		this.op = op;
		this.stringValue = right;
	}
	
	public Where(String left, String httpParam, int right) throws Exception {
		OpTypes op = opTypeFromHttpParam(httpParam);
		if( null == op ) {
			throw new Exception("Invalid where operation type: "+httpParam);
		}
		this.left = left;
		this.op = op;
		this.intValue = right;
	}
	
	public String getLeft() {
		return left;
	}

	public OpTypes getOp() {
		return op;
	}

	public String getStringValue() {
		return stringValue;
	}

	public int getIntValue() {
		return intValue;
	}

}
