package ca.carleton.gcrc.exception;

/**
 * Exception that should be used throughout Nunaliit instead of the generic Exception.
 */
public class NunaliitException extends Exception {
    public NunaliitException(String s, Throwable throwable) {
        super(s, throwable);
    }
}
