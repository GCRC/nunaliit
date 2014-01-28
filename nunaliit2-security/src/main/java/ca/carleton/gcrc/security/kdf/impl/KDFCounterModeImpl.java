package ca.carleton.gcrc.security.kdf.impl;

import java.io.ByteArrayOutputStream;

import ca.carleton.gcrc.security.kdf.HMACGenerator;
import ca.carleton.gcrc.security.kdf.KDFCounterMode;

public class KDFCounterModeImpl implements KDFCounterMode {

	/**
	 * Size of counter, in bytes
	 */
	private int r;
	/**
	 * Size of length, in bytes
	 */
	private int s;
	private HMACGenerator hmacGenerator;

	public KDFCounterModeImpl(){
		r = 4;
		s = 4;
		hmacGenerator = new HMACGeneratorImpl(HMACGeneratorImpl.Type.SHA384);
	}

	public KDFCounterModeImpl(int r, HMACGenerator hmacGenerator){
		this.r = r;
		this.s = 4;
		this.hmacGenerator = hmacGenerator;
	}

	public KDFCounterModeImpl(int r, int s, HMACGenerator hmacGenerator){
		this.r = r;
		this.s = s;
		this.hmacGenerator = hmacGenerator;
	}
	
	@Override
	public byte[] deriveKey(
			byte[] productionKey
			,byte[] label
			,byte[] context
			,int lengthInBytes
			) throws Exception {
		
		// L is output length in bits
		int l = lengthInBytes * 8;
		if( s > 0 ){
			int temp = l;
			for(int i=0; i<s; ++i){
				temp = temp >> 8;
			}
			if( temp > 0 ){
				throw new Exception("KDF in Counter Mode: Requested number of bits too large for size of length");
			}
		}
		
		// Step 1: Compute n, the number of required iteration
		int prfOutputInBytes = hmacGenerator.getOutputSizeInBytes();
		int n = lengthInBytes / prfOutputInBytes;
		if( (lengthInBytes % prfOutputInBytes) > 0 ){
			++n;
		}
		
		// Step 2: check that n <= 2^r -1
		{
			int temp = n;
			for(int i=0; i<r; ++i){
				temp = temp >> 8;
			}
			if( temp > 0 ){
				throw new Exception("KDF in Counter Mode: Too many iterations required for the counter size");
			}
		}
		
		// Compute [i]2 || Label || 0x00 || Context || [L]2
		byte[] fixed = null;
		{
			ByteArrayOutputStream baos = new ByteArrayOutputStream();
			
			for(int i=0; i<r; ++i){
				baos.write(0); // reserve space for [i]2
			}
			
			// Label
			if( null != label &&  label.length > 0 ){
				baos.write(label);
			}
			
			// 0x00
			if( s > 0 ) {
				baos.write(0);
			}
			
			// Context
			if( null != context &&  context.length > 0 ){
				baos.write(context);
			}
			
			// [L]2
			for(int i=s-1;i>=0;--i){
				baos.write( (l>>(i*8)) & 0xff );
			}
			
			fixed = baos.toByteArray();
		}

		// Step 3: result(0) := (empty) 
		byte[] ko = new byte[lengthInBytes];
		int koIndex = 0;
		
		// Step 4: For i = 1 to n
		for(int i=1; i<=n; ++i){
			// Install [i]2 in fixed buffer
			{
				int index = r - 1;
				int temp = i;
				for( ; index >= 0; --index){
					fixed[index] = (byte)(temp & 0xff);
					temp = temp >> 8;
				}
			}
			
			// Step 4a: K(i) := PRF (KI, [i]2 || Label || 0x00 || Context || [L]2) 
			byte[] ki = hmacGenerator.computeHMAC(productionKey, fixed);
			
			// Step 4b: result(i) := result(i-1) || K(i). 
			for(int j=0; j<ki.length && koIndex<lengthInBytes; ++j){
				ko[koIndex++] = ki[j];
			}
		}
		
		// Step 5: Return: KO := the leftmost L bits of result(n)
		return ko;
	}

}
