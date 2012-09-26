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
package ca.carleton.gcrc.AdhocQueriesImpl;

import ca.carleton.gcrc.AdhocQueries.AdhocQuerySpec;

public class AdhocQuerySpecImpl implements AdhocQuerySpec {
	private String queryString = null;
	private int id = -1;
	private String label;
	private int expectedArgCount = -1;
	
	public AdhocQuerySpecImpl(
			int id
			,String label
			,String q
			) {
		this.queryString = q;
		this.id = id;
		this.label = label;
		
		int argCount = 0;
		int found = -1;

		do {
			found = q.indexOf("?", found);
			if (found > 0) {
				argCount++;
				found++;
			}
		} while (found != -1);
		
		expectedArgCount = argCount;
	}

	public String getQueryString() {
		return queryString;
	}
	
	public int getExpectedArgCount() {
		return expectedArgCount;
	}
	
	public int getId() {
		return id;
	}
	
	public String getLabel() {
		return label;
	}
}
