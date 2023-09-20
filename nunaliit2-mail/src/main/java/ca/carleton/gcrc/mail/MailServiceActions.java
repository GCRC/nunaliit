package ca.carleton.gcrc.mail;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.mail.messageGenerator.FormEmailMessageGenerator;
import ca.carleton.gcrc.mail.messageGenerator.MailMessageGenerator;

public class MailServiceActions {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private String atlasName;
	private MailDelivery mailDelivery;
	private MailServiceRecipients mailRecipients;
	private MailMessageGenerator formEmailGenerator = new FormEmailMessageGenerator();
	
	public MailServiceActions(
			String atlasName, 
			MailDelivery mailDelivery, 
			MailServiceRecipients mailRecipients ){
		this.atlasName = atlasName;
		this.mailDelivery = mailDelivery;
		this.mailRecipients = mailRecipients;
	}

	public MailMessageGenerator getFormEmailGenerator() {
		return formEmailGenerator;
	}

	public void setFormEmailGenerator(MailMessageGenerator formEmailGenerator) {
		this.formEmailGenerator = formEmailGenerator;
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
	
	public JSONObject sendFormEmail(String destination, String subject, String contactInfo, String body) throws Exception {
		try {
			JSONObject result = new JSONObject();
			
			List<MailRecipient> recipients = getRecipientsForDestination(destination);
			if( recipients.size() < 1 ){
				throw new Exception("Unable to send form e-mail because no recipients are set: "+destination);
			}
			
			// Parameters
			Map<String,String> parameters = new HashMap<String,String>();
			{
				parameters.put("destination", destination);
				parameters.put("subject", subject);
				parameters.put("contactInfo", contactInfo);
				parameters.put("body", body);
	
				if( null != atlasName ){
					parameters.put("atlasName", atlasName);
				}
				
				// Try to parse contact information
				try {
					// Verify
					JSONArray contactArr = new JSONArray(contactInfo);
					for(int i=0,e=contactArr.length(); i<e; ++i){
						JSONObject info = contactArr.getJSONObject(i);
						String name = info.optString("name", null);
						String value = info.optString("value", null);
						
						if( null != name && null != value ){
							parameters.put(name, value);
						}
					}
				} catch(Exception e) {
					// Ignore
				}
			}

			MailMessage message = new MailMessage();
			
			// To
			for(MailRecipient recipient : recipients){
				message.addToRecipient( recipient );
			}
			
			formEmailGenerator.generateMessage(message, parameters);
			
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
