package ca.carleton.gcrc.couch.command.schema;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.util.List;
import java.util.Vector;

import org.json.JSONArray;
import org.json.JSONObject;

public class SchemaDefinition {
	
	static public SchemaDefinition fromJson(JSONObject jsonDef) throws Exception {
		String groupName = jsonDef.getString("group");
		String schemaId = jsonDef.getString("id");
		
		SchemaDefinition def = new SchemaDefinition(groupName, schemaId);

		// label
		{
			String label = jsonDef.optString("label",null);
			if( null != label ){
				def.setLabel(label);
			}
		}
		
		// Attributes
		{
			JSONArray attributes = jsonDef.optJSONArray("attributes");
			if( null != attributes ) {
				for(int i=0,e=attributes.length(); i<e; ++i){
					JSONObject jsonAttr = attributes.getJSONObject(i);
					SchemaAttribute attribute = SchemaAttribute.fromJson(jsonAttr);
					def.addAttribute(attribute);
				}
			}
		}
		
		// Related schemas
		{
			JSONArray relatedSchemas = jsonDef.optJSONArray("relatedSchemas");
			if( null != relatedSchemas ) {
				for(int i=0,e=relatedSchemas.length(); i<e; ++i){
					String schemaName = relatedSchemas.getString(i);
					def.addRelatedSchema(schemaName);
				}
			}
		}
		
		// Initial Layers
		{
			JSONArray initialLayers = jsonDef.optJSONArray("initialLayers");
			if( null != initialLayers ) {
				for(int i=0,e=initialLayers.length(); i<e; ++i){
					String layerId = initialLayers.getString(i);
					def.addInitialLayer(layerId);
				}
			}
		}
		
		return def;
	}
	
	private String groupName;
	private String schemaId;
	private String label;
	private List<SchemaAttribute> attributes = new Vector<SchemaAttribute>();
	private List<String> initialLayers = new Vector<String>();
	private List<String> relatedSchemas = new Vector<String>();
	
	public SchemaDefinition(String groupName, String schemaId){
		this.groupName = groupName;
		this.schemaId = schemaId;
	}
	
	public String getLabel() {
		return label;
	}

	public void setLabel(String label) {
		this.label = label;
	}
	
	public List<SchemaAttribute> getAttributes(){
		return attributes;
	}

	public void addAttribute(SchemaAttribute attribute){
		attributes.add(attribute);
	}
	
	public List<String> getRelatedSchemas(){
		return relatedSchemas;
	}

	public void addRelatedSchema(String relatedSchemaName){
		relatedSchemas.add(relatedSchemaName);
	}
	
	public List<String> getInitialLayers(){
		return initialLayers;
	}

	public void addInitialLayer(String layerId){
		initialLayers.add(layerId);
	}
	
	public String getDocumentIdentifier(){
		if( "nunaliit".equals(groupName) ){
			return "org.nunaliit.schema:" + schemaId;
		} else {
			return "schema."+groupName+"_"+schemaId;
		}
	}
	
	public String getSchemaName(){
		if( "nunaliit".equals(groupName) ){
			return schemaId;
		} else {
			return groupName+"_"+schemaId;
		}
	}
	
	public String getSchemaLabel(){
		if( null == label ){
			return getSchemaName();
		}
		
		return label;
	}

	public String getSchemaStructure(){
		return groupName+"_"+schemaId;
	}

	public String getSchemaClass(){
		if( "nunaliit".equals(groupName) ){
			return "nunaliit_" + schemaId + "_schema";
		} else {
			return groupName+"_"+schemaId;
		}
	}
	
	
	public void saveToDocsDir(File parentDir) throws Exception {
		
		// Create directory
		File schemaDir = new File(parentDir, getDocumentIdentifier());
		if( false == schemaDir.exists() ){
			boolean created = schemaDir.mkdir();
			if( !created ){
				throw new Exception("Unable to create schema directory");
			}
		}
		
		// definition.json
		{
			File file = new File(schemaDir, "definition.json");
			FileOutputStream fos = new FileOutputStream(file);
			OutputStreamWriter osw = new OutputStreamWriter(fos);
			JSONObject obj = toJson();
			osw.write( obj.toString(3) );
			osw.flush();
			fos.flush();
			fos.close();
		}
		
		saveToSchemaDir(schemaDir);
	}
	
	public void saveToSchemaDir(File schemaDir) throws Exception {
		
		// _id.txt
		{
			File file = new File(schemaDir, "_id.txt");
			FileOutputStream fos = new FileOutputStream(file);
			OutputStreamWriter osw = new OutputStreamWriter(fos);
			osw.write(getDocumentIdentifier());
			osw.flush();
			fos.flush();
			fos.close();
		}
		
		// nunaliit_type.txt
		{
			File file = new File(schemaDir, "nunaliit_type.txt");
			FileOutputStream fos = new FileOutputStream(file);
			OutputStreamWriter osw = new OutputStreamWriter(fos);
			osw.write("schema");
			osw.flush();
			fos.flush();
			fos.close();
		}
		
		// nunaliit_schema.txt
		{
			File file = new File(schemaDir, "nunaliit_schema.txt");
			FileOutputStream fos = new FileOutputStream(file);
			OutputStreamWriter osw = new OutputStreamWriter(fos);
			osw.write("schema");
			osw.flush();
			fos.flush();
			fos.close();
		}
		
		// isRootSchema.json
		{
			File file = new File(schemaDir, "isRootSchema.json");
			FileOutputStream fos = new FileOutputStream(file);
			OutputStreamWriter osw = new OutputStreamWriter(fos);
			osw.write("true");
			osw.flush();
			fos.flush();
			fos.close();
		}
		
		// name.txt
		{
			File file = new File(schemaDir, "name.txt");
			FileOutputStream fos = new FileOutputStream(file);
			OutputStreamWriter osw = new OutputStreamWriter(fos);
			osw.write( getSchemaName() );
			osw.flush();
			fos.flush();
			fos.close();
		}
		
		// label.txt
		{
			File file = new File(schemaDir, "label.txt");
			FileOutputStream fos = new FileOutputStream(file);
			OutputStreamWriter osw = new OutputStreamWriter(fos);
			if( null != label ){
				osw.write( label );
			} else {
				osw.write( getSchemaName() );
			}
			osw.flush();
			fos.flush();
			fos.close();
		}
		
		// relatedSchemas.json
		{
			boolean eraseFile = false;
			File file = new File(schemaDir, "relatedSchemas.json");
			FileOutputStream fos = null;
			try {
				fos = new FileOutputStream(file);
				OutputStreamWriter osw = new OutputStreamWriter(fos);
				JSONArray arr = new JSONArray();
				for(String schemaName : relatedSchemas){
					arr.put(schemaName);
				}
				osw.write( arr.toString(3) );
				osw.flush();
				fos.flush();
				fos.close();
				fos = null;
				
			} catch(Exception e) {
				eraseFile = true;
				throw new Exception("Error while creating file "+file,e);
				
			} finally {
				if( null != fos ){
					try {
						fos.close();
					} catch(Exception e) {
						// Ignore
					}
				}
				
				// Do not leave file in invalid state
				try {
					if( eraseFile ){
						file.delete();
					}
				} catch(Exception e) {
					// ignore
				}
			}
		}
		
		// create.json
		{
			boolean eraseFile = false;
			File file = new File(schemaDir, "create.json");
			FileOutputStream fos = null;
			try {
				fos = new FileOutputStream(file);
				OutputStreamWriter osw = new OutputStreamWriter(fos);
				JSONObject jsonCreate = computeCreateField();
				osw.write( jsonCreate.toString(3) );
				osw.flush();
				fos.flush();
				fos.close();
				fos = null;
				
			} catch(Exception e) {
				eraseFile = true;
				throw new Exception("Error while creating file "+file,e);
				
			} finally {
				if( null != fos ){
					try {
						fos.close();
					} catch(Exception e) {
						// Ignore
					}
				}
				
				// Do not leave file in invalid state
				try {
					if( eraseFile ){
						file.delete();
					}
				} catch(Exception e) {
					// ignore
				}
			}
		}
		
		// brief.txt
		{
			File file = new File(schemaDir, "brief.txt");
			FileOutputStream fos = new FileOutputStream(file);
			OutputStreamWriter osw = new OutputStreamWriter(fos);
			PrintWriter pw = new PrintWriter(osw);
			printBrief(pw);
			pw.flush();
			osw.flush();
			fos.flush();
			fos.close();
		}
		
		// display.txt
		{
			File file = new File(schemaDir, "display.txt");
			FileOutputStream fos = new FileOutputStream(file);
			OutputStreamWriter osw = new OutputStreamWriter(fos);
			PrintWriter pw = new PrintWriter(osw);
			printDisplay(pw);
			pw.flush();
			osw.flush();
			fos.flush();
			fos.close();
		}
		
		// form.txt
		{
			File file = new File(schemaDir, "form.txt");
			FileOutputStream fos = new FileOutputStream(file);
			OutputStreamWriter osw = new OutputStreamWriter(fos);
			PrintWriter pw = new PrintWriter(osw);
			printForm(pw);
			pw.flush();
			osw.flush();
			fos.flush();
			fos.close();
		}
		
		// export.json
		{
			boolean eraseFile = false;
			File file = new File(schemaDir, "export.json");
			FileOutputStream fos = null;
			try {
				fos = new FileOutputStream(file);
				OutputStreamWriter osw = new OutputStreamWriter(fos);
				JSONArray jsonExport = computeExportField();
				osw.write( jsonExport.toString(3) );
				osw.flush();
				fos.flush();
				fos.close();
				fos = null;
				
			} catch(Exception e) {
				eraseFile = true;
				throw new Exception("Error while creating file "+file,e);
				
			} finally {
				if( null != fos ){
					try {
						fos.close();
					} catch(Exception e) {
						// Ignore
					}
				}
				
				// Do not leave file in invalid state
				try {
					if( eraseFile ){
						file.delete();
					}
				} catch(Exception e) {
					// ignore
				}
			}
		}
		
		// csvExport.json
		{
			boolean eraseFile = false;
			File file = new File(schemaDir, "csvExport.json");
			FileOutputStream fos = null;
			try {
				fos = new FileOutputStream(file);
				OutputStreamWriter osw = new OutputStreamWriter(fos);
				JSONArray jsonExport = computeExportField();
				osw.write( jsonExport.toString(3) );
				osw.flush();
				fos.flush();
				fos.close();
				fos = null;
				
			} catch(Exception e) {
				eraseFile = true;
				throw new Exception("Error while creating file "+file,e);
				
			} finally {
				if( null != fos ){
					try {
						fos.close();
					} catch(Exception e) {
						// Ignore
					}
				}
				
				// Do not leave file in invalid state
				try {
					if( eraseFile ){
						file.delete();
					}
				} catch(Exception e) {
					// ignore
				}
			}
		}
	}

	public JSONObject toJson() throws Exception {
		JSONObject jsonDef = new JSONObject();
		
		jsonDef.put("id", schemaId);
		jsonDef.put("group", groupName);
		
		if( null != label ) jsonDef.put("label", label);
		
		if( attributes.size() > 0 ){
			JSONArray jsonAttributes  = new JSONArray();
			
			for(SchemaAttribute attribute : attributes){
				JSONObject jsonAttr = attribute.toJson();
				jsonAttributes.put(jsonAttr);
			}
			
			jsonDef.put("attributes", jsonAttributes);
		}
		
		if( relatedSchemas.size() > 0 ){
			JSONArray jsonRelatedSchemas  = new JSONArray();
			
			for(String schemaName : relatedSchemas){
				jsonRelatedSchemas.put(schemaName);
			}
			
			jsonDef.put("releatedSchemas", jsonRelatedSchemas);
		}
		
		if( initialLayers.size() > 0 ){
			JSONArray jsonInitialLayers  = new JSONArray();
			
			for(String layerId : initialLayers){
				jsonInitialLayers.put(layerId);
			}
			
			jsonDef.put("initialLayers", jsonInitialLayers);
		}
		
		return jsonDef;
	}
	
	public JSONObject computeCreateField() throws Exception {
		JSONObject jsonCreate = new JSONObject();

		jsonCreate.put("nunaliit_schema", getSchemaName());
		
		if( initialLayers.size() > 0 ){
			JSONArray nunaliit_layers = new JSONArray();
			
			for(String layerId : initialLayers){
				nunaliit_layers.put(layerId);
			}
			
			jsonCreate.put("nunaliit_layers", nunaliit_layers);
		}
		
		JSONObject jsonDoc = new JSONObject();
		jsonCreate.put(getSchemaName(), jsonDoc);

		for(SchemaAttribute attribute : attributes){
			attribute.addCreateField(jsonCreate, jsonDoc);
		}
		
		return jsonCreate;
	}
	
	public JSONArray computeExportField() throws Exception {
		JSONArray jsonExport = new JSONArray();

//		// id
//		{
//			JSONObject o = new JSONObject();
//			o.put("select", "_id");
//			o.put("label", "id");
//			o.put("type", "text");
//			jsonExport.put(o);
//		}
//
//		// rev
//		{
//			JSONObject o = new JSONObject();
//			o.put("select", "_rev");
//			o.put("label", "rev");
//			o.put("type", "text");
//			jsonExport.put(o);
//		}

		String schemaName = getSchemaName();
		for(SchemaAttribute attribute : attributes){
			attribute.addExportField(jsonExport, schemaName);
		}
		
		return jsonExport;
	}
	
	public void printBrief(PrintWriter pw) throws Exception {
		String schemaClass = getSchemaClass();
		String schemaStructure = getSchemaStructure();

		pw.print("<span class=\""+schemaClass+"_brief\">");

		if( null != label ){
			pw.print("<span class=\"n2s_localize "+schemaClass+"_brief_decoration\">");
			pw.print(label);
		} else {
			pw.print("<span class=\""+schemaClass+"_brief_decoration\">");
			pw.print( getSchemaName() );
		}

		pw.print("(</span>");
		
		boolean first = true;
		for(SchemaAttribute attribute : attributes){
			boolean printed = attribute.printBrief(pw,schemaStructure,schemaClass,first);
			if( printed ){
				first = false;
			}
		}
		
		pw.print("<span class=\""+schemaClass+"_brief_decoration\">)</span>");

		pw.print("</span>");
	}
	
	public void printDisplay(PrintWriter pw) throws Exception {
		String schemaClass = getSchemaClass();
		String schemaStructure = getSchemaStructure();
		
		pw.println("<div class=\"n2_documentDisplay\"><div class=\"n2_layoutFloat\">");
		pw.println("<div class=\""+schemaClass+"\">");

		for(SchemaAttribute attribute : attributes){
			attribute.printDisplay(pw,schemaStructure,schemaClass);
		}
		
		pw.println("</div>");
		pw.println("</div></div>");
	}
	
	public void printForm(PrintWriter pw) throws Exception {
		String schemaClass = getSchemaClass();
		String schemaStructure = getSchemaStructure();
		
		pw.println("<div class=\"n2_documentForm\"><div class=\"n2_layoutFloat\">");
		pw.println("<div class=\""+schemaClass+"\">");

		for(SchemaAttribute attribute : attributes){
			attribute.printForm(pw,schemaStructure,schemaClass);
		}
		
		pw.println("</div>");
		pw.println("</div></div>");
	}
}
