package ca.carleton.gcrc.security.ber.impl;

import ca.carleton.gcrc.security.ber.BerObject;
import ca.carleton.gcrc.security.ber.BerString;

public class BerStringImpl extends BerObjectImpl implements BerString {

	private String value;
	
	public BerStringImpl() {
		
	}
	
	public BerStringImpl(BerObject.TypeClass typeClass, int type) {
		super(typeClass, type);
	}
	
	@Override
	public String getValue() {
		return value;
	}

	@Override
	public void setValue(String value) {
		this.value = value;
	}

}
