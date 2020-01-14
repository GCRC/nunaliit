package ca.carleton.gcrc.security.ber;

public interface BerInteger extends BerObject {

    Long getValue();

    void setValue(Long value);
}
