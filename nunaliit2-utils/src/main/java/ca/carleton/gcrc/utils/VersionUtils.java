package ca.carleton.gcrc.utils;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.Properties;

public class VersionUtils {
	
	static private boolean g_versionLoaded = false;
	static private String g_version = null;

	static synchronized public String getVersion() {
		if( !g_versionLoaded ){
			g_versionLoaded = true;

			try {
				g_version = loadVersion();
			} catch(Exception e) {
				// Ignore
			}
		}
		
		return g_version;
	}

	static public String loadVersion() throws Exception {
		InputStream is = null;
		InputStreamReader isr = null;
		String version = null;
		try {
			ClassLoader cl = VersionUtils.class.getClassLoader();
			is = cl.getResourceAsStream("version.properties");
			isr = new InputStreamReader(is,"UTF-8");
			Properties props = new Properties();
			props.load(isr);
			if( props.containsKey("version") ){
				version = props.getProperty("version");
			}
		} catch(Exception e) {
			throw new Exception("Error while extracting version resource",e);
		} finally {
			if( null != isr ){
				try {
					isr.close();
				} catch(Exception e) {
					// Ignore
				}
			}
			if( null != is ){
				try {
					is.close();
				} catch(Exception e) {
					// Ignore
				}
			}
		}
		
		return version;
	}
}
