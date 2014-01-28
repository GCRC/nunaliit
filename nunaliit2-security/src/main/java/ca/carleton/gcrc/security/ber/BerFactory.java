package ca.carleton.gcrc.security.ber;

public interface BerFactory {

	/*
	 * Simple types 
	 */
	
	public BerConstructed createSequence();
	
	public BerString createUTF8String();
	
	public BerBytes createOctetString();
	
	public BerInteger createInteger();
	
	/*
	 * User-defined types
	 */
	
	public BerString createString(BerObject.TypeClass typeClass, int type);
	
	public BerBytes createBytes(BerObject.TypeClass typeClass, int type);
	
	public BerInteger createInteger(BerObject.TypeClass typeClass, int type);
	
	public BerConstructed createConstructed(BerObject.TypeClass typeClass, int type);
}
