package ca.carleton.gcrc.olkit.multimedia.converter;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

public class ExifData {

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
}
