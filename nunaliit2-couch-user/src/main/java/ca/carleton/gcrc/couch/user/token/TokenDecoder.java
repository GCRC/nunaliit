package ca.carleton.gcrc.couch.user.token;

import ca.carleton.gcrc.security.ber.BerConstructed;
import ca.carleton.gcrc.security.ber.BerObject;
import ca.carleton.gcrc.security.ber.encoding.BerDecoder;

public class TokenDecoder {

	public Token decode(byte[] encodedToken) throws Exception {
		try {
			BerObject outerObj = BerDecoder.decode(encodedToken);
			
			if( false == outerObj.isTypeConstructed()
			 || false == (outerObj instanceof BerConstructed) ){
				throw new Exception("Object is not constructed.");
			}
			BerConstructed outer = (BerConstructed)outerObj;

			if( Token.APPLICATION_TYPE_CREATION == outer.getType() ){
				return CreationToken.decode(outer);
				
			} else if( Token.APPLICATION_TYPE_PASSWORD_RECOVERY == outer.getType() ){
					return PasswordRecoveryToken.decode(outer);
					
			} else {
				throw new Exception("Unrecognized type: "+outer.getType());
			}
			
		} catch(Exception e) {
			throw new Exception("Error while deccoding token", e);
		}
	}
}
