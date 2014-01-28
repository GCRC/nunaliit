package ca.carleton.gcrc.security.ber.impl;

import ca.carleton.gcrc.security.ber.BerObject;

public class BerSequenceImpl extends BerConstructedImpl {

	public BerSequenceImpl() {
		super(BerObject.TypeClass.UNIVERSAL, BerObject.UniversalTypes.SEQUENCE.getCode());
	}
}
