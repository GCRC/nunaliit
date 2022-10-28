package ca.carleton.gcrc.utils;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.Reader;
import java.io.Writer;

public class StreamUtils {
	
	static final public int DEFAULT_TRANSFER_BUFFER_SIZE = 4096;

	/**
	 * Copy all the bytes from an input stream to an output stream.
	 * @param is Stream to read bytes from
	 * @param os Stream to write bytes to
	 * @throws IOException
	 */
	static public void copyStream(InputStream is, OutputStream os) throws IOException {
		copyStream(is, os, DEFAULT_TRANSFER_BUFFER_SIZE);
	}

	/**
	 * Copy all the bytes from an input stream to an output stream.
	 * @param is Stream to read bytes from
	 * @param os Stream to write bytes to
	 * @param transferBufferSize Size of buffer used to transfer bytes from 
	 *                           one stream to the other
	 * @throws IOException
	 */
	static public void copyStream(InputStream is, OutputStream os, int transferBufferSize) throws IOException {
		if( transferBufferSize < 1 ) {
			throw new IOException("Transfer buffer size can not be smaller than 1");
		}

		byte[] buffer = new byte[transferBufferSize];

		int bytesRead = is.read(buffer);
		while( bytesRead >= 0 ) {
			os.write(buffer, 0, bytesRead);

			bytesRead = is.read(buffer);
		}
	}

	/**
	 * Copy all the characters from a reader to a writer.
	 * @param reader Input character stream
	 * @param writer Output character stream
	 * @throws IOException
	 */
	static public void copyStream(Reader reader, Writer writer) throws IOException {
		copyStream(reader, writer, DEFAULT_TRANSFER_BUFFER_SIZE);
	}

	/**
	 * Copy all the characters from a reader to a writer.
	 * @param reader Input character stream
	 * @param writer Output character stream
	 * @param transferBufferSize Size of character buffer used to transfer characters from 
	 *                           one stream to the other
	 * @throws IOException
	 */
	static public void copyStream(Reader reader, Writer writer, int transferBufferSize) throws IOException {
		if( transferBufferSize < 1 ) {
			throw new IOException("Transfer buffer size can not be smaller than 1");
		}

		char[] buffer = new char[transferBufferSize];

		int bytesRead = reader.read(buffer);
		while( bytesRead >= 0 ) {
			writer.write(buffer, 0, bytesRead);
			bytesRead = reader.read(buffer);
		}
	}
}
