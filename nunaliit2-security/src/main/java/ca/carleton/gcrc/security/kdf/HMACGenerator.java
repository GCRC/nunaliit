package ca.carleton.gcrc.security.kdf;

public interface HMACGenerator {

	int getOutputSizeInBytes();
	
	byte[] computeHMAC(byte[] key, byte[] text) throws Exception;
}
