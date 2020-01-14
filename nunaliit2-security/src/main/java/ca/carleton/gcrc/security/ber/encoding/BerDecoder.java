package ca.carleton.gcrc.security.ber.encoding;

import java.io.ByteArrayInputStream;
import java.io.InputStreamReader;

import ca.carleton.gcrc.security.ber.BerBytes;
import ca.carleton.gcrc.security.ber.BerConstructed;
import ca.carleton.gcrc.security.ber.BerImplementation;
import ca.carleton.gcrc.security.ber.BerInteger;
import ca.carleton.gcrc.security.ber.BerObject;
import ca.carleton.gcrc.security.ber.BerString;


public class BerDecoder {

	static public BerObject decode(byte[] encoded) throws Exception {
		ByteArrayInputStream bais = new ByteArrayInputStream(encoded);
		BerInputStream berIs = new BerInputStream(bais);
		berIs.pushLimit(encoded.length);
		
		BerObject obj = decode(berIs);
		
		berIs.popLimit();
		
		return obj;
	}
	
	static public BerObject decode(BerInputStream is) throws Exception {
		BerImplementation impl = new BerImplementation();

		return decode(is, impl);
	}
	
	static public BerObject decode(BerInputStream is, BerImplementation impl) throws Exception {
		BerTag tag = BerTagEncoder.decodeTag(is);
		int length = BerLengthEncoder.decodeLength(is);
		
		BerObject result = null;
		if( tag.isConstructed() ) {
			BerConstructed constructed = impl.createConstructed(tag.getTypeClass(), tag.getType());
			result = constructed;
			
			is.pushLimit(length);
			
			while(is.getCurrentLimit() > 0) {
				BerObject child = decode(is);
				constructed.add(child);
			}
			
			is.popLimit();
		} else {
			// Primitive
			byte[] bytes = new byte[length];
			for(int loop=0; loop<length; ++loop) {
				bytes[loop] = (byte)is.read();
			}
			
			result = decodePrimitive(tag, bytes, impl);
		}
		
		return result;
	}

	private static BerObject decodePrimitive(BerTag tag, byte[] bytes, BerImplementation impl) throws Exception {
		if( tag.getTypeClass() == BerObject.TypeClass.UNIVERSAL ) {
			if( tag.getType() == BerObject.UniversalTypes.INTEGER.getCode() ) {
				return decodeInteger(tag, bytes, impl);
				
			} else if( tag.getType() == BerObject.UniversalTypes.BIT_STRING.getCode() ) {
					return decodeBytes(tag, bytes, impl);
					
			} else if( tag.getType() == BerObject.UniversalTypes.OCTECT_STRING.getCode() ) {
				return decodeBytes(tag, bytes, impl);
				
			} else if( tag.getType() == BerObject.UniversalTypes.UTF8_STRING.getCode() ) {
				return decodeUTF8String(tag, bytes, impl);
				
			} else {
				throw new Exception("Unknown decoding procedure for UNIVERSAL type: "+tag.getType());
			}
			
		} else {
			return decodeBytes(tag, bytes, impl);
		}
	}

	private static BerBytes decodeBytes(BerTag tag, byte[] bytes, BerImplementation impl) {
		BerBytes berBytes = impl.createBytes(tag.getTypeClass(), tag.getType());
		berBytes.setValue(bytes);
		return berBytes;
	}

	private static BerInteger decodeInteger(BerTag tag, byte[] bytes, BerImplementation impl) {
		BerInteger berInt = impl.createInteger(tag.getTypeClass(), tag.getType());
		
		long value = 0;
		for(int loop=0; loop<bytes.length; ++loop) {
			int byteValue = bytes[loop];
			if( byteValue < 0 ) {
				byteValue += 256;
			}
			value = (value << 8) + byteValue;
		}
		
		Long intValue = value;
		berInt.setValue(intValue);
		
		return berInt;
	}

	private static BerString decodeUTF8String(BerTag tag, byte[] bytes, BerImplementation impl) throws Exception {
		BerString berString = impl.createString(tag.getTypeClass(), tag.getType());

		ByteArrayInputStream bais = new ByteArrayInputStream(bytes);
		InputStreamReader isr = new InputStreamReader(bais,"UTF-8");
		
		StringBuilder sb = new StringBuilder();
		
		int b = isr.read();
		while( b >= 0 ) {
			sb.appendCodePoint(b);
			b = isr.read();
		}
		
		String value = sb.toString();
		berString.setValue(value);
		
		return berString;
	}
}
