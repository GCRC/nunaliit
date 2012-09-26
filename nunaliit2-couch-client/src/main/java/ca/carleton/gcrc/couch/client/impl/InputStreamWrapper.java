package ca.carleton.gcrc.couch.client.impl;

import java.io.IOException;
import java.io.InputStream;

public class InputStreamWrapper extends InputStream {

	private InputStream wrapped;
	
	public InputStreamWrapper(InputStream wrapped){
		
	}
	
	@Override
	public int read() throws IOException {
		return wrapped.read();
	}

	@Override
	public int available() throws IOException {
		return wrapped.available();
	}

	@Override
	public void close() throws IOException {
		wrapped.close();
	}

	@Override
	public synchronized void mark(int readlimit) {
		wrapped.mark(readlimit);
	}

	@Override
	public boolean markSupported() {
		return wrapped.markSupported();
	}

	@Override
	public int read(byte[] b, int off, int len) throws IOException {
		return wrapped.read(b, off, len);
	}

	@Override
	public int read(byte[] b) throws IOException {
		return wrapped.read(b);
	}

	@Override
	public synchronized void reset() throws IOException {
		wrapped.reset();
	}

	@Override
	public long skip(long n) throws IOException {
		return wrapped.skip(n);
	}

}
