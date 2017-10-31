package ca.carleton.gcrc.utils;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.Properties;

public class VersionUtils {
	
	static private boolean g_propsLoaded = false;
	static private Properties g_props = null;

	static public String getVersion() {
		Properties props = loadProperties();
		
		String version = null;
		if( props.containsKey("version") ){
			version = props.getProperty("version");
		}
		
		return version;
	}

	static public String getDateString() {
		Properties props = loadProperties();
		
		String dateStr = null;
		if( props.containsKey("time") ){
			dateStr = props.getProperty("time");
		}
		
		return dateStr;
	}

	static public String getBuildString() {
		Properties props = loadProperties();
		
		String buildStr = null;
		if( props.containsKey("build") ){
			buildStr = props.getProperty("build");
		}
		
		return buildStr;
	}

	static public String getShortBuildString() {
		Properties props = loadProperties();
		
		String buildStr = null;
		if( props.containsKey("build_short") ){
			buildStr = props.getProperty("build_short");
		}
		
		return buildStr;
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

	static synchronized public Properties loadProperties() {
		if( !g_propsLoaded ){
			g_propsLoaded = true;

			try {
				InputStream is = null;
				InputStreamReader isr = null;
				try {
					ClassLoader cl = VersionUtils.class.getClassLoader();
					is = cl.getResourceAsStream("version.properties");
					isr = new InputStreamReader(is,"UTF-8");
					Properties props = new Properties();
					props.load(isr);
					
					g_props = props;
					
					isr.close();
					isr = null;
					
					is.close();
					is = null;

				} catch(Exception e) {
					throw new Exception("Error while extracting properties",e);

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

			} catch(Exception e) {
				// Can't load them. Go with empty props
				g_props = new Properties();
			}
		}
		
		return g_props;
	}
}
