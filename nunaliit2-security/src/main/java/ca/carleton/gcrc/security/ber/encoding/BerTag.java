package ca.carleton.gcrc.security.ber.encoding;

import ca.carleton.gcrc.security.ber.BerObject;

public class BerTag {
	private BerObject.TypeClass typeClass;
	private boolean constructed;
	private int type;

	public BerTag(BerObject.TypeClass typeClass, boolean constructed, int type) {
		this.typeClass = typeClass;
		this.constructed = constructed;
		this.type = type;
	}
	
	public BerObject.TypeClass getTypeClass() {
		return typeClass;
	}

	public boolean isConstructed() {
		return constructed;
	}

	public int getType() {
		return type;
	}

}
