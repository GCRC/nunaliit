package ca.carleton.gcrc.security.ber;

import ca.carleton.gcrc.security.ber.BerObject.TypeClass;
import ca.carleton.gcrc.security.ber.impl.BerConstructedImpl;
import ca.carleton.gcrc.security.ber.impl.BerSequenceImpl;
import ca.carleton.gcrc.security.ber.impl.BerStringImpl;
import ca.carleton.gcrc.security.ber.impl.BerUTF8StringImpl;
import ca.carleton.gcrc.security.ber.impl.BerBytesImpl;
import ca.carleton.gcrc.security.ber.impl.BerIntegerImpl;
import ca.carleton.gcrc.security.ber.impl.BerOctetStringImpl;


public class BerImplementation implements BerFactory {

	@Override
	public BerConstructed createSequence() {
		return new BerSequenceImpl();
	}

	@Override
	public BerString createUTF8String() {
		return new BerUTF8StringImpl();
	}

	@Override
	public BerConstructed createConstructed(BerObject.TypeClass typeClass, int type) {
		return new BerConstructedImpl(typeClass, type);
	}

	@Override
	public BerString createString(BerObject.TypeClass typeClass, int type) {
		return new BerStringImpl(typeClass, type);
	}

	@Override
	public BerBytes createBytes(TypeClass typeClass, int type) {
		return new BerBytesImpl(typeClass, type);
	}

	@Override
	public BerInteger createInteger() {
		return new BerIntegerImpl(BerObject.TypeClass.UNIVERSAL, BerObject.UniversalTypes.INTEGER.getCode());
	}

	@Override
	public BerInteger createInteger(TypeClass typeClass, int type) {
		return new BerIntegerImpl(typeClass, type);
	}

	@Override
	public BerBytes createOctetString() {
		return new BerOctetStringImpl();
	}

	
}
