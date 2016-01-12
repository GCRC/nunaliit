package ca.carleton.gcrc.couch.command;

import java.io.File;
import java.io.PrintStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Vector;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.app.Document;
import ca.carleton.gcrc.couch.app.impl.DocumentFile;
import ca.carleton.gcrc.couch.command.schema.SchemaDefinition;
import ca.carleton.gcrc.couch.fsentry.FSEntryFile;

public class CommandUpdateSchema implements Command {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

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
	public String[] getExpectedOptions() {
		return new String[]{
				Options.OPTION_ATLAS_DIR
				,Options.OPTION_NAME
				,Options.OPTION_ALL
			};
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
		ps.println();
		ps.println("  --all             Find and update all schemas with definitions");
	}

	@Override
	public void runCommand(
		GlobalSettings gs
		,Options options
		) throws Exception {

		if( options.getArguments().size() > 1 ){
			throw new Exception("Unexpected argument: "+options.getArguments().get(1));
		}

		File atlasDir = gs.getAtlasDir();
		
		// Pick up options
		String schemaName = options.getName();
		boolean allSchemas = false;
		if( null != options.getAll() ){
			allSchemas = options.getAll().booleanValue();
		}
		
		// Load all documents, looking for schemas
		Map<String,Document> documentsByDocId = new HashMap<String,Document>();
		Map<String,File> dirByDocId = new HashMap<String,File>();
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
							logger.error("Unable to read document at: "+subDir.getName(), e);
							//throw new Exception("Unable to read document at: "+subDir.getName(), e);
						}
						
						if( null != doc ){
							// Check if this is schema we are looking for
							JSONObject jsonDoc = doc.getJSONObject();
							String docId = jsonDoc.optString("_id",null);
							String nunaliitType = jsonDoc.optString("nunaliit_type",null);
							
							if( null != docId 
							 && "schema".equals(nunaliitType) ){
								documentsByDocId.put(docId, doc);
								dirByDocId.put(docId, subDir);
							}
						}
					}
				}
			}
		}
		
		// Accumulate the docIds we wish to process
		List<String> docIds = new Vector<String>();
		for(String docId : documentsByDocId.keySet()){
			Document doc = documentsByDocId.get(docId);

			// Check if this is schema we are looking for
			JSONObject jsonDoc = doc.getJSONObject();
			String nunaliitType = jsonDoc.optString("nunaliit_type",null);
			String name = jsonDoc.optString("name",null);
			JSONObject jsonDef = jsonDoc.optJSONObject("definition");
			
			if( "schema".equals(nunaliitType) ){
				if( allSchemas ) {
					// Include only schemas that have a definition
					if( null != jsonDef ){
						docIds.add(docId);
					}
				} else if( null != schemaName && schemaName.equals(name) ) {
					if( null != jsonDef ){
						docIds.add(docId);
					} else {
						throw new Exception("Schema was found, but no associated definition was found");
					}
				}
			}
		}
	
		// Check if schema was found
		if( docIds.size() < 1 ){
			throw new Exception("No schema was found");
		}

		// Loop over all documents
		for(String docId : docIds){
			try {
				Document doc = documentsByDocId.get(docId);
				File schemaDir = dirByDocId.get(docId);
				JSONObject jsonDoc = doc.getJSONObject();
				String name = jsonDoc.getString("name");
				JSONObject jsonDef = jsonDoc.getJSONObject("definition");
				
				// Refresh from definition
				SchemaDefinition schemaDef = SchemaDefinition.fronJson(jsonDef);
				schemaDef.saveToSchemaDir(schemaDir);
				
				gs.getOutStream().println("Schema "+name+" refreshed");
			
			} catch(Exception e) {
				throw new Exception("Error updating schema with id: "+docId, e);
			}
		}
	}
}
