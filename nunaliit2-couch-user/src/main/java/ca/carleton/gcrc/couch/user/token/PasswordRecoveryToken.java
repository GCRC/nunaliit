package ca.carleton.gcrc.couch.user.token;

import java.util.Date;

import ca.carleton.gcrc.security.ber.BerConstructed;
import ca.carleton.gcrc.security.ber.BerFactory;
import ca.carleton.gcrc.security.ber.BerImplementation;
import ca.carleton.gcrc.security.ber.BerInteger;
import ca.carleton.gcrc.security.ber.BerObject;
import ca.carleton.gcrc.security.ber.BerString;
import ca.carleton.gcrc.security.ber.encoding.BerEncoder;

public class PasswordRecoveryToken implements Token {

	static public PasswordRecoveryToken decode(BerConstructed outer) throws Exception {
		try {
			// Check that we have enough members
			if( outer.size() < 3 ){
				throw new Exception("Not enough components");
			}
			
			PasswordRecoveryToken token = new PasswordRecoveryToken();
			
			// Get email address
			{
				BerObject emailObj = outer.get(0);
				if( false == (emailObj instanceof BerString) ){
					throw new Exception("Invalid email address");
				}
				String email = ((BerString)emailObj).getValue();
				token.setEmailAddress(email);
			}
			
			// Get expiry
			{
				BerObject expiryObj = outer.get(1);
				if( false == (expiryObj instanceof BerInteger) ){
					throw new Exception("Invalid expiry date");
				}
				long expiry = ((BerInteger)expiryObj).getValue();
				Date expiryDate = new Date(expiry);
				token.setExpiry(expiryDate);
			}
			
			// Get version
			{
				BerObject versionObj = outer.get(2);
				if( false == (versionObj instanceof BerString) ){
					throw new Exception("Invalid version");
				}
				String version = ((BerString)versionObj).getValue();
				token.setVersion(version);
			}
			
			return token;
		} catch(Exception e) {
			throw new Exception("Error while decoding password recovery token", e);
		}
	}

	private String emailAddress;
	private Date expiry;
	private String version;
	
	public PasswordRecoveryToken(){
		
	}

	public String getEmailAddress() {
		return emailAddress;
	}

	public void setEmailAddress(String emailAddress) {
		this.emailAddress = emailAddress;
	}

	public Date getExpiry() {
		return expiry;
	}

	public void setExpiry(Date expiry) {
		this.expiry = expiry;
	}

	public String getVersion() {
		return version;
	}

	public void setVersion(String version) {
		this.version = version;
	}
	
	@Override
	public byte[] encode() throws Exception {
		BerFactory factory = new BerImplementation();
		
		BerConstructed outer = factory.createConstructed(
			BerObject.TypeClass.APPLICATION
			,Token.APPLICATION_TYPE_PASSWORD_RECOVERY
			);
		
		BerString email = factory.createUTF8String();
		email.setValue(emailAddress);
		outer.add(email);
		
		long expiryMs = expiry.getTime();
		Long expiryLong = new Long(expiryMs);
		BerInteger date = factory.createInteger();
		date.setValue( expiryLong );
		outer.add(date);

		BerString berVersion = factory.createUTF8String();
		berVersion.setValue(version);
		outer.add(berVersion);
		
		byte[] result = BerEncoder.encode(outer);
		return result;
	}
}
