package ca.carleton.gcrc.security.ber.impl;

import ca.carleton.gcrc.security.ber.BerObject;

public class BerOctetStringImpl extends BerBytesImpl {

	public BerOctetStringImpl() {
		super(BerObject.TypeClass.UNIVERSAL, BerObject.UniversalTypes.OCTECT_STRING.getCode());
	}
}
