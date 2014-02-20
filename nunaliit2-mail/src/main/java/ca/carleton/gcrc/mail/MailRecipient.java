package ca.carleton.gcrc.mail;

import javax.mail.internet.InternetAddress;

public class MailRecipient {

	static public MailRecipient parseString(String value){
		String[] components = value.split("\\|");
		
		if( components.length > 1 ){
			return new MailRecipient(
				components[0].trim(),
				components[1].trim()
				);
		}

		return new MailRecipient(components[0].trim());
	}
	
	private String address;
	private String displayName;
	
	public MailRecipient(String address){
		this.address = address;
	}
	
	public MailRecipient(String address, String displayName){
		this.address = address;
		this.displayName = displayName;
	}

	public String getAddress() {
		return address;
	}

	public String getDisplayName() {
		return displayName;
	}
	
	public String toString(){
		if( null != displayName ){
			return displayName+"<"+address+">";
		} else if( null != address ) {
			return address;
		} else {
			return "null recipient";
		}
	}
	
	public InternetAddress getInternetAddress() throws Exception {
		InternetAddress iAddress = null;
		if( null == displayName ) {
			iAddress = new InternetAddress(address);
		} else {
			iAddress = new InternetAddress(address, displayName);
		}
		return iAddress;
	}
}
