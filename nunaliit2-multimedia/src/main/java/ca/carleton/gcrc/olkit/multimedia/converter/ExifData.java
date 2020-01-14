package ca.carleton.gcrc.olkit.multimedia.converter;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ExifData {

	static private Pattern regRationalString = Pattern.compile("\\s*([0-9]+)\\s*/\\s*([0-9]+)\\s*");
	
	private Map<String,String> rawData = new HashMap<String,String>();
	
	public int getSize() {
		return rawData.size();
	}
	
	public void addRawData(String key, String value){
		rawData.put(key, value);
	}

	public String getRawData(String key){
		return rawData.get(key);
	}
	
	public Collection<String> getKeys(){
		return rawData.keySet();
	}
	
	public boolean containsKey(String key){
		return rawData.containsKey(key);
	}

	public boolean containsLongLat() {
		Double dLong = computeLong();
		Double dLat = computeLat();
		
		return (dLong != null && dLat != null);
	}

	public Double computeLong() {
		String ref = rawData.get("GPSLongitudeRef");
		String value = rawData.get("GPSLongitude");
		
		Double result = null;
		
		if( ref != null && value != null ){
			double refMult = 0.0;
			if( "w".equalsIgnoreCase(ref) ){
				refMult = -1.0;
			} else if( "e".equalsIgnoreCase(ref) ){
				refMult = 1.0;
			} else {
				return null;
			}
			
			result = parseDegMinSecString(value);
			if( null != result ) {
				result = result * refMult;
			}
		}
		
		return result;
	}

	public Double computeLat() {
		String ref = rawData.get("GPSLatitudeRef");
		String value = rawData.get("GPSLatitude");
		
		Double result = null;
		
		if( ref != null && value != null ){
			double refMult = 0.0;
			if( "n".equalsIgnoreCase(ref) ){
				refMult = 1.0;
			} else if( "s".equalsIgnoreCase(ref) ){
				refMult = -1.0;
			} else {
				return null;
			}
			
			result = parseDegMinSecString(value);
			if( null != result ) {
				result = result * refMult;
			}
		}
		
		return result;
	}
	
	public boolean isKnownPhotosphereCamera(){
		String model = rawData.get("Model");
		
		if( "RICOH THETA".equalsIgnoreCase(model) ){
			return true;
		}
		
		return false;
	}
	
	private Double parseDegMinSecString(String value){
		String[] values = value.split(",");
		
		if( values.length < 1 ){
			return null;
		}
		
		double result = 0.0;
		if( values.length > 0 ){
			Double deg = parseRationalString( values[0].trim() );
			if( null == deg ){
				return null;
			}
			result = result + deg;
		}
		if( values.length > 1 ){
			Double min = parseRationalString( values[1].trim() );
			if( null == min ){
				return null;
			}
			result = result + (min / 60.0);
		}
		if( values.length > 2 ){
			Double sec = parseRationalString( values[2].trim() );
			if( null == sec ){
				return null;
			}
			result = result + (sec / 3600.0);
		}
		
		return result;
	}

	private Double parseRationalString(String rationalStr) {
		Matcher matcherRational = regRationalString.matcher(rationalStr);
		
		if( matcherRational.find() ){
			int top = Integer.parseInt(matcherRational.group(1));
			int divisor = Integer.parseInt(matcherRational.group(2));
			
			if( divisor == 0 ) {
				return null;
			}
			
			return (double) top / (double) divisor;
		}

		return null;
	}
}
