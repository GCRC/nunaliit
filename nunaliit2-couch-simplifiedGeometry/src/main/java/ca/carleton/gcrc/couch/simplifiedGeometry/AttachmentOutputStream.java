package ca.carleton.gcrc.couch.simplifiedGeometry;

import java.io.IOException;
import java.io.OutputStream;

public class AttachmentOutputStream extends OutputStream {

	private OutputStream sink = null;
	private boolean escapingString = false;
	private int count = 0;
	
	public AttachmentOutputStream(OutputStream sink){
		this.sink = sink;
	}
	
	@Override
	public void write(int b) throws IOException {
		if( escapingString ){
			if( '"' == b ){
				sink.write('\\');
				sink.write('"');
				
			} else if( '\\' == b ){
				sink.write('\\');
				sink.write('\\');
			
			} else {
				sink.write(b);
			}
			
		} else {
			sink.write(b);
		};
		++count;
	}

	@Override
	public void close() throws IOException {
		sink.close();
	}

	@Override
	public void flush() throws IOException {
		sink.flush();
	}

	public boolean isEscapingString() {
		return escapingString;
	}

	public void setEscapingString(boolean escapingString) {
		this.escapingString = escapingString;
	}

	public int getCount() {
		return count;
	}

	public void setCount(int count) {
		this.count = count;
	}

}
