package ca.carleton.gcrc.couch.command;

import java.io.File;
import java.io.PrintStream;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Scanner;
import java.util.List;
import java.util.ArrayList;
import java.io.IOException;
import java.io.FileOutputStream;
import java.io.OutputStreamWriter;
import ca.carleton.gcrc.couch.command.schema.SchemaDefinition;

import ca.carleton.gcrc.couch.onUpload.inReach.InReachConfiguration;
import ca.carleton.gcrc.couch.onUpload.inReach.InReachForm;
import ca.carleton.gcrc.couch.onUpload.inReach.InReachFormField;
import ca.carleton.gcrc.couch.onUpload.inReach.InReachSettings;
import ca.carleton.gcrc.couch.onUpload.inReach.InReachSettingsFromXmlFile;

public class CommandInReachSchemaDefs implements Command {

	@Override
	public String getCommandString() {
		return "schemas-for-inreach";
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
			};
	}

	@Override
	public boolean requiresAtlasDir() {
		return true;
	}

	@Override
	public void reportHelp(PrintStream ps) {
		ps.println("Nunaliit2 Atlas Framework - Generate Schema Definitions for InReach");
		ps.println();
		ps.println("This command reads the InReach form definitions and generates");
		ps.println("associated schema definitions");
		ps.println();
		ps.println("Command Syntax:");
		ps.println("  nunaliit schemas-for-inreach <options>");
		ps.println();
		ps.println("options:");
		ps.println();
		CommandHelp.reportGlobalOptions(ps, getExpectedOptions());
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

		// InReach configuration
		File configDir = new File(atlasDir, "config");
		if( configDir.exists() && configDir.isDirectory() ){
			File inReachFile = new File(configDir, "inreach_forms.xml");
			if( inReachFile.exists() && inReachFile.isFile() ){
				InReachSettingsFromXmlFile inReachSettings = new InReachSettingsFromXmlFile(inReachFile);
				inReachSettings.load();
				InReachConfiguration.setInReachSettings(inReachSettings);
			}
		}

		// Iterate over each inReach form
		InReachSettings inReachSettings = InReachConfiguration.getInReachSettings();
		File docsDir = new File(atlasDir, "docs");
		String groupName = atlasProperties.getAtlasName();
		Scanner scanner = new Scanner(System.in);
		for(InReachForm form : inReachSettings.getForms()){
			JSONObject jsonDef = schemaDefinitionFromForm(form);
			String id = form.getPrefix().replace("-", "_") + form.getTitle();

			System.out.print("Do you want to create a schema for the "+ id +" definition? (yes/no): ");
			String response = scanner.next().toLowerCase();
			if (response.equals("yes")) {
				SchemaDefinition schemaDef = new SchemaDefinition(groupName, id);

				// Save schema definition to disk
				schemaDef.saveToDocsDir(docsDir);
				File schemaDir = new File(docsDir, schemaDef.getDocumentIdentifier());

				// Write JSON to file
				File file = new File(schemaDir, "definition.json");
				try (FileOutputStream fos = new FileOutputStream(file);
					OutputStreamWriter osw = new OutputStreamWriter(fos)) {
					osw.write(jsonDef.toString(4).replace("    ", "\t"));
					osw.flush();
					gs.getOutStream().println("Schema written to "+schemaDir.getAbsolutePath());

					Options newOptions = new Options();
					List<String> args = new ArrayList<String>();
					args.add("update-schema");
					args.add("--name");
					args.add(groupName + "_" + id);
					newOptions.parseOptions(args);
					CommandUpdateSchema cmdUpdateSchems = new CommandUpdateSchema();
					cmdUpdateSchems.runCommand(gs, newOptions);
				} catch (IOException e) {
					gs.getOutStream().println("Could not write schema definition to "+file.getAbsolutePath());
				}
			} else {
				// Pretty print
				gs.getOutStream().println(jsonDef.toString(3));
				gs.getOutStream().println();
			}
		}
		scanner.close();
	}

	private JSONObject schemaDefinitionFromForm(InReachForm form) throws Exception {
		JSONObject jsonDef = new JSONObject();

		jsonDef.put("group", "inReach");
		jsonDef.put("id", form.getTitle());
		jsonDef.put("label", "InReach "+form.getTitle());

		JSONArray attributes = new JSONArray();
		jsonDef.put("attributes", attributes);

		// Title
		{
			JSONObject attribute = new JSONObject();
			attributes.put(attribute);

			attribute.put("label", form.getTitle());
			attribute.put("type", "title");
			attribute.put("includedInBrief", true);
		}

		for(InReachFormField field : form.getFields()){
			JSONObject attribute = new JSONObject();
			attributes.put(attribute);

			String label = field.getName();
			String id = escapeJsonAttribute( field.getName() );

			attribute.put("label", label);
			attribute.put("id", id);

			InReachFormField.Type fieldType = field.getType();
			if( InReachFormField.Type.PICKLIST == fieldType ){
				attribute.put("type", "selection");

				JSONArray options = new JSONArray();
				attribute.put("options", options);

				for(String v : field.getValues()){
					JSONObject option = new JSONObject();
					options.put(option);

					option.put("label", v);
					option.put("value", v);
				}

			} else if( InReachFormField.Type.TEXT == fieldType ) {
				attribute.put("type", "string");
				attribute.put("textarea", true);

			} else if( InReachFormField.Type.NUMBER == fieldType) {
				attribute.put("type", "string");

			} else {
				throw new Exception("Unexpected field type: "+fieldType);
			}
		}

		return jsonDef;
	}

	private String escapeJsonAttribute(String fieldName) {
		StringBuilder sb = new StringBuilder();

		for(char c : fieldName.toCharArray()){
			if( c >= '0' &&  c <= '9' ){
				sb.append(c);
			} else if( c >= 'a' &&  c <= 'z' ){
				sb.append(c);
			} else if( c >= 'A' &&  c <= 'Z' ){
				sb.append(c);
			} else if( c == '_' ){
				sb.append(c);
			} else {
				// skip
			}
		}

		return sb.toString();
	}
}
