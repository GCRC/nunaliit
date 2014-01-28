package ca.carleton.gcrc.security.ber.impl;

import ca.carleton.gcrc.security.ber.BerInteger;
import ca.carleton.gcrc.security.ber.BerObject;

public class BerIntegerImpl extends BerObjectImpl implements BerInteger {

	private Integer value;
	
	public BerIntegerImpl() {
		
	}
	
	public BerIntegerImpl(BerObject.TypeClass typeClass, int type) {
		super(typeClass, type);
	}
	
	@Override
	public Integer getValue() {
		return value;
	}

	@Override
	public void setValue(Integer value) {
		this.value = value;
	}

}
