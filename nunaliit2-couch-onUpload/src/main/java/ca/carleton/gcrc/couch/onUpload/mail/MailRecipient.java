package ca.carleton.gcrc.couch.onUpload.mail;

public class MailRecipient {

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
}
