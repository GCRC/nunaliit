package ca.carleton.gcrc.mail;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Vector;

public class MockMailServiceRecipients implements MailServiceRecipients {

	private Map<String,List<MailRecipient>> recipientMap = new HashMap<String,List<MailRecipient>>();
	
	public MockMailServiceRecipients(){
		MailRecipient john = new MailRecipient("john@abc.com", "John");
		MailRecipient jack = new MailRecipient("jack@abc.com", "Jack");
		
		{
			List<MailRecipient> defaultRecipients = new Vector<MailRecipient>();
			defaultRecipients.add(john);
			recipientMap.put("default", defaultRecipients);
		}

		{
			List<MailRecipient> destinationRecipients = new Vector<MailRecipient>();
			destinationRecipients.add(jack);
			recipientMap.put("destination", destinationRecipients);
		}
	}
	
	@Override
	public List<MailRecipient> getDefaultRecipients() throws Exception {
		return recipientMap.get("default");
	}

	@Override
	public List<MailRecipient> getRecipientsForDestination(String destination) throws Exception {
		return recipientMap.get(destination);
	}

}
