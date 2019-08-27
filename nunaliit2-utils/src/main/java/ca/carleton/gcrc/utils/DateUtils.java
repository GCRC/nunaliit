package ca.carleton.gcrc.utils;

import java.util.Date;
import java.util.GregorianCalendar;
import java.util.SimpleTimeZone;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class DateUtils {

	static final public Pattern patternTime = Pattern.compile("^(\\d+)-(\\d+)-(\\d+)T(\\d+):(\\d+):(\\d+)\\.\\d+Z$");

	/**
	 * Parses a GPS timestamp with a 1 second precision.
	 * @param gpsTimestamp String containing time stamp
	 * @return A date, precise to the second, representing the given timestamp.
	 * @throws Exception
	 */
	static public Date parseGpsTimestamp(String gpsTimestamp) throws Exception {
		try {
			Matcher matcherTime = patternTime.matcher(gpsTimestamp);
			if( matcherTime.matches() ) {
				int year = Integer.parseInt( matcherTime.group(1) );
				int month = Integer.parseInt( matcherTime.group(2) );
				int day = Integer.parseInt( matcherTime.group(3) );
				int hour = Integer.parseInt( matcherTime.group(4) );
				int min = Integer.parseInt( matcherTime.group(5) );
				int sec = Integer.parseInt( matcherTime.group(6) );

				GregorianCalendar cal = new GregorianCalendar(year, month-1, day, hour, min, sec);
				cal.setTimeZone( new SimpleTimeZone(SimpleTimeZone.UTC_TIME, "UTC") );
				Date date = cal.getTime();

				return date;
			}
			
			throw new Exception("Unrecognizd GPS timestamp: "+gpsTimestamp);

		} catch (Exception e) {
			throw new Exception("Error parsing GPS  timestamp", e);
		}
	}
}
