package ca.carleton.gcrc.couch.simplifiedGeometry;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintStream;
import java.io.StringWriter;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;

import junit.framework.TestCase;

public class GZipTest extends TestCase {
	
	static public void showBytes(OutputStream os, byte[] bytes){
		PrintStream ps = new PrintStream(os);
		
		boolean first = true;
		for(byte b : bytes){
			if( first ){
				first = false;
			} else {
				ps.print(" ");
			}
			
			String s = String.format("%1$02x", b);
			ps.print(s);
		}
	}

	public void testGZipOutputStream() throws Exception {
		ByteArrayOutputStream baos = new ByteArrayOutputStream();
		OutputStream os = new GZIPOutputStream(baos);
		PrintStream ps = new PrintStream(os);
		
		String expected = "Test";
		ps.print(expected);
		ps.flush();
		ps.close();
		
		byte[] bytes = baos.toByteArray();
		showBytes(System.out, bytes);
		System.out.println();
		
		ByteArrayInputStream bais = new ByteArrayInputStream(bytes);
		InputStream is = new GZIPInputStream(bais);
		StringWriter sw = new StringWriter();
		int c = is.read();
		while( c >= 0 ){
			sw.write(c);
			c = is.read();
		}
		sw.flush();
		
		if( false == expected.equals( sw.toString() ) ){
			fail("Unexpected result: "+sw.toString());
		}
	}
	
	public void testCompressionRate() throws Exception {
		String input = "test";
		
		// Load example
		{
			InputStream is = GZipTest.class.getClassLoader().getResourceAsStream("wkt_0.txt");
			StringWriter sw = new StringWriter();
			int c = is.read();
			while( c >= 0 ){
				sw.write(c);
				c = is.read();
			}
			sw.flush();
			is.close();
			
			input = sw.toString();
		}
		

		ByteArrayOutputStream baos = new ByteArrayOutputStream();
		OutputStream os = new GZIPOutputStream(baos);
		PrintStream ps = new PrintStream(os);
		
		ps.print(input);
		ps.flush();
		ps.close();
		
		byte[] bytes = baos.toByteArray();
		
		System.out.println("Input:"+input.length()+" Output:"+bytes.length
				+" Ratio:"+((double)bytes.length/(double)input.length()));
	}
}
