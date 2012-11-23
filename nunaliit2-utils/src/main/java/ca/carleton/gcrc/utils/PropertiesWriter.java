package ca.carleton.gcrc.utils;

import java.io.BufferedWriter;
import java.io.IOException;
import java.io.Writer;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;
import java.util.Properties;
import java.util.Vector;

/**
 * Instances of this class can be used to store properties found in
 * an instance of Properties to a writer. This is a replacement for
 * Properties.store(). The purpose of the replacement is to store the
 * properties in an order sorted on the keys. Also, do not output
 * time stamp. This is to facilitate comparison between two properties
 * file.
 *
 */
public class PropertiesWriter {

	private Writer writer;
	
	public PropertiesWriter(Writer writer){
		this.writer = writer;
	}
	
	public void write(Properties properties) throws IOException {
		BufferedWriter bw = new BufferedWriter(writer);

		synchronized (this) {
			List<String> propertyNames = new Vector<String>();
			for (Enumeration<Object> e = properties.keys(); e.hasMoreElements();) {
				Object keyObj = e.nextElement();
				if( keyObj instanceof String ) {
					propertyNames.add((String)keyObj);
				}
			}
			
			Collections.sort(propertyNames);

			for( String key : propertyNames ) {
				Object valObj = properties.get(key);
				if( valObj instanceof String ) {
					String val = (String)valObj;
					
					key = saveConvert(key, true);
					/*
					 * No need to escape embedded and trailing spaces for value,
					 * hence pass false to flag.
					 */
					val = saveConvert(val, false);
					bw.write(key + "=" + val);
					bw.newLine();
				}
			}
		}
		bw.flush();
	}
	
	/*
	 * Converts unicodes to encoded &#92;uxxxx and escapes special characters
	 * with a preceding slash
	 */
	private String saveConvert(String theString, boolean escapeSpace) {
		int len = theString.length();
		int bufLen = len * 2;
		if (bufLen < 0) {
			bufLen = Integer.MAX_VALUE;
		}
		StringBuffer outBuffer = new StringBuffer(bufLen);

		for (int x = 0; x < len; x++) {
			char aChar = theString.charAt(x);
			// Handle common case first, selecting largest block that
			// avoids the specials below
			if ((aChar > 61) && (aChar < 127)) {
				if (aChar == '\\') {
					outBuffer.append('\\');
					outBuffer.append('\\');
					continue;
				}
				outBuffer.append(aChar);
				continue;
			}
			switch (aChar) {
			case ' ':
				if (x == 0 || escapeSpace)
					outBuffer.append('\\');
				outBuffer.append(' ');
				break;
			case '\t':
				outBuffer.append('\\');
				outBuffer.append('t');
				break;
			case '\n':
				outBuffer.append('\\');
				outBuffer.append('n');
				break;
			case '\r':
				outBuffer.append('\\');
				outBuffer.append('r');
				break;
			case '\f':
				outBuffer.append('\\');
				outBuffer.append('f');
				break;
			case '=': // Fall through
			case ':': // Fall through
			case '#': // Fall through
			case '!':
				outBuffer.append('\\');
				outBuffer.append(aChar);
				break;
			default:
				outBuffer.append(aChar);
			}
		}
		return outBuffer.toString();
	}
}
