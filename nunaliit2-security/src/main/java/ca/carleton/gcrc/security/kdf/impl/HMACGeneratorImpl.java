package ca.carleton.gcrc.security.kdf.impl;

import java.security.MessageDigest;

import ca.carleton.gcrc.security.kdf.HMACGenerator;

public class HMACGeneratorImpl implements HMACGenerator {
	
	public enum Type {
		SHA384("SHA-384",128, 48)
		;
		
		private String id;
		private int blockSizeInBytes;
		private int outputSizeInBytes;
		Type(String id, int blockSizeInBytes, int outputSizeInBytes){
			this.id = id;
			this.blockSizeInBytes = blockSizeInBytes;
			this.outputSizeInBytes = outputSizeInBytes;
		}
		public String getId(){
			return id;
		}
		public int getBlockSizeInBytes(){
			return blockSizeInBytes;
		}
		public int getOutputSizeInBytes(){
			return outputSizeInBytes;
		}
	};
	
	private Type type;
	
	public HMACGeneratorImpl(Type type){
		this.type = type;
	}

	@Override
	public int getOutputSizeInBytes() {
		return type.getOutputSizeInBytes();
	}

	@Override
	public byte[] computeHMAC(byte[] key, byte[] text) throws Exception {
		if( null == key ){
			throw new Exception("During HMAC computation, a key must be provided");
		}
		
		// Step 1,2,3: Compute K0
		int b = type.getBlockSizeInBytes();
		byte[] k0 = new byte[b];
		if( key.length > b ){
			// Step 2
			MessageDigest md = MessageDigest.getInstance(type.getId());
			byte[] hashedKey = md.digest(key);

			int i = 0;
			for( ; i<hashedKey.length; ++i){
				k0[i] = hashedKey[i];
			}
			for( ; i<k0.length; ++i){
				k0[i] = 0;
			}
			
		} else {
			// Step 1 and 3
			int i = 0;
			for( ; i<key.length; ++i){
				k0[i] = key[i];
			}
			for( ; i<k0.length; ++i){
				k0[i] = 0;
			}
		}
		
		// Step 4: Compute k0 xor ipad (ipad is 0x36 repeated)
		for(int i = 0; i<k0.length; ++i){
			k0[i] = (byte)(k0[i] ^ 0x36);
		}
		// Now, k0 contains k0 ^ ipad
		
		// Step 5 and 6: Compute H( (k0 ^ ipad) || text )
		byte[] innerHash = null;
		{
			MessageDigest md = MessageDigest.getInstance(type.getId());
			md.update(k0);
			innerHash = md.digest(text);
		}
		
		// Step 7: Compute k0 xor opad (opad is 0x5c repeated)
		for(int i = 0; i<k0.length; ++i){
			k0[i] = (byte)(k0[i] ^ 0x36); // undo ipad
			k0[i] = (byte)(k0[i] ^ 0x5c); // apply opad
		}
		// Now, k0 contains k0 ^ opad
		
		// Step 8 and 9: Compute H( (k0 ^ opad) || innerHash )
		byte[] outerHash = null;
		{
			MessageDigest md = MessageDigest.getInstance(type.getId());
			md.update(k0);
			outerHash = md.digest(innerHash);
		}
		
		return outerHash;
	}
}
