package ca.carleton.gcrc.mail;

import java.util.List;

public interface MailServiceRecipients {

	List<MailRecipient> getDefaultRecipients() throws Exception;

	List<MailRecipient> getRecipientsForDestination(String destination) throws Exception;
}
