package ca.carleton.gcrc.couch.onUpload.mail;

import java.util.Properties;

import ca.carleton.gcrc.mail.MailDeliveryImpl;
import junit.framework.TestCase;

public class MailNotificationTest extends TestCase {

	static public MailNotificationImpl getMailNotification() throws Exception {
		MailNotificationImpl result = null;
		
		Properties props = TestConfiguration.getMailProperties();
		if( null != props ) {			
			MailDeliveryImpl mailDelivery = new MailDeliveryImpl();
			mailDelivery.setMailProperties(props);
			
			MockUserDesignDocument mockUserDesign = new MockUserDesignDocument();
			mockUserDesign.setDisplayName( props.getProperty("test.displayName") );
			mockUserDesign.setEmailAddress( props.getProperty("test.email") );

			result = new MailNotificationImpl("test",mailDelivery,mockUserDesign);
			result.setMailProperties(props);
		}
		
		return result;
	}
	
	public void testSimpleSend() throws Exception {
		MailNotificationImpl notification = getMailNotification();
		if( null != notification ) {
			notification.uploadNotification("Test ID", "test.jpg");
		}
	}
}
