package ca.carleton.gcrc.security.ber;

public interface BerInteger extends BerObject {

	public Long getValue();
	public void setValue(Long value);
	
}
