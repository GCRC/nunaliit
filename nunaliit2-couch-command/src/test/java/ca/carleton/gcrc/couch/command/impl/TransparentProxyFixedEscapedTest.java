package ca.carleton.gcrc.couch.command.impl;

import junit.framework.TestCase;

public class TransparentProxyFixedEscapedTest extends TestCase {

	private void performUriUnescapeTest(String in, String expected){
		String out = TransparentProxyFixedEscaped.unescapeUriString(in);
		if( null == out ){
			out = in;
		}
		if( false == expected.equals(out) ){
			fail("Unescape error. Observed: "+out+" Expected: "+expected);
		}
	}
	
	public void testUnescapeUri(){
		performUriUnescapeTest(
			"http://127.0.0.1:5984/_design%2fatlas/aaa?key=%22jen%22", 
			"http://127.0.0.1:5984/_design/atlas/aaa?key=%22jen%22");
		performUriUnescapeTest(
			"http://127.0.0.1:5984/text-lookahead?startkey=%5B%22jen%22%2Cnull%5D&endkey=%5B%22jen%E9%A6%99%22%2C%7B%7D%5D", 
			"http://127.0.0.1:5984/text-lookahead?startkey=%5B%22jen%22%2Cnull%5D&endkey=%5B%22jen%E9%A6%99%22%2C%7B%7D%5D");
	}
}
