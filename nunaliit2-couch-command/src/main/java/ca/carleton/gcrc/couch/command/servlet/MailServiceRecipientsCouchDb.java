package ca.carleton.gcrc.couch.command.servlet;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.Vector;

import ca.carleton.gcrc.couch.user.UserDesignDocument;
import ca.carleton.gcrc.couch.user.UserDocument;
import ca.carleton.gcrc.mail.MailRecipient;
import ca.carleton.gcrc.mail.MailServiceRecipients;

public class MailServiceRecipientsCouchDb implements MailServiceRecipients {

	private String atlasName = null;
	private UserDesignDocument userDesignDocument;
	
	public MailServiceRecipientsCouchDb(
		String atlasName,
		UserDesignDocument userDesignDocument ){
		
		this.atlasName = atlasName;
		this.userDesignDocument = userDesignDocument;
	}
	
	@Override
	public List<MailRecipient> getDefaultRecipients() throws Exception {
		Collection<UserDocument> usersWithRoles = new Vector<UserDocument>();
		{
			List<String> roles = new ArrayList<String>(2);
			roles.add("administrator"); // global administrators
			roles.add(atlasName+"_administrator"); // atlas administrators
			
			usersWithRoles = userDesignDocument.getUsersWithRoles(roles);
		}
		
		List<MailRecipient> recipients = recipientsFromUser(usersWithRoles);
		return recipients;
	}

	@Override
	public List<MailRecipient> getRecipientsForDestination(String destination) throws Exception {
		Collection<UserDocument> allUsers = userDesignDocument.getAllUsers();
		
		List<UserDocument> usersForDestination = new ArrayList<UserDocument>( allUsers.size() );
		for(UserDocument userDocument : allUsers){
			Set<String> mailDestinations = userDocument.getMailDestinations();
			if( mailDestinations.contains(destination) ){
				usersForDestination.add(userDocument);
			}
		}
		
		List<MailRecipient> recipients = recipientsFromUser(usersForDestination);
		return recipients;
	}
	
	private List<MailRecipient> recipientsFromUser(Collection<UserDocument> users){
		List<MailRecipient> recipients = new ArrayList<MailRecipient>(users.size());
		for(UserDocument user : users){
			String display = user.getDisplayName();
			Collection<String> emails = user.getEmails();
			for(String email : emails){
				if( null == display ) {
					recipients.add( new MailRecipient(email) );
				} else {
					recipients.add( new MailRecipient(email,display) );
				}
			}
		}
		
		return recipients;
	}
}
