package ca.carleton.gcrc.couch.export.records;

import java.io.IOException;
import java.io.Reader;
import java.io.BufferedReader;

import org.json.JSONTokener;

public class JSONArrayReaderIterator {

	private BufferedReader reader;
	private JSONTokener tokener;
	private boolean first = true;
	
	public JSONArrayReaderIterator(Reader in) throws Exception {
		reader = new BufferedReader(in);
		tokener = new JSONTokener(reader);
		
		// Dequeue '['
		skipWhiteSpace();
		int c = reader.read();
		if( '[' != c ){
			throw new Exception("First character in stream should be '['");
		}
	}
	
	public boolean hasNext() throws IOException {
		if( first ){
			boolean hasNext = true;
			try {
				skipWhiteSpace();
				reader.mark(1);
				int c = reader.read();
				if( ']' == c ){
					hasNext = false;
				}
				reader.reset();
			} catch (Exception e) {
				throw new IOException("Error while testing hasNext() on first call",e);
			}
			return hasNext;
		} else {
			boolean hasNext = false;
			try {
				skipWhiteSpace();
				reader.mark(1);
				int c = reader.read();
				if( ',' == c ){
					hasNext = true;
				}
				reader.reset();
			} catch (Exception e) {
				throw new IOException("Error while testing hasNext() on subsequent calls",e);
			}
			return hasNext;
		}
	}

	public Object next() throws IOException {
		Object value = null;

		try {
			boolean hasNext = hasNext();
			if( hasNext ){
				if( first ){
					first = false;
				} else {
					// Dequeue ','
					int c = reader.read();
					if( ',' != c ){
						throw new IOException("Expected ',' character");
					}
				}

				skipWhiteSpace();
				
				value = tokener.nextValue();
			}
		} catch (Exception e) {
			throw new IOException("Error while parsing JSONArray reader",e);
		}
		
		return value;
	}

	private void skipWhiteSpace() throws IOException {
		reader.mark(1);
		int c = reader.read();
		while( ' ' == c 
		 || '\t' == c 
		 || '\n' == c 
		 || '\r' == c ){
			c = reader.read();
		}
		reader.reset();
	}
}
