package ca.carleton.gcrc.utils;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Properties;

import org.json.JSONObject;
import org.json.JSONTokener;

public class TextFileUtils {

	static public String readTextFile(File file) throws Exception {
		FileInputStream fis = null;
		InputStreamReader isr = null;
		try {
			StringWriter sw = new StringWriter();
			fis = new FileInputStream(file);
			isr = new InputStreamReader(fis, "UTF-8");
			
			StreamUtils.copyStream(isr, sw);

			sw.flush();
			
			fis.close();
			fis = null;
			isr.close();
			isr = null;
			
			return sw.toString();

		} catch (Exception e) {
			throw new Exception("Error while reading text file: "+file,e);

		} finally {
			if( isr != null ){
				try {
					isr.close();
					isr = null;
				} catch(Exception e) {
					// Ignore
				}
			}
			if( fis != null ){
				try {
					fis.close();
					fis = null;
				} catch(Exception e) {
					// Ignore
				}
			}
		}
	}

	static public PrintWriter writeTextFile(File file) throws Exception {
		try {
			FileOutputStream fos = null;
			OutputStreamWriter osw = null;
			PrintWriter pw = null;
			fos = new FileOutputStream(file);
			osw = new OutputStreamWriter(fos, "UTF-8");
			pw = new PrintWriter(osw);

			return pw;
		} catch (Exception e) {
			throw new Exception("Error while opening text file for writing: "+file,e);
		}
	}

	static public void writeTextFile(File file, String content) throws Exception {
		FileOutputStream fos = null;
		OutputStreamWriter osw = null;
		try {
			fos = new FileOutputStream(file);
			osw = new OutputStreamWriter(fos, "UTF-8");

			osw.write(content);
			
			osw.flush();
			
			osw.close();
			osw= null;

			fos.close();
			fos = null;

		} catch (Exception e) {
			throw new Exception("Error while writing text file: "+file,e);

		} finally {
			try {
				if( null != osw ){
					osw.close();
					osw = null;
				}
			} catch(Exception e){
				// Ignore
			}
			try {
				if( null != fos ){
					fos.close();
					fos = null;
				}
			} catch(Exception e){
				// Ignore
			}
		}
	}

	static public Properties readPropertiesFile(File file) throws Exception {

		FileInputStream fis = null;
		InputStreamReader isr = null;
		try {
			Properties props = new Properties();

			fis = new FileInputStream(file);
			isr = new InputStreamReader(fis, "UTF-8");
			
			props.load(isr);
			
			fis.close();
			fis = null;
			isr.close();
			isr = null;
			
			return props;

		} catch(Exception e) {
			throw new Exception("Error while loading properties from: "+file, e);

		} finally {
			if( null != fis ){
				try {
					fis.close();
					fis = null;
				} catch(Exception e) {
					// Ignore
				}
			}
			if( null != isr ){
				try {
					isr.close();
					isr = null;
				} catch(Exception e) {
					// Ignore
				}
			}
		}
	}

	static public void readPropertiesFile(Properties props, File file) throws Exception {

		FileOutputStream fos = null;
		OutputStreamWriter osw = null;
		try {
			fos = new FileOutputStream(file);
			osw = new OutputStreamWriter(fos, "UTF-8");
			
			props.store(osw, null);
			
			fos.close();
			fos = null;
			osw.close();
			osw = null;
		} catch(Exception e) {
			throw new Exception("Error while writing properties to: "+file, e);

		} finally {
			if( null != fos ){
				try {
					fos.close();
					fos = null;
				} catch(Exception e) {
					// Ignore
				}
			}
			if( null != osw ){
				try {
					osw.close();
					osw = null;
				} catch(Exception e) {
					// Ignore
				}
			}
		}
	}

	static public JSONObject readJsonObjectFile(File file) throws Exception {
		try {
			JSONObject json = null;
			
			String jsonStr = TextFileUtils.readTextFile(file);
			
			JSONTokener tokener = new JSONTokener(jsonStr);
			Object o = tokener.nextValue();
			if( o instanceof JSONObject ){
				json = (JSONObject)o;
			} else {
				throw new Exception("Unexpected class: "+o.getClass().getName());
			}
			
			// Check that file is empty
			if( tokener.more() ) {
				throw new Exception("File contains more than the object");
			}
			
			return json;

		} catch (Exception e) {
			throw new Exception("Error while parsing JSON Object file: "+file);
		}
	}
}
