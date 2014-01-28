package ca.carleton.gcrc.security.ber.impl;

import ca.carleton.gcrc.security.ber.BerObject;

public class BerObjectImpl implements BerObject {

	private BerObject.TypeClass typeClass;
	private int type;
	
	public BerObjectImpl() {
		
	}
	
	public BerObjectImpl(BerObject.TypeClass typeClass, int type) {
		this.typeClass = typeClass;
		this.type = type;
	}
	
	public TypeClass getTypeClass() {
		return typeClass;
	}
	public void setTypeClass(TypeClass typeClass) {
		this.typeClass = typeClass;
	}
	
	public int getType() {
		return type;
	}
	public void setType(int type) {
		this.type = type;
	}
	
	@Override
	public boolean isTypeConstructed() {
		return false;
	}

}
