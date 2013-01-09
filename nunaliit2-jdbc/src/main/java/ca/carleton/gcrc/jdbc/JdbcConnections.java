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
package ca.carleton.gcrc.jdbc;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Properties;

import javax.servlet.ServletContext;
import javax.servlet.ServletException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class JdbcConnections {

	final static public String JDBC_SERVLET_ATTRIB_NAME = "JdbcConnections";
	final static public String PROPERTIES_SERVLET_ATTRIB_NAME = "JdbcConfigProperties";
	
	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	
	static public JdbcConnections connectionsFromServletContext(ServletContext servletContext) throws ServletException {
		Object jdbcConnectionsObj = servletContext.getAttribute(JDBC_SERVLET_ATTRIB_NAME);
		if( null != jdbcConnectionsObj
		 && jdbcConnectionsObj instanceof JdbcConnections ) {
			return (JdbcConnections)jdbcConnectionsObj;
		}
		synchronized(servletContext) {
			JdbcConnections connections = new JdbcConnections(servletContext);
			servletContext.setAttribute(JDBC_SERVLET_ATTRIB_NAME, connections);
			return connections;
		}
	}
	
	private Map<String,ConnectionInfo> nameToInfo = new HashMap<String,ConnectionInfo>();
	private Map<String,Connection> nameToConnection = new HashMap<String,Connection>();

	public JdbcConnections(ServletContext servletContext) throws ServletException {
		
		// Load up configuration information from servlet context
		Properties props = new Properties();
		{
			if( null != servletContext ) {
				Object propertiesObj = servletContext.getAttribute(PROPERTIES_SERVLET_ATTRIB_NAME);
				if( null != propertiesObj
				 && propertiesObj instanceof Properties ) {
					props = (Properties)propertiesObj;
				}
			}
		}
		readProperties(props);
	}

	public JdbcConnections(Properties props) {
		readProperties(props);
	}
	
	synchronized private void readProperties(Properties props) {

		Iterator<Object> it = props.keySet().iterator();
		while( it.hasNext() ) {
			Object keyObj = it.next();
			if( keyObj instanceof String ) {
				String key = (String)keyObj;
				String value = props.getProperty(key);
				if( null != value ) {
					String connectionName = null;
					if( key.equals("default") ) { // legacy
						connectionName = "default";
					} else if( key.startsWith("jdbc.connection.") ) {
						connectionName = key.substring("jdbc.connection.".length());
					}
					
					if( null != connectionName ) {
						String[] components = value.split("\\|");
						if( components.length >= 4 ) {
							ConnectionInfo def = new ConnectionInfo();
							def.setJdbcClass(components[0].trim());
							def.setConnectionString(components[1].trim());
							def.setUserName(components[2].trim());
							def.setPassword(components[3].trim());
							nameToInfo.put(connectionName, def);
							logger.info(""+connectionName+" class="+def.getJdbcClass()+" conn="+def.getConnectionString()+" name="+def.getUserName());
							
							// First one defined is the default connection
							if( false == nameToInfo.containsKey(null) ) {
								nameToInfo.put(null, def);
							}
						}
					}
				}
				
			}
		}
	}
	
	/**
	 * This method returns the default connection.
	 * 
	 * @return Returns the default Connection instance, or null.
	 */
	synchronized public Connection getDb() throws Exception {
		return getDb(null);
	}
	
	/**
	 * This method checks for the presence of a Connection associated with the input db parameter. 
	 * It attempts to create the Connection and adds it to the connection map if it does not
	 * already exist.  If the Connection exists or is created, it is returned.
	 * 
	 * @param db database name.
	 * @return Returns the desired Connection instance, or null.
	 */
	synchronized public Connection getDb(String db) throws Exception {
		Connection con = null;
		if (nameToConnection.containsKey(db)) {
			con = nameToConnection.get(db);
		} else {
			ConnectionInfo info = nameToInfo.get(db);
			
			if( null == info ) {
				throw new Exception("No information provided for database named: "+db);
			}
			
			try {
				Class.forName(info.getJdbcClass()); //load the driver
				con = DriverManager.getConnection(info.getConnectionString(),
			                                     info.getUserName(),
			                                     info.getPassword()); //connect to the db
			    DatabaseMetaData dbmd = con.getMetaData(); //get MetaData to confirm connection
			    logger.info("Connection to "+dbmd.getDatabaseProductName()+" "+
			                       dbmd.getDatabaseProductVersion()+" successful.\n");

			    nameToConnection.put(db, con);
			} catch(Exception e) {
				throw new Exception("Couldn't get db connection: "+db,e);
			}
		}
		return(con);
	}

	synchronized public void closeAllConnections() {
		try {
			Map<String,Connection> temp = nameToConnection;
			nameToConnection = new HashMap<String,Connection>();
			
			Iterator<Connection> conIter = temp.values().iterator();
			while (conIter.hasNext()) {
				Connection con = conIter.next();
				con.close();
			}
		}
		catch (SQLException ignored) { }
	}
}
