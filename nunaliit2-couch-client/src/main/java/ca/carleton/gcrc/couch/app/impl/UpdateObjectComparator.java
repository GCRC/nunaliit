package ca.carleton.gcrc.couch.app.impl;

import java.util.Comparator;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.json.JSONSupport;

public class UpdateObjectComparator implements Comparator<JSONObject> {
	
	static public UpdateObjectComparator getNunaliitComparator() {
		JSONObjectConverter converter = JSONObjectConverter.getConverterNunaliit();
		return new UpdateObjectComparator(converter);
	}
	
	static public UpdateObjectComparator getComparatorNoTimestamps() {
		JSONObjectConverter converter = JSONObjectConverter.getConverterNoTimestamps();
		return new UpdateObjectComparator(converter);
	}
	
	protected final Logger logger = LoggerFactory.getLogger(this.getClass());

	private JSONObjectConverter converter = null;
	
	private UpdateObjectComparator(JSONObjectConverter converter){
		this.converter = converter;
	}
	
	@Override
	public int compare(JSONObject obj1, JSONObject obj2) {
		// Compare objects based on 
	
		try {
			JSONObject cmp1 = converter.convertObject(obj1);
			JSONObject cmp2 = converter.convertObject(obj2);
			
			return JSONSupport.compare(cmp1, cmp2);
		} catch (Exception e) {
			// Can not continue but must respect interface signature
			logger.error("Error during object conversion/comparison",e);
			throw new NullPointerException();
		}
	}

}
