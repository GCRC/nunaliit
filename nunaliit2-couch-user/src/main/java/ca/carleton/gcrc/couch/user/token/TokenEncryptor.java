package ca.carleton.gcrc.couch.user.token;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

import ca.carleton.gcrc.security.ber.BerBytes;
import ca.carleton.gcrc.security.ber.BerConstructed;
import ca.carleton.gcrc.security.ber.BerFactory;
import ca.carleton.gcrc.security.ber.BerImplementation;
import ca.carleton.gcrc.security.ber.BerObject;
import ca.carleton.gcrc.security.ber.encoding.BerDecoder;
import ca.carleton.gcrc.security.ber.encoding.BerEncoder;
import ca.carleton.gcrc.security.kdf.KDFCounterMode;
import ca.carleton.gcrc.security.kdf.impl.KDFCounterModeImpl;

public class TokenEncryptor {
	
	static final private byte[] LABEL = { 
		(byte)'e', (byte)'n', (byte)'c', (byte)'r', (byte)'y', (byte)'p', (byte)'t'
	};

	static public byte[] encryptToken(byte[] productionKey, byte[] context, Token token) throws Exception {
		// Derive a key for encryption
		SecretKeySpec encryptionKey = deriveKey(productionKey, context);
		
		// Encrypt payload
		byte[] encrypted = null;
		try {
			byte[] payload = token.encode();
			Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");

			byte[] iv = { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 };
		    IvParameterSpec ivspec = new IvParameterSpec(iv);
		    
			cipher.init(Cipher.ENCRYPT_MODE, encryptionKey, ivspec);
			encrypted = cipher.doFinal(payload);
		} catch(Exception e) {
			throw new Exception("Error during encryption of token", e);
		}
		
		// Encode
		BerFactory factory = new BerImplementation();
		BerConstructed outer = factory.createConstructed(
				BerObject.TypeClass.APPLICATION
				,Token.APPLICATION_TYPE_ENCRYPTED
				);
		
		// Context
		BerBytes berContext = factory.createOctetString();
		berContext.setValue(context);
		outer.add(berContext);
		
		// Encrypted Token
		BerBytes berEncrypted = factory.createOctetString();
		berEncrypted.setValue(encrypted);
		outer.add(berEncrypted);
		
		byte[] result = BerEncoder.encode(outer);
		return result;
	}

	static public Token decryptToken(byte[] productionKey, byte[] encryptedToken) throws Exception {
		
		try {
			BerObject outerObj = BerDecoder.decode(encryptedToken);
			
			if( false == outerObj.isTypeConstructed()
			 || false == (outerObj instanceof BerConstructed) ){
				throw new Exception("Object is not constructed.");
			}
			if( Token.APPLICATION_TYPE_ENCRYPTED != outerObj.getType() ){
				throw new Exception("Unexpected type.");
			}
			BerConstructed outer = (BerConstructed)outerObj;
			
			// Check that we have enough members
			if( outer.size() < 2 ){
				throw new Exception("Not enough components.");
			}
			
			// Get context
			BerObject contextObj = outer.get(0);
			if( false == (contextObj instanceof BerBytes) ){
				throw new Exception("Invalid context.");
			}
			byte[] context = ((BerBytes)contextObj).getValue();
			
			// Get encrypted payload
			BerObject encryptedObj = outer.get(1);
			if( false == (encryptedObj instanceof BerBytes) ){
				throw new Exception("Invalid encrypted payload.");
			}
			byte[] encryptedPayload = ((BerBytes)encryptedObj).getValue();
			
			// Derive a key for encryption
			SecretKeySpec encryptionKey = deriveKey(productionKey, context);
			
			// Decrypt payload
			byte[] payload = null;
			try {
				Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");

				byte[] iv = { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 };
			    IvParameterSpec ivspec = new IvParameterSpec(iv);
			    
				cipher.init(Cipher.DECRYPT_MODE, encryptionKey, ivspec);
				payload = cipher.doFinal(encryptedPayload);
			} catch(Exception e) {
				throw new Exception("Decryption error", e);
			}
			
			// Decode token
			TokenDecoder decoder = new TokenDecoder();
			Token token = decoder.decode(payload);
			
			return token;
		} catch(Exception e) {
			throw new Exception("Error while decrypting token", e);
		}
	}
	
	static private SecretKeySpec deriveKey(byte[] productionKey, byte[] context) throws Exception {
		KDFCounterMode kdf = new KDFCounterModeImpl();
		byte[] raw = kdf.deriveKey(productionKey, LABEL, context, 16);
		SecretKeySpec encryptionKey = new SecretKeySpec(raw, "AES");
		return encryptionKey;
	}

}
