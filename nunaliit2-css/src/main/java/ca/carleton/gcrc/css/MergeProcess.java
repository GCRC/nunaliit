package ca.carleton.gcrc.css;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.Reader;
import java.io.SequenceInputStream;
import java.io.Writer;
import java.util.HashMap;
import java.util.Map;
import java.util.Vector;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class MergeProcess {
	
	private Pattern patternHandles = Pattern.compile("^(.*)\\{\\{(.*)\\}\\}(.*)$");

	public void generate(LibraryConfiguration config, File outputFile) throws Exception {
		FileOutputStream fos = null;
		OutputStreamWriter osw = null;
		try {
			fos = new FileOutputStream(outputFile);
			osw = new OutputStreamWriter(fos, "UTF-8");
			
			generate(config, osw);
			
			osw.flush();
			
		} catch(Exception e) {
			throw new Exception("Error while merging CSS to file: "+outputFile,e);
			
		} finally {
			if( null != osw ){
				try {
					osw.close();
				} catch (Exception e) {
					// Ignore
				}
			}
			if( null != fos ){
				try {
					fos.close();
				} catch (Exception e) {
					// Ignore
				}
			}
		}
	}

	public void generate(LibraryConfiguration config, Writer writer) throws Exception {
		Map<String,String> properties = null;
		if( config.getThemeFiles() != null ){
			properties = new HashMap<String,String>();
			for(File themeFile : config.getThemeFiles()){
				readThemeFile(themeFile, properties);
			}
		}
		
		// Create input reader
		Reader reader = null;
		BufferedReader bufReader = null;
		Vector<InputStream> streams = new Vector<InputStream>(); 
		SequenceInputStream sis = null;
		try {
			// Insert license file, if specified
			{
				File licenseFile = config.getLicenseFile();
				if( null != licenseFile ){
					FileInputStream fis = new FileInputStream(licenseFile);
					streams.add(fis);
				}
			}
			
			// Create sequence input stream from files in configuration
			for(File file : config.getInputFiles()){
				// Create header
				ByteArrayOutputStream baos = new ByteArrayOutputStream();
				OutputStreamWriter osw = new OutputStreamWriter(baos, "UTF-8");
				osw.write("\n\n/* --- ");
				osw.write(file.getPath());
				osw.write(" --- */\n");
				osw.flush();
				ByteArrayInputStream bais = new ByteArrayInputStream(baos.toByteArray());
				streams.add(bais);

				FileInputStream fis = new FileInputStream(file);
				streams.add(fis);
			}
			sis = new SequenceInputStream(streams.elements());
			reader = new InputStreamReader(sis, "UTF-8");
			bufReader = new BufferedReader(reader);
			
			String line = bufReader.readLine();
			while( null != line ){
				// Perform replacements
				if( null != properties ){
					Matcher matcherHandles = patternHandles.matcher(line);
					while( matcherHandles.matches() ){
						String propertyName = matcherHandles.group(2).trim();
						String value = properties.get(propertyName);
						if( null == value ){
							value = "";
						}
						
						line = matcherHandles.group(1) + value + matcherHandles.group(3);
						
						matcherHandles = patternHandles.matcher(line);
					}
				}
				
				writer.write(line);
				writer.write('\n');
				line = bufReader.readLine();
			}
			
		} catch(Exception e) {
			throw new Exception("Error while merging CSS",e);
			
		} finally {
			if( null != bufReader ) {
				try {
					bufReader.close();
				} catch (Exception e) {
					// Ignore
				}
			}
			if( null != reader ) {
				try {
					reader.close();
				} catch (Exception e) {
					// Ignore
				}
			}
			for(InputStream fis : streams){
				try {
					fis.close();
				} catch (Exception e) {
					// Ignore
				}
			}
			if( null != sis ) {
				try {
					sis.close();
				} catch (Exception e) {
					// Ignore
				}
			}
		}
	}
	
	private void readThemeFile(File themeFile, Map<String,String> properties) throws Exception {
		FileInputStream fis = null;
		InputStreamReader isr = null;
		try {
			fis = new FileInputStream(themeFile);
			isr = new InputStreamReader(fis,"UTF-8");
			
			ThemeReader themeReader = new ThemeReader(isr);
			themeReader.read(properties);
			
			isr.close();
			fis.close();
			
		} catch(Exception e) {
			throw new Exception("Error while reading theme file: "+themeFile.getAbsolutePath(),e);

		} finally {
			if( null != isr ){
				try {
					isr.close();
				} catch(Exception e) {
					// Ignore
				}
			}
			if( null != fis ){
				try {
					fis.close();
				} catch(Exception e) {
					// Ignore
				}
			}
		}
	}
}
