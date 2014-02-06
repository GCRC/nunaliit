package ca.carleton.gcrc.couch.user.password;

import java.io.StringWriter;
import java.security.SecureRandom;

import ca.carleton.gcrc.security.rng.RngFactory;

public class PasswordGenerator {

	static final public String CHAR_SET =
		"abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ123456789!@#$%?&*";
	
	static public String generatePassword(int size){
		StringWriter sw = new StringWriter();
		
		SecureRandom rng = (new RngFactory()).createRng();
		for(int i=0; i<size; ++i){
			int index = rng.nextInt(CHAR_SET.length());
			char c = CHAR_SET.charAt(index);
			sw.write(c);
		}
		
		sw.flush();
		return sw.toString();
	}
}
