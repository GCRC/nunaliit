package ca.carleton.gcrc.mail;

import java.util.Date;
import java.util.List;
import java.util.Properties;
import java.util.Set;

import javax.mail.Authenticator;
import javax.mail.Message;
import javax.mail.Multipart;
import javax.mail.PasswordAuthentication;
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

	@Override
	public boolean isConfigured() {

		String mailProtocol = mailProperties.getProperty("mail.transport.protocol",null);
		String host = mailProperties.getProperty("mail."+mailProtocol+".host",null);
		String port = mailProperties.getProperty("mail."+mailProtocol+".port",null);

		if( null == fromAddress 
		 || isEmptyOrNull(mailProtocol)
		 || isEmptyOrNull(host)
		 || isEmptyOrNull(port)) {
			return false;
		}
		
		return true;
	}
	
	private boolean isEmptyOrNull(String value) {
		return value == null || value.isEmpty();
	}

	@Override
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
					MailRecipient r = MailRecipient.parseString(value);
					fromAddress = r.getInternetAddress();
					
				} else if( "user.sender".equals(propName) ) {
					String value = mailProperties.getProperty(propName);
					MailRecipient r = MailRecipient.parseString(value);
					fromAddress = r.getInternetAddress();
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

		if( null == fromAddress ) return;

		logger.info("Sending mail message");
		
		try {
			// Send to log the properties
//			Enumeration<?> e = mailProperties.propertyNames();
//			while( e.hasMoreElements() ){
//				Object keyObj = e.nextElement();
//				if( keyObj instanceof String ){
//					String key = (String)keyObj;
//					String value = mailProperties.getProperty(key);
//					logger.info("Mail Property "+key+"="+value);
//				}
//			}
			
			// Check for user name and password
			String userName = null;
			String userPassword = null;
			String prot = mailProperties.getProperty("mail.transport.protocol",null);
			if( null != prot ){
				userName = mailProperties.getProperty("mail."+prot+".user",null);
				userPassword = mailProperties.getProperty("mail."+prot+".password",null);
			}
			
			// Create session
			Session mailSession = null;
			if( null != userName && null != userPassword ) {
				final String name = userName;
				final String pw = userPassword;
				
				Authenticator auth = new Authenticator(){
					protected PasswordAuthentication getPasswordAuthentication() {
						return new PasswordAuthentication(name,pw);
					}
				};
				mailSession = Session.getInstance(mailProperties, auth);
			} else {
				mailSession = Session.getInstance(mailProperties);
			}
			
			MimeMessage msg = new MimeMessage(mailSession);
			
			// From
			MailRecipient fromRecipient = message.getFromAddress();
			if( null == fromRecipient ){
				msg.setFrom( fromAddress );
			} else {
				msg.setFrom( fromRecipient.getInternetAddress() );
			}
			
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
