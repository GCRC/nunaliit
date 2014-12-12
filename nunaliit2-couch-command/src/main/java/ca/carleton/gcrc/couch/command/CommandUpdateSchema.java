package ca.carleton.gcrc.couch.command;

import java.io.File;
import java.io.PrintStream;
import java.util.Stack;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.app.Document;
import ca.carleton.gcrc.couch.app.impl.DocumentFile;
import ca.carleton.gcrc.couch.command.impl.SchemaDefinition;
import ca.carleton.gcrc.couch.fsentry.FSEntryFile;

public class CommandUpdateSchema implements Command {

	@Override
	public String getCommandString() {
		return "update-schema";
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
		ps.println("Nunaliit2 Atlas Framework - Update Schema Command");
		ps.println();
		ps.println("The update-schema command refreshes a schema found on disk");
		ps.println("based on its definition.");
		ps.println();
		ps.println("Command Syntax:");
		ps.println("  nunaliit [<global-options>] update-schema [<update-schema-options>]");
		ps.println();
		ps.println("Global Options");
		CommandHelp.reportGlobalSettingAtlasDir(ps);
		ps.println();
		ps.println("Update Schema Options");
		ps.println("  --name   <name>   Name of schema that should be updated");
	}

	@Override
	public void runCommand(
		GlobalSettings gs
		,Stack<String> argumentStack
		) throws Exception {

		File atlasDir = gs.getAtlasDir();
		
		// Pick up options
		String schemaName = null;
		while( false == argumentStack.empty() ){
			String optionName = argumentStack.peek();
			if( "--name".equals(optionName) ){
				argumentStack.pop();
				if( argumentStack.size() < 1 ){
					throw new Exception("--name option requires a schema name");
				}
				
				schemaName = argumentStack.pop();

			} else {
				break;
			}
		}
		
		// Load all documents, looking for desired schema
		JSONObject jsonDef = null;
		File schemaDir = null;
		{
			File docsDir = new File(atlasDir, "docs");
			if( docsDir.exists() && docsDir.isDirectory() ){
				// Iterate over each subdirectory, attempting to
				// load each document
				String[] subDirNames = docsDir.list( gs.getFilenameFilter() );
				for(String subDirName : subDirNames){
					File subDir = new File(docsDir, subDirName);
					if( subDir.exists() && subDir.isDirectory() ) {
						// OK, let's create a document based on this
						Document doc = null;
						try {
							FSEntryFile entry = new FSEntryFile(subDir);
							doc = DocumentFile.createDocument(entry);
						} catch(Exception e){
							throw new Exception("Unable to read document at: "+subDir.getName(), e);
						}
						
						// Check if this is schema we are looking for
						JSONObject jsonDoc = doc.getJSONObject();
						String nunaliitType = jsonDoc.optString("nunaliit_type",null);
						String name = jsonDoc.optString("name",null);
						
						if( schemaName.equals(name) 
						 && "schema".equals(nunaliitType) ){
							schemaDir = subDir;
							jsonDef = jsonDoc.optJSONObject("definition");
							break;
						}
					}
				}
			}
		}
	
		// Check if schema was found
		if( null == schemaDir ){
			throw new Exception("Schema was not found");
		}
		if( null == jsonDef ){
			throw new Exception("Schema was found, but no associated definition was found");
		}
		
		// Refresh from definition
		SchemaDefinition schemaDef = SchemaDefinition.fronJson(jsonDef);
		schemaDef.saveToSchemaDir(schemaDir);
		
		gs.getOutStream().println("Schema refreshed in "+schemaDir.getAbsolutePath());
	}
}
