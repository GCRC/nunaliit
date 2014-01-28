package ca.carleton.gcrc.security.ber.encoding;


public class BerLengthEncoder {

	static public byte[] encodeLength(int length) {
		if( length <= 127 ) {
			byte[] encoded = new byte[1];
			encoded[0] = (byte)length;
			return encoded;
		}

		// Compute required size
		int size = 1;
		{
			int work = length;
			while( work != 0 ) {
				++size;
				work = work >> 8;
			}
		}
		
		// Encode
		byte[] encoded = new byte[size];
		for(int loop=size-1; loop>0; --loop) {
			encoded[loop] = (byte)(length & 0xff);
			length = length >> 8;
		}
		encoded[0] = (byte)(128 + size - 1);
		return encoded;
	}
	
	static public int decodeLength(BerInputStream is) throws Exception {
		
		int b = is.read();
		if( b < 0 ) {
			throw new Exception("Reached end of stream while reading length");
		}
		
		if( b < 0x80 ) {
			return b;
		}
		
		int len = 0;
		int size = b & 0x7f;
		for(int loop=0; loop<size; ++loop) {
			b = is.read();
			if( b < 0 ) {
				throw new Exception("Reached end of stream while reading multiple bytes of a length");
			}
			len = (len << 8) + b;
		}
		
		return len;
	}
}
