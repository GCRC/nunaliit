package ca.carleton.gcrc.css;

import java.io.BufferedReader;
import java.io.Reader;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ThemeReader {
	static private Pattern patternComment = Pattern.compile("\\s*\\/\\/.*");
	static private Pattern patternKeyValue = Pattern.compile("([^:]+):(.*)");

	private BufferedReader reader;
	
	public ThemeReader(Reader reader){
		this.reader = new BufferedReader(reader);
	}

	public Map<String,String> read() throws Exception {
		try {
			Map<String,String> result = new HashMap<String,String>();

			int lineNumber = 1;
			String line = reader.readLine();
			while( null != line ){
				line = line.trim();

				Matcher matcherComment = patternComment.matcher(line);
				Matcher matcherKeyValue = patternKeyValue.matcher(line);
				
				if( "".equals(line) ) {
					// Ignore empty line
				} else if( matcherComment.matches() ) {
					// Ignore comment line
				} else if( matcherKeyValue.matches() ) {
					String key = matcherKeyValue.group(1).trim();
					String value = matcherKeyValue.group(2).trim();
					
					result.put(key, value);
				} else {
					throw new Exception("Unrecognized theme at line "+lineNumber+": "+line);
				}
				
				line = reader.readLine();
				++lineNumber;
			}

			return result;

		} catch(Exception e) {
			throw new Exception("Error while reading theme file",e);
		}
	}

	public void read(Map<String,String> result) throws Exception {
		Map<String,String> properties = read();
		for(String key : properties.keySet()){
			String value = properties.get(key);
			result.put(key, value);
		}
	}
}
