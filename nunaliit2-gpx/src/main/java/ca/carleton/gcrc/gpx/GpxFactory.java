package ca.carleton.gcrc.gpx;

import java.io.File;

import javax.xml.bind.JAXBContext;
import javax.xml.bind.Unmarshaller;

import ca.carleton.gcrc.gpx._10.Gpx10;
import ca.carleton.gcrc.gpx._11.Gpx11;

public class GpxFactory {

	public Gpx loadFromFile(File file) throws Exception {
		
		// Try 1.0
		try {
			JAXBContext jc10 = JAXBContext.newInstance("com.topografix.gpx._1._0");
			Unmarshaller unmarshaller = jc10.createUnmarshaller();
			Object result = unmarshaller.unmarshal(file);
			
			return new Gpx10( (com.topografix.gpx._1._0.Gpx)result );
		} catch(Exception e) {
			// Ignore.
		}
		
		// Try 1.1
		try {
			JAXBContext jc11 = JAXBContext.newInstance("com.topografix.gpx._1._1");
			Unmarshaller unmarshaller = jc11.createUnmarshaller();
			Object result = unmarshaller.unmarshal(file);
			
			return new Gpx11( (com.topografix.gpx._1._1.GpxType)result );
		} catch(Exception e) {
			throw new Exception("Unable to unmarshall file "+file.getAbsolutePath(), e);
		}
	}
	
}
