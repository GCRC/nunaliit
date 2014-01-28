package ca.carleton.gcrc.security.ber.encoding;

import ca.carleton.gcrc.security.ber.BerObject;

public class BerTagEncoder {
	
	static private byte convertTypeClass(BerObject.TypeClass typeClass) {
		if( typeClass == BerObject.TypeClass.UNIVERSAL ) {
			return 0x00;
		}
		if( typeClass == BerObject.TypeClass.APPLICATION ) {
			return 0x40;
		}
		if( typeClass == BerObject.TypeClass.CONTEXT_SPECIFIC ) {
			return (byte)0x80;
		}
		// PRIVATE
		return (byte)0xC0;
	}

	static public byte[] encodeTag(BerObject.TypeClass typeClass, boolean constructed, int type) {
		if( type < 31 ) {
			// One byte encoding
			
			byte[] encoded = new byte[1];
			
			encoded[0] = (byte)(convertTypeClass(typeClass) + type);
			if( constructed ) {
				encoded[0] = (byte)(encoded[0] + 0x20);
			}
			
			return encoded;
		}
		
		// Multibyte...
		
		// ... count number of bytes
		int size = 1;
		{
			int work = type;
			while( work != 0 ) {
				++size;
				work = work >> 7;
			}
		}
		
		byte[] encoded = new byte[size];
		
		encoded[0] = (byte)(convertTypeClass(typeClass) + 0x1f);
		if( constructed ) {
			encoded[0] = (byte)(encoded[0] + 0x20);
		}
		
		for(int loop=size-1; loop>0; --loop) {
			encoded[loop] = (byte)(type & 0x7f);
			if( loop != size-1 ) {
				encoded[loop] = (byte)(encoded[loop] + 0x80);
			}
			type = type >> 7;
		}
		
		return encoded;
	}

	static public byte[] encodeTag(BerObject obj) {
		return encodeTag(obj.getTypeClass(), obj.isTypeConstructed(), obj.getType());
	}
	
	static public BerTag decodeTag(BerInputStream is) throws Exception {
		
		int b = is.read();

		BerObject.TypeClass typeClass = null;
		switch(b & 0xc0) {
		case 0x00:
			typeClass = BerObject.TypeClass.UNIVERSAL;
			break;
		case 0x40:
			typeClass = BerObject.TypeClass.APPLICATION;
			break;
		case 0x80:
			typeClass = BerObject.TypeClass.CONTEXT_SPECIFIC;
			break;
		default:
			typeClass = BerObject.TypeClass.PRIVATE;
		}
		
		boolean constructed = false;
		if( (b & 0x20) != 0 ) {
			constructed = true;
		}
		
		int type = b & 0x1f;

		if( type == 0x1f ) {
			// Multi-byte type
			type = 0;
			do {
				b = is.read();
				type = type << 7;
				type = type + (b & 0x7f);
			} while((b & 0x80) != 0);
		}
		
		BerTag tag = new BerTag(typeClass, constructed, type);
		return tag;
	}
}
