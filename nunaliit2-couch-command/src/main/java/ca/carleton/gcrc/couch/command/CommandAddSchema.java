package ca.carleton.gcrc.couch.command;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PrintStream;
import java.io.StringWriter;
import java.util.Stack;

import org.json.JSONObject;
import org.json.JSONTokener;

import ca.carleton.gcrc.couch.command.schema.SchemaDefinition;

public class CommandAddSchema implements Command {

	@Override
	public String getCommandString() {
		return "add-schema";
	}

	@Override
	public boolean matchesKeyword(String keyword) {
		if( getCommandString().equalsIgnoreCase(keyword) ) {
			return true;
		}
		return false;
	}

	@Override
	public boolean isDeprecated() {
		return false;
	}

	@Override
	public boolean requiresAtlasDir() {
		return true;
	}

	@Override
	public void reportHelp(PrintStream ps) {
		ps.println("Nunaliit2 Atlas Framework - Add Schema Command");
		ps.println();
		ps.println("The add-schema command creates a new schema based");
		ps.println("on a definition file.");
		ps.println();
		ps.println("Command Syntax:");
		ps.println("  nunaliit [<global-options>] add-schema [<add-schema-options>]");
		ps.println();
		ps.println("Global Options");
		CommandHelp.reportGlobalSettingAtlasDir(ps);
		ps.println();
		ps.println("Add Schema Options");
		ps.println("  --def   <file>   Name of file where schema definition is contained");
	}

	@Override
	public void runCommand(
		GlobalSettings gs
		,Stack<String> argumentStack
		) throws Exception {

		File atlasDir = gs.getAtlasDir();
		
		// Pick up options
		File defFile = null;
		while( false == argumentStack.empty() ){
			String optionName = argumentStack.peek();
			if( "--def".equals(optionName) ){
				argumentStack.pop();
				if( argumentStack.size() < 1 ){
					throw new Exception("--def option requires a file name");
				}
				
				String defFileStr = argumentStack.pop();
				defFile = new File(defFileStr);

			} else {
				break;
			}
		}
		
		if( null == defFile ){
			throw new Exception("The option --def must be provided");
		}
		
		// Load definition file
		JSONObject jsonDefinition = null;
		if( false == defFile.exists() ){
			throw new Exception("Definition file does not exist: "+defFile.getAbsolutePath());
		}
		if( false == defFile.isFile() ){
			throw new Exception("Path to definition file is not valid: "+defFile.getAbsolutePath());
		}
		{
			StringWriter sw = new StringWriter();
			InputStream is = null;
			InputStreamReader isr = null;
			char[] buffer = new char[100];
			try {
				is = new FileInputStream(defFile);
				isr = new InputStreamReader(is, "UTF-8");
				
				int size = isr.read(buffer);
				while( size >= 0 ) {
					sw.write(buffer, 0, size);
					size = isr.read(buffer);
				}
				
				sw.flush();
				
				JSONTokener tokener = new JSONTokener(sw.toString());
				Object objDefinition = tokener.nextValue();
				if( objDefinition instanceof JSONObject ){
					jsonDefinition = (JSONObject)objDefinition;
				} else {
					throw new Exception("Invalid schema definition");
				}
				
			} catch (Exception e) {
				throw new Exception("Error while reading file: "+defFile.getName(), e);
				
			} finally {
				if( null != isr ) {
					try {
						isr.close();
					} catch (Exception e) {
						// Ignore
					}
				}
				if( null != is ) {
					try {
						is.close();
					} catch (Exception e) {
						// Ignore
					}
				}
			}
		}
		
		// Interpret definition
		SchemaDefinition schemaDef = SchemaDefinition.fronJson(jsonDefinition);
		
		// Save to disk
		File docsDir = new File(atlasDir, "docs");
		schemaDef.saveToDocsDir(docsDir);
		
		File schemaDir = new File(docsDir, schemaDef.getDocumentIdentifier());
		gs.getOutStream().println("Schema written to "+schemaDir.getAbsolutePath());
	}
}
