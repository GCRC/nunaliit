package ca.carleton.gcrc.couch.app;

import java.io.ByteArrayInputStream;
import java.io.StringWriter;

import ca.carleton.gcrc.couch.app.impl.Base64Transcoder;

import junit.framework.TestCase;

public class Base64TranscoderTest extends TestCase {
	
	public void verify(byte[] input, String expectedOutput) throws Exception {
		ByteArrayInputStream bais = new ByteArrayInputStream(input);
		StringWriter sw = new StringWriter();

		Base64Transcoder.encode(bais, sw);
		
		String outputString = sw.toString();

		if( null == expectedOutput && null == outputString ){
			// OK
		} else if( null == expectedOutput ){
			fail("Unexpected output");
		} else if( false == expectedOutput.equals(outputString) ){
			fail("Unexpected output");
		}
	}

	public void testEncodeZeroByte() throws Exception {
		byte[] input = new byte[0];
		verify(input, "");
	}

	public void testEncodeOneByte() throws Exception {
		byte[] input = new byte[]{(byte)0};
		verify(input, "AA==");
	}

	public void testEncodeTwoBytes() throws Exception {
		byte[] input = new byte[]{(byte)0,(byte)0};
		verify(input, "AAA=");
	}

	public void testEncodeThreeBytes() throws Exception {
		byte[] input = new byte[]{(byte)0,(byte)0,(byte)0};
		verify(input, "AAAA");
	}

	public void testEncodeFourBytes() throws Exception {
		byte[] input = new byte[]{(byte)0,(byte)0,(byte)0,(byte)0xff};
		verify(input, "AAAA/w==");
	}

	public void testEncodeFiveBytes() throws Exception {
		byte[] input = new byte[]{(byte)0,(byte)0,(byte)0,(byte)0xff,(byte)0xff};
		verify(input, "AAAA//8=");
	}

	public void testEncodeSixBytes() throws Exception {
		byte[] input = new byte[]{(byte)0,(byte)0,(byte)0,(byte)0xff,(byte)0xff,(byte)0xff};
		verify(input, "AAAA////");
	}
}
