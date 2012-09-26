package ca.carleton.gcrc.couch.app;

import java.io.InputStream;

/**
 * Represents an attachment to a Document
 *
 */
public interface Attachment {

	String getName();
	
	InputStream getInputStream() throws Exception;

	String getContentType() throws Exception;

	long getSize() throws Exception;
}
