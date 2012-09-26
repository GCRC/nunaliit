package ca.carleton.gcrc.couch.export;

import java.io.OutputStream;

public interface ExportFormat {

	String getMimeType();

	String getCharacterEncoding();
	
	void outputExport(OutputStream os) throws Exception;
}
