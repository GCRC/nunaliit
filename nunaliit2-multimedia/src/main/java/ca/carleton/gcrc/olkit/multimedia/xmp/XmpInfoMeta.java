package ca.carleton.gcrc.olkit.multimedia.xmp;

import java.util.HashMap;
import java.util.Map;

import com.adobe.internal.xmp.XMPIterator;
import com.adobe.internal.xmp.XMPMeta;
import com.adobe.internal.xmp.properties.XMPPropertyInfo;

public class XmpInfoMeta implements XmpInfo {

	private XMPMeta meta;
	
	public XmpInfoMeta(XMPMeta meta) {
		this.meta = meta;
	}

	@Override
	public Map<String, String> getProperties() throws Exception {
		Map<String, String> props = new HashMap<String,String>();

    	XMPIterator iterator = meta.iterator();
    	while( iterator.hasNext() ) {
			XMPPropertyInfo propInfo = (XMPPropertyInfo) iterator.next();
			String path = propInfo.getPath();
			String value = propInfo.getValue();
			//String ns = propInfo.getNamespace();
			if( path != null && value != null ) {
				props.put(path, value);
			}
        }

		return props;
	}

	@Override
	public boolean usePanoramaViewer() throws Exception {
    	XMPIterator iterator = meta.iterator();
    	while( iterator.hasNext() ) {
			XMPPropertyInfo propInfo = (XMPPropertyInfo) iterator.next();
			String path = propInfo.getPath();
			String value = propInfo.getValue();
			
			if( null != path 
			 && null != value 
			 && path.endsWith("UsePanoramaViewer") 
			 && "true".equalsIgnoreCase(value) ){
				return true;
			}
        }
    	
		return false;
	}
}
