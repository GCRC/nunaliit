package ca.carleton.gcrc.couch.app;

import java.io.OutputStream;
import java.io.Writer;

import org.json.JSONWriter;

public interface JSONLoader {
	
	void write(OutputStream stream, String charSet) throws Exception;
	
	void write(Writer writer) throws Exception;
	
	void write(JSONWriter builder) throws Exception;
}
