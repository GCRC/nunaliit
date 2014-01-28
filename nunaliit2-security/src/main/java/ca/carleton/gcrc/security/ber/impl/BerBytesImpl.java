package ca.carleton.gcrc.security.ber.impl;

import ca.carleton.gcrc.security.ber.BerBytes;
import ca.carleton.gcrc.security.ber.BerObject;

public class BerBytesImpl extends BerObjectImpl implements BerBytes {

	private byte[] value; 
	
	public BerBytesImpl() {
		
	}
	
	public BerBytesImpl(BerObject.TypeClass typeClass, int type) {
		super(typeClass, type);
	}
	
	@Override
	public byte[] getValue() {
		return value;
	}

	@Override
	public void setValue(byte[] value) {
		this.value = value;
	}

}
