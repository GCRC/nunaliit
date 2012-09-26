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
package ca.carleton.gcrc.AdhocQueries;

import ca.carleton.gcrc.dbSec.ColumnData;
import ca.carleton.gcrc.dbSec.impl.ColumnDataUtils;

import java.sql.Connection;
import java.sql.PreparedStatement;

import org.json.JSONArray;
import org.json.JSONObject;

import org.apache.log4j.Logger;

public class AdhocQueries {
	final private Logger logger = Logger.getLogger(this.getClass());
	
	private Connection connection;
	
	public AdhocQueries(Connection c) {
		connection = c;
	}
	
	public JSONObject performAdhocQueryWithArgs(String sqlStatement, String args, int argsExpected) throws Exception {
		logger.info("Executing adhoc query: " + sqlStatement + " for arguments: " + args);
		
		String[] splitArgs = args.split(",");
		if (argsExpected == 0 &&
				(splitArgs.length > 1 ||
						(splitArgs.length == 1 && splitArgs[0] != ""))) {
			// we want 0 args but even an empty string shows as a split of 1 with the empty string
			throw new Exception("Expected NO arguments but received at least one non-empty arg.");
		} else if (argsExpected == 1 && splitArgs.length == 1 && splitArgs[0] == "") {
			// null args list shows up as length 1 so below (default) test won't catch that
			throw new Exception("Expected one arg but received empty string.");
		} else if (argsExpected >= 1 && splitArgs.length != argsExpected) {
			throw new Exception("Expected " + argsExpected + " args but got " + splitArgs.length);
		}
		
		PreparedStatement stmt = connection.prepareStatement(sqlStatement);
		
		int index = 1;
		for (int loop=0; loop<argsExpected; loop++) {
			ColumnDataUtils.writeToPreparedStatement(stmt, index, splitArgs[loop], ColumnData.Type.INTEGER); // always integer arg for now
			++index;
		}

		JSONArray array = ColumnDataUtils.executeStatementToJson(stmt);

		JSONObject result = new JSONObject();
		result.put("results", array);

		return result;
	}

}
