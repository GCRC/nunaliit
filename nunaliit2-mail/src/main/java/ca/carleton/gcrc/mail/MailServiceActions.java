package ca.carleton.gcrc.mail;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.List;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MailServiceActions {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private MailDelivery mailDelivery;
	private MailServiceRecipients mailRecipients;
	
	public MailServiceActions(MailDelivery mailDelivery, MailServiceRecipients mailRecipients){
		this.mailDelivery = mailDelivery;
		this.mailRecipients = mailRecipients;
	}

	public JSONObject getWelcome() throws Exception {
		JSONObject result = new JSONObject();
		result.put("ok", true);
		result.put("service", "mail");
		
		if( null != mailDelivery 
		 && mailDelivery.isConfigured() ){
			result.put("configured", true);
		}
		
		if( null != mailRecipients ){
			int count = getRecipientsForDestination(null).size();
			result.put("defaultRecipientCount", count);
		}
		
		return result;
	}
	
	public JSONObject sendFormEmail(String destination, String contactInfo, String body) throws Exception {
		try {
			JSONObject result = new JSONObject();
			
			List<MailRecipient> recipients = getRecipientsForDestination(destination);
			if( recipients.size() < 1 ){
				throw new Exception("Unable to send form e-mail because no recipients are set: "+destination);
			}
	
			MailMessage message = new MailMessage();
			
			// To
			for(MailRecipient recipient : recipients){
				message.addToRecipient( recipient );
			}
			
			// Generate message
			StringWriter sw = new StringWriter();
			PrintWriter pw = new PrintWriter(sw);
			
			pw.println("Destination: "+destination);
			pw.println();
			pw.println("Contact: ");
			pw.println(contactInfo);
			pw.println();
			pw.println("Message: ");
			pw.println(body);
			pw.flush();
			
			message.setHtmlContent(body);
			
			// Send message
			mailDelivery.sendMessage(message);
			
			result.put("ok", true);
			result.put("recipientCount", recipients.size());
			
			return result;

		} catch(Exception e) {
			throw new Exception("Error while attempting to send a form e-mail",e);
		}
	}
	
	private List<MailRecipient> getRecipientsForDestination(String destination) throws Exception {
		if( null == destination ){
			destination = "default";
		}

		List<MailRecipient> recipients = mailRecipients.getRecipientsForDestination(destination);
		if( recipients.size() < 1 ){
			recipients = mailRecipients.getDefaultRecipients();
		}
		
		return recipients;
	}
}
