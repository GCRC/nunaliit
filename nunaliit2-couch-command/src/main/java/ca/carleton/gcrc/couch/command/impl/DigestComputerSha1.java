package ca.carleton.gcrc.couch.command.impl;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.security.MessageDigest;

import org.apache.commons.codec.binary.Base64;
import org.apache.log4j.Logger;

public class DigestComputerSha1 {

	final static public String DIGEST_COMPUTER_TYPE = "SHA-1";
	
	final protected Logger logger = Logger.getLogger(this.getClass());

	public String computeDocumentDigest(File file) throws Exception {
		String digest = null;
		
		if( null == file ){
			throw new Exception("File must be specified when computing a digest");
		}
		
		InputStream is = null;
		try {
			is = new FileInputStream(file);

			// Perform SHA-1 digest
			MessageDigest md = MessageDigest.getInstance("SHA-1");

			byte[] buffer = new byte[512];
			int size = is.read(buffer);
			while( size >= 0 ){
				md.update(buffer, 0, size);
				size = is.read(buffer);
			}
			
			// B64 encode digest
			byte[] digestBytes = md.digest();

			byte[] encoded = Base64.encodeBase64(digestBytes);
			ByteArrayInputStream bais = new ByteArrayInputStream(encoded);
			InputStreamReader isr = new InputStreamReader(bais, "UTF-8");
			BufferedReader br = new BufferedReader(isr);
			digest = br.readLine();
			
		} catch(Exception e) {
			throw new Exception("Error computing digest on file: "+file.getAbsolutePath(), e);
			
		} finally {
			if( null != is ) {
				try {
					is.close();
				} catch(Exception e) {
					// Ignore
				}
			}
		}
		
		return digest;
	}
}
