package ca.carleton.gcrc.couch.onUpload.utils;

import java.util.List;
import java.util.Vector;

public final class ErrorUtils {

    public static List<Throwable> errorAndCausesAsList(Throwable e){
        List<Throwable> errors = new Vector<Throwable>();

        errors.add(e);

        // Add causes
        Throwable cause = e.getCause();
        while( null != cause && errors.indexOf(cause) < 0 ){
            errors.add(cause);
            cause = e.getCause();
        }

        return errors;
    }

}
