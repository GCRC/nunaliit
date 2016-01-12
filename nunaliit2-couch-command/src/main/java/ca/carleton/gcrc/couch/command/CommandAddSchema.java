package ca.carleton.gcrc.couch.command;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PrintStream;
import java.io.StringWriter;

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
	public String[] getExpectedOptions() {
		return new String[]{
				Options.OPTION_ATLAS_DIR
				,Options.OPTION_DEF
				,Options.OPTION_GROUP
				,Options.OPTION_ID
			};
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
		ps.println("  --def   <file>   Name of file where schema definition is contained. This");
		ps.println("                   option should be provided only if --id is not.");
		ps.println();
		ps.println("  --group <name>   Name of group that the schema is associated with. If");
		ps.println("                   not provided, defaults to atlas name");
		ps.println();
		ps.println("  --id     <name>  Identifier for new schema. Either --id or --def must");
		ps.println("                   be provided, not both. The effective name of the schema");
		ps.println("                   is <group> '_' <id>");
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

		// Load properties for atlas
		AtlasProperties atlasProperties = AtlasProperties.fromAtlasDir(atlasDir);
		
		// Pick up options
		File defFile = null;
		if( null != options.getDef() ){
			defFile = new File( options.getDef() );
		}
		String groupName = atlasProperties.getAtlasName();
		if( null != options.getGroup() ){
			groupName = options.getGroup();
		}
		String id = options.getId();
		
		if( null == defFile && null == id ){
			throw new Exception("One of the options --id or --def must be provided");
		} else if( null != defFile && null != id ) {
			throw new Exception("Options --id and --def are mutually exclusive");
		}
		
		// Load definition file
		SchemaDefinition schemaDef = null;
		if( null != defFile ){
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
			schemaDef = SchemaDefinition.fronJson(jsonDefinition);

		} else if( null != id ) {
			schemaDef = new SchemaDefinition(groupName, id);
		}
		
		// Save to disk
		File docsDir = new File(atlasDir, "docs");
		schemaDef.saveToDocsDir(docsDir);
		
		File schemaDir = new File(docsDir, schemaDef.getDocumentIdentifier());
		gs.getOutStream().println("Schema written to "+schemaDir.getAbsolutePath());
	}
}
