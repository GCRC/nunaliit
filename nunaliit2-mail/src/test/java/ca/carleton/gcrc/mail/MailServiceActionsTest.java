package ca.carleton.gcrc.mail;

import org.json.JSONObject;

import junit.framework.TestCase;

public class MailServiceActionsTest extends TestCase {

	public void testSendFormEmail() throws Exception {
		MockMailDelivery mailDelivery = new MockMailDelivery();
		MailServiceRecipients mailRecipients = new MockMailServiceRecipients();
		
		MailServiceActions actions = new MailServiceActions(
			"testAtlas", 
			mailDelivery, 
			mailRecipients
		);
		
		JSONObject result = actions.sendFormEmail("destination", "subject", "contactInfo", "body");
		boolean ok = result.optBoolean("ok",false);
		if( !ok ){
			fail("Unexpected result");
		}
		
		MailMessage message = mailDelivery.getMessage();
		String htmlContent = message.getHtmlContent();
		System.out.print(htmlContent);
	}
}
