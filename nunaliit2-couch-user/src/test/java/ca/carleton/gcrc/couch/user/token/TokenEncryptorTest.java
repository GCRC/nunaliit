package ca.carleton.gcrc.couch.user.token;

import java.util.Date;

import junit.framework.TestCase;

public class TokenEncryptorTest extends TestCase {
	
	static final private byte[] DUMMY_PRODUCTION_KEY = {
		(byte)0x01, (byte)0x02, (byte)0x03, (byte)0x04, (byte)0x05, (byte)0x06, (byte)0x07, (byte)0x08
		,(byte)0x09, (byte)0x0a, (byte)0x0b, (byte)0x0c, (byte)0x0d, (byte)0x0e, (byte)0x0f, (byte)0x10
	};
	static final private byte[] DUMMY_CONTEXT = {
		(byte)0xf1, (byte)0xf2, (byte)0xf3, (byte)0xf4, (byte)0xf5, (byte)0xf6, (byte)0xf7, (byte)0xf8
	};

	public void testEncryptToken() throws Exception {
		CreationToken token = new CreationToken();
		token.setEmailAddress("abc@company.com");
		token.setExpiry( new Date() );
		
		TokenEncryptor.encryptToken(DUMMY_PRODUCTION_KEY, DUMMY_CONTEXT, token);
	}

	public void testDecryptTokenCreation() throws Exception {
		CreationToken token = new CreationToken();
		token.setEmailAddress("abc@company.com");
		token.setExpiry( new Date() );
		
		byte[] encrypted = TokenEncryptor.encryptToken(DUMMY_PRODUCTION_KEY, DUMMY_CONTEXT, token);
		Token tokenCopy = TokenEncryptor.decryptToken(DUMMY_PRODUCTION_KEY, encrypted);
		
		if( tokenCopy instanceof CreationToken ) {
			CreationToken token2 = (CreationToken)tokenCopy;
			
			if( false == token2.getEmailAddress().equals(token.getEmailAddress()) ){
				fail("Unexpected e-mail address");
			}
			if( token2.getExpiry().getTime() != token.getExpiry().getTime() ){
				fail("Unexpected expiry date");
			}
			
		} else {
			fail("Unexpected class: "+tokenCopy.getClass().getName());
		}
	}
}
