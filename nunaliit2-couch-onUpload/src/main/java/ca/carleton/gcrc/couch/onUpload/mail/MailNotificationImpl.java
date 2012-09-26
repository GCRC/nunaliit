package ca.carleton.gcrc.couch.onUpload.mail;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Date;
import java.util.List;
import java.util.Properties;
import java.util.Set;
import java.util.Vector;

import javax.mail.Message;
import javax.mail.Multipart;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeBodyPart;
import javax.mail.internet.MimeMessage;
import javax.mail.internet.MimeMultipart;

import org.apache.log4j.Logger;

public class MailNotificationImpl implements MailNotification {

	final protected Logger logger = Logger.getLogger(this.getClass());

	private Properties mailProperties = null;
	private boolean sendUploadMailNotification = false;
	private InternetAddress fromAddress = null;
	private List<InternetAddress> toRecipients = new Vector<InternetAddress>();
	private String approvalPageLink = null;
	
	public MailNotificationImpl() {
		
	}

	public Properties getMailProperties() {
		return mailProperties;
	}

	public void setMailProperties(Properties mailProperties) throws Exception {
		this.mailProperties = mailProperties;
		
		Set<String> propertyNames = mailProperties.stringPropertyNames();
		for(String propName : propertyNames) {
			try {
				if( "upload.sender".equals(propName) ) {
					String value = mailProperties.getProperty(propName);
					String[] components = value.split("\\|");
					if( components.length < 2 ) {
						fromAddress = new InternetAddress(components[0]);
					} else {
						fromAddress = new InternetAddress(components[0],components[1]);
					}
					
				} else if( propName.startsWith("upload.recipient.") ) {
					String value = mailProperties.getProperty(propName);
					String[] components = value.split("\\|");
					InternetAddress recipient = null;
					if( components.length < 2 ) {
						recipient = new InternetAddress(components[0]);
					} else {
						recipient = new InternetAddress(components[0],components[1]);
					}
					toRecipients.add(recipient);
					
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

	public InternetAddress getFromAddress() {
		return fromAddress;
	}

	public void setFromAddress(InternetAddress fromAddress) {
		this.fromAddress = fromAddress;
	}

	public List<InternetAddress> getToRecipients() {
		return toRecipients;
	}

	public void addToRecipient(InternetAddress toRecipient) {
		toRecipients.add(toRecipient);
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
		if( null == fromAddress ) return;
		if( toRecipients.size() < 1 ) return;

		logger.info("Sending mail notification for "+docId);
		
		try {
			Session mailSession = Session.getInstance(mailProperties);
			MimeMessage msg = new MimeMessage(mailSession);
			
			// From
			msg.setFrom( fromAddress );
			
			// To
			InternetAddress[] toAddresses = new InternetAddress[toRecipients.size()];
			for(int loop=0; loop<toAddresses.length; ++loop) {
				toAddresses[loop] = toRecipients.get(loop);
			}
			msg.setRecipients(Message.RecipientType.TO, toAddresses);
			
			// Subject
			msg.setSubject("Uploaded Media - "+description);
			
			// Date
			msg.setSentDate(new Date());
			
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
			MimeBodyPart mbp = new MimeBodyPart();
			mbp.setContent(sw.toString(), "text/html");
			
			// Add body part to message
			Multipart mp = new MimeMultipart();
			mp.addBodyPart(mbp);
			msg.setContent(mp);
			
			// Send message
			Transport.send(msg);
		} catch (Exception e) {
			logger.error("Unable to send upload mail notification",e);
			throw new Exception("Unable to send upload mail notification",e);
		}
	}

}
