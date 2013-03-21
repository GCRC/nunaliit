package ca.carleton.gcrc.couch.onUpload.mail;

import java.util.Date;
import java.util.List;
import java.util.Properties;
import java.util.Set;

import javax.mail.Message;
import javax.mail.Multipart;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeBodyPart;
import javax.mail.internet.MimeMessage;
import javax.mail.internet.MimeMultipart;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MailDeliveryImpl implements MailDelivery {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private Properties mailProperties = null;
	private InternetAddress fromAddress = null;
	
	public MailDeliveryImpl() {
		
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

	@Override
	public void sendMessage(MailMessage message) throws Exception {

//		mailProps.put("mail.transport.protocol", "smtp");
//		mailProps.put("mail.smtp.host", "smtp.istop.com");
//		mailProps.put("mail.smtp.port", "25");
		
		if( null == fromAddress ) return;

		logger.info("Sending mail message");
		
		try {
			Session mailSession = Session.getInstance(mailProperties);
			MimeMessage msg = new MimeMessage(mailSession);
			
			// From
			msg.setFrom( fromAddress );
			
			// To
			{
				List<MailRecipient> recipients = message.getToRecipients();
				InternetAddress[] toAddresses = new InternetAddress[recipients.size()];
				for(int loop=0; loop<toAddresses.length; ++loop) {
					MailRecipient recipient = recipients.get(loop);
					if( null == recipient.getDisplayName() ) {
						toAddresses[loop] = new InternetAddress(recipient.getAddress());
					} else {
						toAddresses[loop] = new InternetAddress(
							recipient.getAddress()
							,recipient.getDisplayName()
						);
					}
				}
				msg.setRecipients(Message.RecipientType.TO, toAddresses);
			}
			
			// Subject
			msg.setSubject( message.getSubject() );
			
			// Date
			msg.setSentDate(new Date());
			
			// Create HTML body part
			MimeBodyPart htmlMbp = null;
			if( null != message.getHtmlContent() ) {
				htmlMbp = new MimeBodyPart();
				htmlMbp.setContent(message.getHtmlContent(), "text/html");
			}
			
			// Add body part to message
			Multipart mp = new MimeMultipart();
			if( null != htmlMbp ) {
				mp.addBodyPart(htmlMbp);
			}
			msg.setContent(mp);
			
			// Send message
			Transport.send(msg);
		} catch (Exception e) {
			logger.error("Unable to send mail notification",e);
			throw new Exception("Unable to send mail notification",e);
		}
	}
}
