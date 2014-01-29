package ca.carleton.gcrc.security.ber.impl;

import ca.carleton.gcrc.security.ber.BerInteger;
import ca.carleton.gcrc.security.ber.BerObject;

public class BerIntegerImpl extends BerObjectImpl implements BerInteger {

	private Long value;
	
	public BerIntegerImpl() {
		
	}
	
	public BerIntegerImpl(BerObject.TypeClass typeClass, int type) {
		super(typeClass, type);
	}
	
	@Override
	public Long getValue() {
		return value;
	}

	@Override
	public void setValue(Long value) {
		this.value = value;
	}

}
