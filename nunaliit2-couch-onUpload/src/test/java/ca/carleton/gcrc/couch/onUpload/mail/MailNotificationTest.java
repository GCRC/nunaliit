package ca.carleton.gcrc.couch.onUpload.mail;

import java.util.Properties;

import junit.framework.TestCase;

public class MailNotificationTest extends TestCase {

	static public MailNotificationImpl getMailNotification() throws Exception {
		MailNotificationImpl result = null;
		
		Properties props = TestConfiguration.getMailProperties();
		if( null != props ) {
			result = new MailNotificationImpl();
			result.setMailProperties(props);
		}
		
		return result;
	}
	
	public void testSimpleSend() throws Exception {
		MailNotificationImpl notification = getMailNotification();
		if( null != notification ) {
			notification.uploadNotification("Test ID", "Test Title", "Test Desc", "test.jpg");
		}
	}
}
