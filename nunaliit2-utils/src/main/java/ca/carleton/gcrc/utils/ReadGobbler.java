package ca.carleton.gcrc.utils;

import java.io.Reader;
import java.io.Writer;

public class ReadGobbler extends Thread {

	private Reader reader;
	private Writer writer;
	private Throwable error = null;
	
	public ReadGobbler(Reader reader, Writer writer) throws Exception {
		this.reader = reader;
		this.writer = writer;
		
		if( null == this.reader ){
			throw new Exception("A reader must be specified");
		}
		if( null == this.writer ){
			throw new Exception("A writer must be specified");
		}
	}
	
	public void run(){
		try {
			char cbuf[] = new char[1024];
			int size = reader.read(cbuf);
			while( size >= 0 ){
				writer.write(cbuf, 0, size);
				size = reader.read(cbuf);
			}
			writer.flush();
			
		} catch(Exception e) {
			// Suppress error and exit
			error = e;
		}
	}
	
	public boolean hasError(){
		return (null != error);
	}
	
	public Throwable getError(){
		return error;
	}
}
