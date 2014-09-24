package ca.carleton.gcrc.olkit.multimedia.xmp;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.util.Map;

import com.adobe.xmp.XMPIterator;
import com.adobe.xmp.XMPMeta;
import com.adobe.xmp.properties.XMPPropertyInfo;
import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Directory;
import com.drew.metadata.Metadata;
import com.drew.metadata.xmp.XmpDirectory;

import ca.carleton.gcrc.olkit.multimedia.utils.TestConfiguration;
import junit.framework.TestCase;

public class XmpTest extends TestCase {

	public void testXmpParse() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		File panoFile = TestConfiguration.getTestFile("pano.jpg");
		
		FileInputStream fis = null;
		try {
			fis = new FileInputStream(panoFile);
			BufferedInputStream bis = new BufferedInputStream(fis);
			Metadata metadata = ImageMetadataReader.readMetadata(bis, true);
			for (Directory directory : metadata.getDirectories()) {
			    if( directory instanceof XmpDirectory ){
			    	XmpDirectory xmpDirectory = (XmpDirectory)directory;
			    	XMPMeta meta = xmpDirectory.getXMPMeta();
			    	
			    	XMPIterator iterator = meta.iterator();
			    	while( iterator.hasNext() ) {
						XMPPropertyInfo propInfo = (XMPPropertyInfo) iterator.next();
						String path = propInfo.getPath();
						String value = propInfo.getValue();
						String ns = propInfo.getNamespace();
						if( path != null && value != null ) {
							System.out.println(""+path+" => "+value+" "+ns);
						}
			        }
			    }
			}			
		} catch(Exception e) {
			throw new Exception("Error reading XMP Data", e);
			
		} finally {
			if( null != fis ){
				try {
					fis.close();
					fis = null;
				} catch(Exception e) {
					// Ignore
				}
			}
		}
	}
	
	public void testExtractXmpInfo() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		File panoFile = TestConfiguration.getTestFile("pano.jpg");
		XmpInfo info = XmpExtractor.extractXmpInfo(panoFile);
		
		Map<String,String> props = info.getProperties();
		
		if( false == "equirectangular".equals(props.get("GPano:ProjectionType")) ){
			fail("Unexpected value");
		}
	}

}
