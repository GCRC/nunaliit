package ca.carleton.gcrc.couch.app.impl;

import java.io.InputStream;
import java.io.Writer;

import org.apache.commons.codec.binary.Base64;

public class Base64Transcoder {

	static public void encode(InputStream is, Writer writer) throws Exception {
		byte[] inputBuffer = new byte[3];
		boolean done = false;
		
		while( !done ){
			int bytesInBuffer = 0;
			int bytesRead = is.read(inputBuffer);
			if( bytesRead >= 0 ) {
				bytesInBuffer = bytesRead;
			}

			while( bytesRead >= 0 && bytesInBuffer < 3 ) {
				bytesRead = is.read(inputBuffer,bytesInBuffer,inputBuffer.length-bytesInBuffer);
				if( bytesRead >= 0 ) {
					bytesInBuffer += bytesRead;
				}
			}
			
			if( bytesInBuffer < 3 ) {
				done = true;
				if( bytesInBuffer > 0 ) {
					byte[] endBuffer = new byte[bytesInBuffer];
					for(int loop=0; loop<bytesInBuffer; ++loop){
						endBuffer[loop] = inputBuffer[loop];
					}
					String outputBuffer = Base64.encodeBase64String(endBuffer);
					writer.write(outputBuffer);
				}
				
			} else {
				String outputBuffer = Base64.encodeBase64String(inputBuffer);
				writer.write(outputBuffer);
			}
		}
	}
}
