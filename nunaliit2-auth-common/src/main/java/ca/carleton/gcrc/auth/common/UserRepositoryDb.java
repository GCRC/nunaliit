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
package ca.carleton.gcrc.auth.common;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.util.Vector;

import javax.servlet.ServletContext;
import javax.servlet.ServletException;

import ca.carleton.gcrc.auth.common.impl.UserAndPassword;
import ca.carleton.gcrc.auth.common.impl.UserImpl;
import ca.carleton.gcrc.auth.common.impl.UserRepositoryAbstract;
import ca.carleton.gcrc.jdbc.JdbcConnections;
import ca.carleton.gcrc.jdbc.JdbcUtils;

public class UserRepositoryDb extends UserRepositoryAbstract implements UserRepository {
	
	static private String sqlQueryColumns = "id,email,name,password,group_id";

	private JdbcConnections connections = null;
	private Connection connection = null;
	
	public UserRepositoryDb(ServletContext servletContext) throws ServletException {
		connections = JdbcConnections.connectionsFromServletContext(servletContext);
		try {
			connection = connections.getDb();
		} catch (Exception e) {
			throw new ServletException("Unable to get default DB from connections",e);
		}
	}

	public UserRepositoryDb(Connection connection) {
		this.connection = connection;
	}

	public void destroy() {
		if( null != connections ) {
			connections.closeAllConnections();
		}
	}

	public User getDefaultUser() throws Exception {
		return new UserImpl();
	}
	
	public User authenticate(String username, String password) throws Exception {

		String sqlQuery = "SELECT "+sqlQueryColumns+" FROM users WHERE email=?;";
		
		UserAndPassword userAndPassword = null;
		try {
			PreparedStatement preparedStmt = connection.prepareStatement(sqlQuery);
			preparedStmt.setString(1, username);

			userAndPassword = executeStatementToUser(preparedStmt);
		} catch (Exception sqle) {
			throw new Exception("SQL query failed - query: "+sqlQuery,sqle);
		}

		// Check password
		String dbPassword = userAndPassword.getPassword();
		if( null != dbPassword && false == dbPassword.equals(password) ) {
			throw new Exception("Password mismatch");
		}
		
		return userAndPassword;
	}

	public User userFromId(int id) throws Exception {

		String sqlQuery = "SELECT "+sqlQueryColumns+" FROM users WHERE id=?;";
		
		try {
			PreparedStatement preparedStmt = connection.prepareStatement(sqlQuery);
			preparedStmt.setInt(1, id);

			User user = executeStatementToUser(preparedStmt);
			return user;
				
		} catch (Exception sqle) {
			throw new ServletException("SQL query failed - query: "+sqlQuery+" id="+id,sqle);
		}
	}

	/**
	 * This method executes a prepared SQL statement against the user table 
	 * and returns a User.
	 * @param stmt Prepared SQL statement to execute
	 * @return An instance of User based on the information found in the database
	 * @throws Exception
	 */
	private UserAndPassword executeStatementToUser(PreparedStatement preparedStmt) throws Exception {
		if( preparedStmt.execute() ) {
			// There's a ResultSet to be had
			ResultSet rs = preparedStmt.getResultSet();
			ResultSetMetaData rsmd = rs.getMetaData();

			int numColumns = rsmd.getColumnCount();
			if( numColumns != 5 ) {
				throw new Exception("Unexpected number of columns returned");
			}
			
			if( false == rs.next() ) {
				throw new Exception("Result set empty");
			}

			int userId = JdbcUtils.extractIntResult(rs,rsmd,1);
			String email = JdbcUtils.extractStringResult(rs,rsmd,2);
			String displayName = JdbcUtils.extractStringResult(rs,rsmd,3);
			String dbPassword = JdbcUtils.extractStringResult(rs,rsmd,4);
			int groupId = JdbcUtils.extractIntResult(rs,rsmd,5);

			if( true == rs.next() ) {
				throw new Exception("Result set had more than one result");
			}
			
			// Return user
			UserAndPassword user = new UserAndPassword();
			user.setId(userId);
			user.setUser(email);
			user.setDisplayName(displayName);
			user.setPassword(dbPassword);
			if( 0 == groupId ) {
				user.setAnonymous(true);
			} else if( 1 == groupId ) {
				user.setAdmin(true);
			}
			Vector<Integer> groups = new Vector<Integer>();
			groups.add(groupId);
			user.setGroups(groups);
			return user;
			
		} else {
			// indicates an update count or no results - this must be no results
			throw new Exception("Query returned no results");
		}
	}
}
