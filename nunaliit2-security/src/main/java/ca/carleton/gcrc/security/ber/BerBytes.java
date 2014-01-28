package ca.carleton.gcrc.security.ber;

public interface BerBytes extends BerObject {

	public byte[] getValue();
	public void setValue(byte[] value);
}
