package ca.carleton.gcrc.olkit.multimedia.xmp;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;

import com.adobe.xmp.XMPMeta;
import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Directory;
import com.drew.metadata.Metadata;
import com.drew.metadata.xmp.XmpDirectory;

public class XmpExtractor {

	static public XmpInfo extractXmpInfo(File file) throws Exception {
		FileInputStream fis = null;
		BufferedInputStream bis = null;
		try {
			fis = new FileInputStream(file);
			bis = new BufferedInputStream(fis);
			Metadata metadata = ImageMetadataReader.readMetadata(bis, true);
			for (Directory directory : metadata.getDirectories()) {
			    if( directory instanceof XmpDirectory ){
			    	XmpDirectory xmpDirectory = (XmpDirectory)directory;
			    	XMPMeta meta = xmpDirectory.getXMPMeta();
			    	
			    	if( null != meta ){
			    		return new XmpInfoMeta(meta);
			    	}
			    }
			}			
		} catch(Exception e) {
			// throw new Exception("Error reading XMP Data", e);
			// Ignore. Most likely, tool is not able to read the file
			
		} finally {
			if( null != bis ){
				try {
					bis.close();
					bis = null;
				} catch(Exception e) {
					// Ignore
				}
			}
			if( null != fis ){
				try {
					fis.close();
					fis = null;
				} catch(Exception e) {
					// Ignore
				}
			}
		}
		
		return null;
	}
}
