package ca.carleton.gcrc.couch.user.token;

import java.util.Date;

import ca.carleton.gcrc.security.ber.BerConstructed;
import ca.carleton.gcrc.security.ber.BerFactory;
import ca.carleton.gcrc.security.ber.BerImplementation;
import ca.carleton.gcrc.security.ber.BerInteger;
import ca.carleton.gcrc.security.ber.BerObject;
import ca.carleton.gcrc.security.ber.BerString;
import ca.carleton.gcrc.security.ber.encoding.BerEncoder;

public class CreationToken implements Token {
	
	static public CreationToken decode(BerConstructed outer) throws Exception {
		try {
			// Check that we have enough members
			if( outer.size() < 2 ){
				throw new Exception("Not enough components");
			}
			
			CreationToken token = new CreationToken();
			
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
			
			return token;
		} catch(Exception e) {
			throw new Exception("Error while decoding user creation token", e);
		}
	}

	private String emailAddress;
	private Date expiry;
	
	public CreationToken(){
		
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
	
	@Override
	public byte[] encode() throws Exception {
		BerFactory factory = new BerImplementation();
		
		BerConstructed outer = factory.createConstructed(
			BerObject.TypeClass.APPLICATION
			,Token.APPLICATION_TYPE_CREATION
			);
		
		BerString email = factory.createUTF8String();
		email.setValue(emailAddress);
		outer.add(email);

		long expiryMs = expiry.getTime();
		Long expiryLong = expiryMs;
		BerInteger date = factory.createInteger();
		date.setValue( expiryLong );
		outer.add(date);

		byte[] result = BerEncoder.encode(outer);
		return result;
	}
}
