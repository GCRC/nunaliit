package ca.carleton.gcrc.security.ber.impl;

import ca.carleton.gcrc.security.ber.BerObject;

public class BerUTF8StringImpl extends BerStringImpl {

	public BerUTF8StringImpl() {
		super(BerObject.TypeClass.UNIVERSAL, BerObject.UniversalTypes.UTF8_STRING.getCode());
	}
}
