package ca.carleton.gcrc.security.kdf;

public interface KDFCounterMode {

	byte[] deriveKey(
		byte[] productionKey
		,byte[] label
		,byte[] context
		,int lengthInBytes
		) throws Exception;
}
