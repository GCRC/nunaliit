package ca.carleton.gcrc.couch.onUpload.mail;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

import javax.mail.internet.InternetAddress;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MailNotificationImpl implements MailNotification {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private MailDelivery mailDelivery = null;
	private Properties mailProperties = null;
	private boolean sendUploadMailNotification = false;
	private Map<String,String> toRecipients = new HashMap<String,String>();
	private String approvalPageLink = null;
	
	public MailNotificationImpl(MailDelivery mailDelivery) {
		this.mailDelivery = mailDelivery;
	}

	public Properties getMailProperties() {
		return mailProperties;
	}

	public void setMailProperties(Properties mailProperties) throws Exception {
		this.mailProperties = mailProperties;
		
		Set<String> propertyNames = mailProperties.stringPropertyNames();
		for(String propName : propertyNames) {
			try {
				if( propName.startsWith("upload.recipient.") ) {
					String value = mailProperties.getProperty(propName);
					String[] components = value.split("\\|");
					InternetAddress recipient = null;
					if( components.length < 2 ) {
						toRecipients.put(components[0], null);
					} else {
						toRecipients.put(components[0], components[1]);
					}
					
				} else if( "upload.approval.url".equals(propName) ) {
					approvalPageLink = mailProperties.getProperty(propName);
					
				} else if( "upload.sendNotification".equals(propName) ) {
					sendUploadMailNotification = Boolean.parseBoolean( mailProperties.getProperty(propName) );
				}
			} catch(Exception e) {
				throw new Exception("Problem while parsing key: "+propName, e);
			}
		}
	}
	
	@Override
	public void uploadNotification(
			String docId
			,String title
			,String description
			,String attachmentName
			) throws Exception {

//		mailProps.put("mail.transport.protocol", "smtp");
//		mailProps.put("mail.smtp.host", "smtp.istop.com");
//		mailProps.put("mail.smtp.port", "25");
		
		if( false == sendUploadMailNotification ) return;
		if( toRecipients.size() < 1 ) return;

		logger.info("Sending mail notification for "+docId);
		
		try {
			MailMessage message = new MailMessage();
			
			// To
			for(String address : toRecipients.keySet()){
				String display = toRecipients.get(address);
				message.addToRecipient( new MailRecipient(address,display) );
			}
			
			// Subject
			message.setSubject("Uploaded Media - "+description);
			
			// Create HTML body part
			StringWriter sw = new StringWriter();
			PrintWriter pw = new PrintWriter(sw);
			pw.println("<html><head><title>Upload Notification</title></head><body><h1>Upload Notification</h1>");
			pw.println("<p>A media was uploaded to the atlas with the following details:</p>");
			pw.println("<table>");
			pw.println("<tr><td>Title</td><td>"+title+"</td></tr>");
			pw.println("<tr><td>Description</td><td>"+description+"</td></tr>");
			pw.println("<tr><td>Attachment</td><td>"+attachmentName+"</td></tr>");
			pw.println("<tr><td>ID</td><td>"+docId+"</td></tr>");
			pw.println("</table>");
			if( null != approvalPageLink ) {
				pw.println("<p>The page where contributions can be approved is located at: <a href=\""+approvalPageLink+"\">"+approvalPageLink+"</a></p>");
			}
			pw.println("</body></html>");
			pw.flush();
			message.setHtmlContent(sw.toString());
			
			// Send message
			mailDelivery.sendMessage(message);
			
		} catch (Exception e) {
			logger.error("Unable to send upload mail notification",e);
			throw new Exception("Unable to send upload mail notification",e);
		}
	}

}
