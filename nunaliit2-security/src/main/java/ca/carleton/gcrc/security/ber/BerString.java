package ca.carleton.gcrc.security.ber;

public interface BerString extends BerObject {

	public String getValue();
	public void setValue(String value);
}
