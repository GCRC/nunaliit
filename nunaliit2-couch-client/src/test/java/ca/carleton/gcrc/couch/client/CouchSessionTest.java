package ca.carleton.gcrc.couch.client;

import junit.framework.TestCase;

public class CouchSessionTest extends TestCase {

	public void testGetCurrentContext() throws Exception {
		CouchClient client = TestSupport.getClient();
		if( null != client ) {
			CouchSession session = client.getSession();
			
			CouchUserContext userCtx = session.getCurrentUserContext();
			
			String userName = TestSupport.getUserName();
			if( false == userName.equals( userCtx.getName() ) ) {
				fail("Unexpected user name in session context");
			}
		}
	}

	public void testCreateContext() throws Exception {
		CouchClient client = TestSupport.getClient();
		if( null != client ) {
			CouchSession session = client.getSession();
			
			String userName = TestSupport.getUserName();
			String userPassword = TestSupport.getUserPassword();
			
			CouchContext cookieContext = session.createSession(userName, userPassword);
			CouchClient cookieClient = (new CouchFactory()).getClient(cookieContext, client);
			
			CouchSession cookieSession = cookieClient.getSession();
			CouchUserContext userCtx = cookieSession.getCurrentUserContext();
			if( false == userName.equals( userCtx.getName() ) ) {
				fail("Unexpected user name in session context");
			}
		}
	}
}
