package ca.carleton.gcrc.utils;

import java.util.Date;

import junit.framework.TestCase;

public class DateUtilsTest extends TestCase {

	public void testParseGpsTimestamp() throws Exception {
		String gpsTimestamp = "2017-08-01T18:47:15.288564Z";
		long expectedLow = 1501613234000L;
		long expectedHigh = 1501613236000L;
		
		Date date = DateUtils.parseGpsTimestamp(gpsTimestamp);
		long timeMs = date.getTime();

		if( timeMs > expectedHigh || timeMs < expectedLow ) {
			fail("Unexpected time: "+timeMs);
		}
	}
}
