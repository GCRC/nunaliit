package ca.carleton.gcrc.security.ber.encoding;

import java.io.InputStream;
import java.util.Stack;

public class BerInputStream {

	class StreamLimit {
		int bytesLeft;
	}
		
	private InputStream is;
	private Stack<StreamLimit> limits = new Stack<StreamLimit>();
	
	public BerInputStream(InputStream is) {
		this.is = is;
	}
	
	public int read() throws Exception {
		if( limits.size() > 0 ) {
			if( limits.peek().bytesLeft < 1 ) {
				throw new Exception("Limit reached while read BER stream");
			}
			
			limits.peek().bytesLeft = limits.peek().bytesLeft - 1;
		}
		
		int b = is.read();
		
		if( b < 0 ) {
			throw new Exception("Missing bytes while decoding BER structure");
		}
		
		return b;
	}

	public void pushLimit(int bytesLeft) throws Exception {
		if( isLimitSet() ) {
			if( getCurrentLimit() < bytesLeft ) {
				throw new Exception("Error while setting new limit");
			}
			
			limits.peek().bytesLeft = limits.peek().bytesLeft - bytesLeft;
		}
		
		StreamLimit limit = new StreamLimit();
		limit.bytesLeft = bytesLeft;
		limits.push(limit);
	}
	
	public void popLimit() throws Exception {
		if( false == isLimitSet() ) {
			throw new Exception("Trying to remove an unexisting BER stream limit");
		}
		
		StreamLimit limit = limits.pop();
		if( 0 != limit.bytesLeft ) {
			throw new Exception("Bytes left in while removing a BER stream limit");
		}
	}
	
	public boolean isLimitSet() {
		return ( limits.size() > 0 );
	}
	
	public int getCurrentLimit() {
		if( limits.size() > 0 ) {
			return limits.peek().bytesLeft;
		}
		
		return -1;
	}
}
