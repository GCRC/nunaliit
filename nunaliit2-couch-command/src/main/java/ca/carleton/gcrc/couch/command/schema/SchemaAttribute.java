package ca.carleton.gcrc.couch.command.schema;

import java.io.PrintWriter;
import java.net.URLEncoder;
import java.util.List;
import java.util.Vector;

import org.json.JSONArray;
import org.json.JSONObject;

public class SchemaAttribute {
	
	static public SchemaAttribute fromJson(JSONObject jsonAttr) throws Exception {
		String type = jsonAttr.getString("type");
		
		// Adjust type from legacy "textarea" and "localizedtextarea"
		if( "textarea".equals(type) ){
			jsonAttr.put("textarea", true);
			type = "string";
			
		} else if( "localizedtextarea".equals(type) ){
			jsonAttr.put("textarea", true);
			type = "localized";
		}
		
		SchemaAttribute attribute = new SchemaAttribute(type);

		// id
		{
			String id = jsonAttr.optString("id",null);
			if( null != id ){
				attribute.setId(id);
			}
		}

		// label
		{
			String label = jsonAttr.optString("label",null);
			if( null != label ){
				attribute.setLabel(label);
			}
		}

		// textarea
		{
			boolean textarea = jsonAttr.optBoolean("textarea",false);
			attribute.setTextarea(textarea);
		}
		
		// elementType
		{
			String elementType = jsonAttr.optString("elementType",null);
			if( null != elementType ){
				attribute.setElementType(elementType);
			}
		}
		
		// referenceType
		{
			String referenceType = jsonAttr.optString("referenceType",null);
			if( null != referenceType ){
				attribute.setReferenceType(referenceType);
			}
		}
		
		// customType
		{
			String customType = jsonAttr.optString("customType",null);
			if( null != customType ){
				attribute.setCustomType(customType);
			}
		}
		
		// searchFunction
		{
			String searchFunction = jsonAttr.optString("searchFunction",null);
			if( null != searchFunction ){
				attribute.setSearchFunction(searchFunction);
			}
		}

		// includedInBrief
		{
			boolean includedInBrief = jsonAttr.optBoolean("includedInBrief",false);
			attribute.setIncludeInBrief(includedInBrief);
		}

		// excludedFromDisplay
		{
			boolean excludedFromDisplay = jsonAttr.optBoolean("excludedFromDisplay",false);
			attribute.setExcludedFromDisplay(excludedFromDisplay);
		}

		// excludedFromForm
		{
			boolean excludedFromForm = jsonAttr.optBoolean("excludedFromForm",false);
			attribute.setExcludedFromForm(excludedFromForm);
		}

		// excludedFromExport
		{
			boolean excludedFromExport = jsonAttr.optBoolean("excludedFromExport",false);
			attribute.setExcludedFromExport(excludedFromExport);
		}

		// urlsToLinks
		{
			boolean urlsToLinks = jsonAttr.optBoolean("urlsToLinks",false);
			attribute.setUrlsToLinks(urlsToLinks);
		}

		// options
		{
			JSONArray jsonOptions = jsonAttr.optJSONArray("options");
			if( null != jsonOptions ){
				for(int i=0,e=jsonOptions.length(); i<e; ++i){
					JSONObject jsonOption = jsonOptions.getJSONObject(i);
					SelectionOption option = SelectionOption.fromJson(jsonOption);
					attribute.addOption(option);
				}
			}
		}

		// checkboxes
		{
			JSONArray jsonCheckboxes = jsonAttr.optJSONArray("checkboxes");
			if( null != jsonCheckboxes ){
				for(int i=0,e=jsonCheckboxes.length(); i<e; ++i){
					JSONObject jsonItem = jsonCheckboxes.getJSONObject(i);
					CheckboxGroupItem item = CheckboxGroupItem.fromJson(jsonItem);
					attribute.addCheckbox(item);
				}
			}
		}

		// wikiTransform
		{
			boolean wikiTransform = jsonAttr.optBoolean("wikiTransform",false);
			attribute.setWikiTransform(wikiTransform);
		}

		// maxHeight
		{
			Object test = jsonAttr.opt("maxHeight");
			if( null != test ){
				int maxHeight = jsonAttr.optInt("maxHeight");
				if( maxHeight > 0 ){
					attribute.setMaxHeight(maxHeight);
				}
			}
		}

		// uploadOptional
		{
			boolean uploadOptional = jsonAttr.optBoolean("uploadOptional",false);
			attribute.setUploadOptional(uploadOptional);
		}

		// placeholder
		{
			String placeholder = jsonAttr.optString("placeholder",null);
			attribute.setPlaceholder(placeholder);
		}

		// maxAudioRecordingLengthSeconds
		{
			int maxAudioRecordingLengthSeconds = jsonAttr.optInt("maxAudioRecordingLengthSeconds",-1);
			if( maxAudioRecordingLengthSeconds > 0 ) {
				attribute.setMaxAudioRecordingLengthSeconds(maxAudioRecordingLengthSeconds);
			}
		}

		// maxVideoRecordingLengthSeconds
		{
			int maxVideoRecordingLengthSeconds = jsonAttr.optInt("maxVideoRecordingLengthSeconds",-1);
			if( maxVideoRecordingLengthSeconds > 0 ) {
				attribute.setMaxVideoRecordingLengthSeconds(maxVideoRecordingLengthSeconds);
			}
		}

		// recordVideoSize
		{
			String recordVideoSize = jsonAttr.optString("recordVideoSize");
			if(null != recordVideoSize && recordVideoSize.matches("\\d+x\\d+")) {
				attribute.setRecordVideoSize(recordVideoSize);
			}
		}
		
		return attribute;
	}

	private String type;
	private String id;
	private String label;
	private boolean textarea;
	private boolean includedInBrief;
	private boolean excludedFromDisplay;
	private boolean excludedFromForm;
	private boolean excludedFromExport;
	private boolean urlsToLinks;
	private List<SelectionOption> options = new Vector<SelectionOption>();
	private List<CheckboxGroupItem> checkboxes = new Vector<CheckboxGroupItem>();
	private String elementType;
	private String referenceType;
	private String customType;
	private String searchFunction;
	private boolean wikiTransform;
	private Integer maxHeight = null;
	private boolean uploadOptional = false;
	private Integer maxAudioRecordingLengthSeconds = null;
	private Integer maxVideoRecordingLengthSeconds = null;
	private String recordVideoSize = null;
	private String placeholder = null;

	public SchemaAttribute(String type){
		this.type = type;
	}
	
	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getLabel() {
		return label;
	}

	public void setLabel(String label) {
		this.label = label;
	}

	public boolean isTextarea() {
		return textarea;
	}

	public void setTextarea(boolean textarea) {
		this.textarea = textarea;
	}

	public boolean isIncludedInBrief() {
		return includedInBrief;
	}

	public void setIncludeInBrief(boolean includedInBrief) {
		this.includedInBrief = includedInBrief;
	}

	public boolean isExcludedFromDisplay() {
		return excludedFromDisplay;
	}

	public void setExcludedFromDisplay(boolean excludedFromDisplay) {
		this.excludedFromDisplay = excludedFromDisplay;
	}

	public boolean isExcludedFromForm() {
		return excludedFromForm;
	}

	public void setExcludedFromForm(boolean excludedFromForm) {
		this.excludedFromForm = excludedFromForm;
	}

	public boolean isExcludedFromExport() {
		return excludedFromExport;
	}

	public void setExcludedFromExport(boolean excludedFromExport) {
		this.excludedFromExport = excludedFromExport;
	}

	public boolean isUrlsToLinks() {
		return urlsToLinks;
	}

	public void setUrlsToLinks(boolean urlsToLinks) {
		this.urlsToLinks = urlsToLinks;
	}

	public List<SelectionOption> getOptions() {
		return options;
	}

	public void addOption(SelectionOption option) {
		this.options.add(option);
	}
	
	public SelectionOption getDefaultOption(){
		SelectionOption defOption = null;
		
		for(SelectionOption option : options){
			if( option.isDefault() ){
				defOption = option;
				break;
			}
		}
		
		return defOption;
	}

	public List<CheckboxGroupItem> getCheckboxes() {
		return checkboxes;
	}

	public void addCheckbox(CheckboxGroupItem item) {
		checkboxes.add(item);
	}
	
	public String getElementType() {
		return elementType;
	}

	public void setElementType(String elementType) {
		this.elementType = elementType;
	}

	public String getReferenceType() {
		return referenceType;
	}

	public void setReferenceType(String referenceType) {
		this.referenceType = referenceType;
	}

	public String getCustomType() {
		return customType;
	}

	public void setCustomType(String customType) {
		this.customType = customType;
	}

	public String getSearchFunction() {
		return searchFunction;
	}

	public void setSearchFunction(String searchFunction) {
		this.searchFunction = searchFunction;
	}

	public boolean isWikiTransform() {
		return wikiTransform;
	}

	public void setWikiTransform(boolean wikiTransform) {
		this.wikiTransform = wikiTransform;
	}

	public Integer getMaxHeight() {
		return maxHeight;
	}

	public void setMaxHeight(Integer maxHeight) {
		this.maxHeight = maxHeight;
	}

	public boolean isUploadOptional() {
		return uploadOptional;
	}

	public void setUploadOptional(boolean uploadOptional) {
		this.uploadOptional = uploadOptional;
	}

	public String getPlaceholder() {
		return placeholder;
	}

	public void setPlaceholder(String placeholder) {
		this.placeholder = placeholder;
	}

	public Integer getMaxAudioRecordingLengthSeconds() {
		return maxAudioRecordingLengthSeconds;
	}

	public void setMaxAudioRecordingLengthSeconds(Integer maxAudioRecordingLengthSeconds) {
		this.maxAudioRecordingLengthSeconds = maxAudioRecordingLengthSeconds;
	}

	public Integer getMaxVideoRecordingLengthSeconds() { return maxVideoRecordingLengthSeconds; }

	public void setMaxVideoRecordingLengthSeconds(Integer maxVideoRecordingLengthSeconds) {
		this.maxVideoRecordingLengthSeconds = maxVideoRecordingLengthSeconds;
	}

	public String getRecordVideoSize() { return recordVideoSize; }

	public void setRecordVideoSize(String recordVideoSize) { this.recordVideoSize = recordVideoSize; }

	public JSONObject toJson() throws Exception {
		JSONObject jsonAttr = new JSONObject();
		
		jsonAttr.put("type", type);
		
		if( null != id ) jsonAttr.put("id", id);
		if( null != label ) jsonAttr.put("label", label);
		if( null != elementType ) jsonAttr.put("elementType", elementType);
		if( null != referenceType ) jsonAttr.put("referenceType", referenceType);
		if( null != customType ) jsonAttr.put("customType", customType);
		if( null != searchFunction ) jsonAttr.put("searchFunction", searchFunction);
		if( includedInBrief ) jsonAttr.put("includedInBrief", true);
		if( excludedFromDisplay ) jsonAttr.put("excludedFromDisplay", true);
		if( excludedFromForm ) jsonAttr.put("excludedFromForm", true);
		if( excludedFromExport ) jsonAttr.put("excludedFromExport", true);
		if( urlsToLinks ) jsonAttr.put("urlsToLinks", true);
		if( wikiTransform ) jsonAttr.put("wikiTransform", true);
		if( null != maxHeight ) jsonAttr.put("maxHeight", maxHeight.intValue());
		if( uploadOptional ) jsonAttr.put("uploadOptional", true);
		if( null != placeholder ) jsonAttr.put("placeholder", placeholder);
		if( null != maxAudioRecordingLengthSeconds ) jsonAttr.put("maxAudioRecordingLengthSeconds", maxAudioRecordingLengthSeconds.intValue());
		if( null != maxVideoRecordingLengthSeconds ) jsonAttr.put("maxVideoRecordingLengthSeconds", maxVideoRecordingLengthSeconds.intValue());
		if( null != recordVideoSize ) jsonAttr.put("recordVideoSize", recordVideoSize);

		if( options.size() > 0 ){
			JSONArray jsonOptions = new JSONArray();
			
			for(SelectionOption option : options){
				JSONObject jsonOption = option.toJson();
				jsonOptions.put(jsonOption);
			}
			
			jsonAttr.put("options",jsonOptions);
		}

		if( checkboxes.size() > 0 ){
			JSONArray jsonCheckboxes = new JSONArray();
			
			for(CheckboxGroupItem item : checkboxes){
				JSONObject jsonItem = item.toJson();
				jsonCheckboxes.put(jsonItem);
			}
			
			jsonAttr.put("checkboxes",jsonCheckboxes);
		}
		
		return jsonAttr;
	}

	public void addCreateField(JSONObject doc, JSONObject schemaDoc) throws Exception {
		if( "title".equals(type) ){
			// nothing to do
			
		} else if( "string".equals(type) ){
			if( null != id ){
				schemaDoc.put(id, "");
			}
			
		} else if( "localized".equals(type) ){
			if( null != id ){
				schemaDoc.put(id, JSONObject.NULL);
			}
			
		} else if( "date".equals(type) ){
			// leave date attributes as undefined
			
		} else if( "reference".equals(type) ){
			// leave reference attributes as undefined
			
		} else if( "custom".equals(type) ){
			// leave custom attributes as undefined
			
		} else if( "array".equals(type) ){
			if( null != id ){
				JSONArray arr = new JSONArray();
				schemaDoc.put(id, arr);
			}
			
		} else if( "selection".equals(type) ){
			if( null != id ){
				SelectionOption defOption = getDefaultOption();
				if( null == defOption ){
					schemaDoc.put(id, "");
				} else {
					schemaDoc.put(id, defOption.getValue());
				}
			}
			
		} else if( "checkbox".equals(type) ){
			if( null != id ){
				schemaDoc.put(id, false);
			}
			
		} else if( "checkbox_group".equals(type) ){
			for(CheckboxGroupItem item : checkboxes){
				String itemId = item.getId();
				schemaDoc.put(itemId, false);
			}
			
		} else if( "file".equals(type) ){
			JSONObject attachments = doc.optJSONObject("nunaliit_attachments");
			if( null == attachments ){
				attachments = new JSONObject();
				attachments.put("nunaliit_type", "attachment_descriptions");
				attachments.put("files", new JSONObject());
				doc.put("nunaliit_attachments", attachments);
			}
            if( null != maxAudioRecordingLengthSeconds && maxAudioRecordingLengthSeconds.intValue() > 0 ){
                doc.put("nunaliit_maxAudioRecordingLengthSeconds", maxAudioRecordingLengthSeconds);
            }
			if( null != maxVideoRecordingLengthSeconds && maxVideoRecordingLengthSeconds.intValue() > 0 ){
				doc.put("nunaliit_maxVideoRecordingLengthSeconds", maxVideoRecordingLengthSeconds);
			}
			if( null != recordVideoSize ){
				doc.put("nunaliit_recordVideoSize", recordVideoSize);
			}

			JSONObject files = attachments.getJSONObject("files");
			JSONObject media = files.optJSONObject("media");
			if( null == media ){
				media = new JSONObject();
				
				media.put("data", new JSONObject());
				
				if( isUploadOptional() ){
					media.put("_compulsory", false);
				}

				files.put("media", media);
			}

		} else if( "geometry".equals(type) ){
			if( null != id ){
				throw new Exception("'id' should not be specified for attributes of type 'geometry'");
			}

			//doc.put("nunaliit_geom", null);

		} else if( "hover_sound".equals(type) ){
			if( null != id ){
				throw new Exception("'id' should not be specified for attributes of type 'hover_sound'");
			}

		} else if( "createdBy".equals(type) ){
			if( null != id ){
				throw new Exception("'id' should not be specified for attributes of type 'createdBy'");
			}

		} else if( "createdTime".equals(type) ){
			if( null != id ){
				throw new Exception("'id' should not be specified for attributes of type 'createdTime'");
			}

		} else {
			throw new Exception("Unable to include type "+type+" in create");
		}
	}

	public boolean printBrief(PrintWriter pw, String schemaStructure, String schemaClass, boolean isFirst) throws Exception {
		boolean printed = false;
		
		if( includedInBrief ){
			if( "title".equals(type) ){
				
			} else if( "string".equals(type) ){
				if( null != id ){
					pw.println("\t{{#"+schemaStructure+"}}");
					pw.println("\t\t{{#if "+id+"}}");
					pw.print("\t\t\t<span class=\""+schemaClass+"_"+id+"\">");
					if( !isFirst ) pw.print(" ");
					pw.print("{{"+id+"}}");
					pw.println("</span>");
					pw.println("\t\t{{/if}}");
					pw.println("\t{{/"+schemaStructure+"}}");
					printed = true;
				}
				
			} else if( "localized".equals(type) ){
				if( null != id ){
					pw.println("\t{{#"+schemaStructure+"}}");
					pw.println("\t\t{{#if "+id+"}}");
					pw.print("\t\t\t<span class=\""+schemaClass+"_"+id+"\">");
					if( !isFirst ) pw.print(" ");
					pw.print("{{#:localize}}"+id+"{{/:localize}}");
					pw.println("</span>");
					pw.println("\t\t{{/if}}");
					pw.println("\t{{/"+schemaStructure+"}}");
					printed = true;
				}
				
			} else if( "selection".equals(type) ){
				if( null != id ){
					pw.println("\t{{#"+schemaStructure+"}}");
					pw.println("\t\t{{#if "+id+"}}");
					pw.println("\t\t\t<span class=\"n2s_select "+schemaClass+"_"+id+"\" n2-choice=\"{{"+id+"}}\">");
					if( !isFirst ) pw.print(" ");
					for(SelectionOption option : options){
						pw.print("\t\t\t\t<span class=\"n2s_choice n2s_localize\" n2-choice=\""+option.getValue()+"\">");
						String label = option.getLabel();
						if( null == label ){
							label = option.getValue();
						}
						pw.print(label);
						pw.print("</span>");
					}
					pw.println("\t\t\t</span>");
					pw.println("\t\t{{/if}}");
					pw.println("\t{{/"+schemaStructure+"}}");
					printed = true;
				}
				
			} else if( "date".equals(type) ){
				if( null != id ){
					pw.println("\t{{#"+schemaStructure+"}}");
					pw.println("\t\t{{#if "+id+"}}");
					pw.print("\t\t\t<span class=\""+schemaClass+"_"+id+"\">");
					pw.print("{{#"+id+"}}");
					if( !isFirst ) pw.print(" ");
					pw.print("{{date}}");
					pw.print("{{/"+id+"}}");
					pw.println("</span>");
					pw.println("\t\t{{/if}}");
					pw.println("\t{{/"+schemaStructure+"}}");
					printed = true;
				}
				
			} else if( "reference".equals(type) ){
				if( null != id ){
					pw.println("\t{{#"+schemaStructure+"}}");
					pw.println("\t\t{{#if "+id+"}}");
					pw.println("\t\t\t<span class=\""+schemaClass+"_"+id+"\">");
					pw.println("\t\t\t\t{{#"+id+"}}");
					pw.println("\t\t\t\t\t{{#doc}}");
					if( !isFirst ) pw.print(" ");
					pw.println("\t\t\t\t\t\t<span class=\"n2s_briefDisplay\">{{.}}</span>");
					pw.println("\t\t\t\t\t{{/doc}}");
					pw.println("\t\t\t\t{{/"+id+"}}");
					pw.println("\t\t\t</span>");
					pw.println("\t\t{{/if}}");
					pw.println("\t{{/"+schemaStructure+"}}");
					printed = true;
				}
				
			} else if( "custom".equals(type) ){
				if( null != id && null != customType ){
					pw.println("\t{{#"+schemaStructure+"}}");
					pw.println("\t\t{{#if "+id+"}}");
					pw.println("\t\t\t<span class=\""+schemaClass+"_"+id+"\">");
					if( !isFirst ) pw.println(" ");
					pw.println("\t\t\t\t<span class=\"n2s_custom\""
							+ " nunaliit-custom=\""+customType+"\""
							+ " nunaliit-selector=\"{{#:selector}}"+id+"{{/:selector}}\"></span>");
					pw.println("\t\t\t</span>");
					pw.println("\t\t{{/if}}");
					pw.println("\t{{/"+schemaStructure+"}}");
					printed = true;
				}
				
			} else if( "array".equals(type) ){
				if( null != id ){
					pw.println("\t{{#"+schemaStructure+"}}");
					pw.println("\t\t{{#if "+id+"}}");
					pw.println("\t\t\t<span class=\""+schemaClass+"_"+id+"\">");
					pw.print("\t\t\t\t{{#"+id+"}}");
					if( !isFirst ) pw.print(" ");
					
					if( "string".equals(elementType) ){
						pw.print("{{.}}");
						
					} else if( "localized".equals(elementType) ){
						pw.print("{{#:localize}}.{{/:localize}}");
						
					} else if( "date".equals(elementType) ){
						pw.print("{{date}}");
						
					} else if( "reference".equals(elementType) ){
						pw.print("{{#doc}}");
						pw.print("<span class=\"n2s_briefDisplay\">{{.}}</span>");
						pw.print("{{/doc}}");
					}
					
					pw.println("{{/"+id+"}}");
					pw.println("\t\t\t</span>");
					pw.println("\t\t{{/if}}");
					pw.println("\t{{/"+schemaStructure+"}}");
					printed = true;
				}

			} else if( "geometry".equals(type) ){
				if( null != id ){
					throw new Exception("'id' should not be specified for attributes of type 'geometry'");
				}

				pw.println("\t{{#nunaliit_geom}}");
				pw.println("\t\t{{#if wkt}}");
				pw.println("\t\t\t<span class=\"nunaliit_geom_wkt "+schemaClass+"_geom\">{{wkt}}</span>");
				pw.println("\t\t{{/if}}");
				pw.println("\t{{/nunaliit_geom}}");

			} else if( "hover_sound".equals(type) ){
				if( null != id ){
					throw new Exception("'id' should not be specified for attributes of type 'hover_sound'");
				}

				pw.println("\t{{#nunaliit_hoverSound}}");
				pw.println("\t\t{{#if doc}}");
				pw.println("\t\t\t<span class=\"nunaliit_hoversound "+schemaClass+"_hoversound\">");
				pw.print("\t\t\t\t{{#doc}}");
				if( !isFirst ) pw.print(" ");
				pw.println("\t\t\t\t\t<span class=\"n2s_briefDisplay\">{{.}}</span>");
				pw.println("\t\t\t\t{{/doc}}");
				pw.println("\t\t\t</span>");
				pw.println("\t\t{{/if}}");
				pw.println("\t{{/nunaliit_hoverSound}}");

			} else if( "createdBy".equals(type) ){
				pw.println("\t{{#nunaliit_created}}");
				pw.println("\t\t<span class=\"n2s_insertUserName "+schemaClass+"_createdBy\">{{name}}</span>");
				pw.println("\t{{/nunaliit_created}}");

			} else if( "createdTime".equals(type) ){
				pw.println("\t{{#nunaliit_created}}");
				pw.println("\t\t<span class=\"n2s_insertTime "+schemaClass+"_createdTime\">{{time}}</span>");
				pw.println("\t{{/nunaliit_created}}");
					
			} else {
				throw new Exception("Unable to include type "+type+" in brief");
			}
		}
		
		return printed;
	}

	public void printDisplay(PrintWriter pw, String schemaStructure, String schemaClass) throws Exception {
		if( false == excludedFromDisplay ){
			String label = this.label;
			String labelLocalizeClass = " n2s_localize";
			if( null == label ){
				label = id;
				labelLocalizeClass = "";
			}

			if( "title".equals(type) ) {
				pw.println("<div class=\"title mdc-typography--headline6\">");

				pw.println("\t<div class=\"value"+labelLocalizeClass+"\">"+label+"</div>");
				pw.println("\t<div class=\"end\"></div>");
				
				pw.println("</div>");
				
			} else if( "string".equals(type)
			 || "localized".equals(type) ){
				if( null != id ){
					pw.println("{{#"+schemaStructure+"}}");
					pw.println("\t{{#if "+id+"}}");

					pw.println("\t\t<div class=\""+schemaClass+"_"+id+"\">");

					pw.println("\t\t\t<div class=\"label"+labelLocalizeClass+" mdc-typography--subtitle2\">"+label+"</div>");

					String fixUrlClass = "";
					String fixMaxHeight = "";
					if( urlsToLinks ){
						fixUrlClass += " n2s_convertTextUrlToLink";
					}
					if( wikiTransform ){
						fixUrlClass += " n2s_wikiTransform";
					} else if( isTextarea() ){
						fixUrlClass += " n2s_preserveSpaces";
						
						if( null != maxHeight && maxHeight.intValue() > 0 ){
							fixUrlClass += " n2s_installMaxHeight";
							fixMaxHeight = " _maxheight=\"" + maxHeight.intValue() + "\"";
						}
					}
					
					if( "string".equals(type) ){
						pw.println("\t\t\t<div class=\"value"+fixUrlClass+"\"" + fixMaxHeight + ">{{"+id+"}}</div>");

					} else if( "localized".equals(type) ){
						pw.println("\t\t\t<div class=\"value"+fixUrlClass+"\"" + fixMaxHeight + ">{{#:localize}}"+id+"{{/:localize}}</div>");
					}
					
					pw.println("\t\t\t<div class=\"end\"></div>");
					
					pw.println("\t\t</div>");
					
					pw.println("\t{{/if}}");
					pw.println("{{/"+schemaStructure+"}}");
				}
				
			} else if( "date".equals(type) ){
				if( null != id ){
					pw.println("{{#"+schemaStructure+"}}");
					pw.println("\t{{#"+id+"}}");

					pw.println("\t\t<div class=\""+schemaClass+"_"+id+"\">");

					pw.println("\t\t\t<div class=\"label"+labelLocalizeClass+" mdc-typography--subtitle2\">"+label+"</div>");
					pw.println("\t\t\t<div class=\"value\">{{date}}</div>");
					pw.println("\t\t\t<div class=\"end\"></div>");
					
					pw.println("\t\t</div>");
					
					
					pw.println("\t{{/"+id+"}}");
					pw.println("{{/"+schemaStructure+"}}");
				}

			} else if( "reference".equals(type) ){
				if( null != id ){
					pw.println("{{#"+schemaStructure+"}}");
					pw.println("\t{{#"+id+"}}");

					pw.println("\t\t<div class=\""+schemaClass+"_"+id+"\">");

					pw.println("\t\t\t<div class=\"label"+labelLocalizeClass+" mdc-typography--subtitle2\">"+label+"</div>");
					
					if( "thumbnail".equals(referenceType) ){
						pw.println("\t\t\t<div class=\"value n2s_insertFirstThumbnail\" nunaliit-document=\"{{doc}}\"></div>");
					} else {
						pw.println("\t\t\t<div class=\"value\"><a href=\"#\" class=\"n2s_referenceLink\">{{doc}}</a></div>");
					}

					pw.println("\t\t\t<div class=\"end\"></div>");
					
					pw.println("\t\t</div>");
					
					
					pw.println("\t{{/"+id+"}}");
					pw.println("{{/"+schemaStructure+"}}");
				}

			} else if( "custom".equals(type) ){
				if( null != id && null != customType ){
					pw.println("{{#"+schemaStructure+"}}");
					pw.println("\t{{#if "+id+"}}");

					pw.println("\t\t<div class=\""+schemaClass+"_"+id+"\">");

					pw.println("\t\t\t<div class=\"label"+labelLocalizeClass+" mdc-typography--subtitle2\">"+label+"</div>");
					
					pw.println("\t\t\t<div class=\"value n2s_custom\""
							+ " nunaliit-custom=\""+customType+"\""
							+ " nunaliit-selector=\"{{#:selector}}"+id+"{{/:selector}}\">"
							+ "</div>");

					pw.println("\t\t\t<div class=\"end\"></div>");
					
					pw.println("\t\t</div>");
					
					
					pw.println("\t{{/if}}");
					pw.println("{{/"+schemaStructure+"}}");
				}
				
			} else if( "array".equals(type) ){
				if( null != id ){

					pw.println("{{#"+schemaStructure+"}}");
					pw.println("\t{{#if "+id+"}}");

					pw.println("\t<div class=\""+schemaClass+"_"+id+"\">");

					pw.println("\t\t<div class=\"label"+labelLocalizeClass+" mdc-typography--subtitle2\">"+label+"</div>");
					pw.println("\t\t<div class=\"value\">");
					pw.println("\t\t{{#"+id+"}}");
					pw.print("\t\t\t<div class=\"array_element");
					if( urlsToLinks ){
						pw.print(" n2s_convertTextUrlToLink");
					}
					if( isTextarea() ){
						pw.print(" n2s_preserveSpaces");
						if( null != maxHeight && maxHeight.intValue() > 0 ){
							pw.print(" n2s_installMaxHeight\" _maxheight=\""+maxHeight.intValue());
						}
					}
					pw.println("\">");
					
					if( "string".equals(elementType) ){
						pw.println("{{.}}");
					} else if( "localized".equals(elementType) ){
						pw.println("{{#:localize}}.{{/:localize}}");
					} else if( "date".equals(elementType) ){
						pw.println("{{date}}");
					} else if( "reference".equals(elementType) ){
						pw.println("\t\t\t\t<a href=\"#\" class=\"n2s_referenceLink\">{{doc}}</a>");
					} else if( "custom".equals(elementType) ){
						if( null != customType ){
							pw.println("\t\t\t\t<span class=\"n2s_custom\""
								+ " nunaliit-custom=\""+customType+"\""
								+ " nunaliit-selector=\"{{#:selector}}.{{/:selector}}\"></span>");
						}
					}
					
					pw.println("\t\t\t</div>");
					pw.println("\t\t{{/"+id+"}}");
					pw.println("\t\t</div>");
					pw.println("\t\t<div class=\"end\"></div>");
					
					pw.println("\t</div>");
					
					pw.println("\t{{/if}}");
					pw.println("{{/"+schemaStructure+"}}");
				}

			} else if( "selection".equals(type) ){
				if( null != id ){
					pw.println("{{#"+schemaStructure+"}}");
					pw.println("\t{{#if "+id+"}}");
	
					pw.println("\t\t<div class=\""+schemaClass+"_"+id+"\">");
	
					pw.println("\t\t\t<div class=\"label"+labelLocalizeClass+" mdc-typography--subtitle2\">"+label+"</div>");
					pw.println("\t\t\t<div class=\"value n2s_select\" n2-choice=\"{{"+id+"}}\">");
					
					for(SelectionOption option : options){
						String value = option.getValue();
						String optLabel = option.getLabel();
						if( null == optLabel ){
							optLabel = value;
						}
						
						pw.println("\t\t\t\t<span class=\"n2s_choice n2s_localize\" n2-choice=\""+value+"\">"+optLabel+"</span>");
					}

					pw.println("\t\t\t\t<span class=\"n2s_choiceDefault\">{{"+id+"}}</span>");
					
					pw.println("\t\t\t</div>");
					pw.println("\t\t\t<div class=\"end\"></div>");
					
					pw.println("\t\t</div>");
					
					
					pw.println("\t{{/if}}");
					pw.println("{{/"+schemaStructure+"}}");
				}

			} else if( "checkbox".equals(type) ){
				if( null != id ){
					pw.println("{{#"+schemaStructure+"}}");

					pw.println("\t\t<div class=\""+schemaClass+"_"+id+"\">");

					pw.println("\t\t\t<div class=\"label"+labelLocalizeClass+" mdc-typography--subtitle2\">"+label+"</div>");
					pw.println("\t\t\t<div class=\"value\">");
					pw.println("\t\t\t\t{{#if "+id+"}}");
					pw.println("\t\t\t\t\t<span class=\"n2s_localize\">Yes</span>");
					pw.println("\t\t\t\t{{else}}");
					pw.println("\t\t\t\t\t<span class=\"n2s_localize\">No</span>");
					pw.println("\t\t\t\t{{/if}}");
					pw.println("\t\t\t</div>");
					pw.println("\t\t\t<div class=\"end\"></div>");
					
					pw.println("\t\t</div>");
					
					
					pw.println("{{/"+schemaStructure+"}}");
				}

			} else if( "checkbox_group".equals(type) ){
				if( null != id ){
					pw.println("{{#"+schemaStructure+"}}");

					pw.println("\t\t<div class=\""+schemaClass+"_"+id+"\">");

					pw.println("\t\t\t<div class=\"label"+labelLocalizeClass+" mdc-typography--subtitle2\">"+label+"</div>");
					pw.println("\t\t\t<div class=\"value\">");
					for(CheckboxGroupItem item : checkboxes){
						String itemId = item.getId();
						String itemLabel = item.getLabel();
						pw.println("\t\t\t\t{{#"+itemId+"}}");
						if( null == itemLabel ){
							pw.println("\t\t\t\t\t<div>"+itemId+"</div>");
						} else {
							pw.println("\t\t\t\t\t<div class=\"n2s_localize\">"+itemLabel+"</div>");
						}
						pw.println("\t\t\t\t{{/"+itemId+"}}");
					}
					pw.println("\t\t\t</div>");
					pw.println("\t\t\t<div class=\"end\"></div>");
					
					pw.println("\t\t</div>");
					
					
					pw.println("{{/"+schemaStructure+"}}");
				}
				
			} else if( "file".equals(type) ){
				pw.println("{{#nunaliit_attachments}}");
				pw.println("{{#files}}");
				pw.println("\t{{#:iterate}}");
				pw.println("\t\t{{#value}}");
				pw.println("\t\t\t{{^source}}");

				pw.println("\t\t\t\t{{#attachmentName}}");
				pw.println("\t\t\t\t\t<div class=\"n2_mediaView\">");
				pw.println("\t\t\t\t\t\t<div class=\"n2s_insertMediaView\" nunaliit-attachment=\"{{.}}\"> </div>");
				pw.println("\t\t\t\t\t</div>");
				pw.println("\t\t\t\t{{/attachmentName}}");

				pw.println("\t\t\t{{/source}}");
				pw.println("\t\t{{/value}}");
				pw.println("\t{{/:iterate}}");
				pw.println("{{/files}}");
				pw.println("{{/nunaliit_attachments}}");

			} else if( "geometry".equals(type) ){
				if( null != id ){
					throw new Exception("'id' should not be specified for attributes of type 'geometry'");
				}

				pw.println("{{#nunaliit_geom}}");
				pw.println("\t\t<div class=\"nunaliit_geom\">");
				pw.println("\t\t\t<div class=\"label"+labelLocalizeClass+" mdc-typography--subtitle2\">"+label+"</div>");
				pw.println("\t\t\t<div class=\"value\">{{wkt}}</div>");
				pw.println("\t\t\t<div class=\"end\"></div>");
				pw.println("\t\t</div>");
				pw.println("{{/nunaliit_geom}}");

			} else if( "hover_sound".equals(type) ){
				if( null != id ){
					throw new Exception("'id' should not be specified for attributes of type 'hover_sound'");
				}

				pw.println("{{#nunaliit_hoverSound}}");
				pw.println("\t\t<div class=\"nunaliit_hoverSound\">");
				pw.println("\t\t\t<div class=\"label"+labelLocalizeClass+" mdc-typography--subtitle2\">"+label+"</div>");
				pw.println("\t\t\t<div class=\"value\"><a href=\"#\" class=\"n2s_referenceLink\">{{doc}}</a></div>");
				pw.println("\t\t\t<div class=\"end\"></div>");
				pw.println("\t\t</div>");
				pw.println("{{/nunaliit_hoverSound}}");

			} else if( "createdBy".equals(type) ){
				if( null == label ){
					label = "Created By";
					labelLocalizeClass = " n2s_localize";
				}

				pw.println("{{#nunaliit_created}}");
				pw.println("\t{{#if name}}");

				pw.println("\t\t<div class=\""+schemaClass+"_nunaliit_created\">");

				pw.println("\t\t\t<div class=\"label"+labelLocalizeClass+" mdc-typography--subtitle2\">"+label+"</div>");

				pw.println("\t\t\t<div class=\"value n2s_insertUserName\">{{name}}</div>");
				
				pw.println("\t\t\t<div class=\"end\"></div>");
				
				pw.println("\t\t</div>");
				
				pw.println("\t{{/if}}");
				pw.println("{{/nunaliit_created}}");

			} else if( "createdTime".equals(type) ){
				if( null == label ){
					label = "Created Time";
					labelLocalizeClass = " n2s_localize";
				}

				pw.println("{{#nunaliit_created}}");
				pw.println("\t{{#if time}}");

				pw.println("\t\t<div class=\""+schemaClass+"_nunaliit_created_time\">");

				pw.println("\t\t\t<div class=\"label"+labelLocalizeClass+" mdc-typography--subtitle2\">"+label+"</div>");

				pw.println("\t\t\t<div class=\"value n2s_insertTime\">{{time}}</div>");
				
				pw.println("\t\t\t<div class=\"end\"></div>");
				
				pw.println("\t\t</div>");
				
				pw.println("\t{{/if}}");
				pw.println("{{/nunaliit_created}}");
							
			} else {
				throw new Exception("Unable to include type "+type+" in display");
			}
		}
	}

	public void printForm(PrintWriter pw, String schemaStructure, String schemaClass) throws Exception {
		if( false == excludedFromForm ){
			String label = this.label;
			String labelLocalizeClass = " n2s_localize";
			if( null == label ){
				label = id;
				labelLocalizeClass = "";
			}

			if( "title".equals(type) ){
				pw.println("<div class=\"title\">");

				pw.println("\t<div class=\"value mdc-typography--headline6"+labelLocalizeClass+"\">"+label+"</div>");
				
				pw.println("</div>");

 			} else if( isTextarea() ){
				if( null != id ){
					String fieldType = "";
					fieldType += ",id="+encodeFieldParameter(id);
					fieldType += ",textarea";

					if( null != label ){
						fieldType += ",label="+encodeFieldParameter(label);
					}

					if( "localized".equals(type) ){
						fieldType += ",localized";
					} else if( "custom".equals(type) ){
						fieldType += ",custom="+encodeFieldParameter(customType);
					}
					if( isWikiTransform() ){
						fieldType += ",wikiTransform";
					}

					if( null != placeholder ){
						fieldType += ",placeholder="+encodeFieldParameter(placeholder);
					}

					pw.println("{{#"+schemaStructure+"}}");
					pw.println("<div class=\""+schemaClass+"_"+id+"\">");

					pw.println("\t<div class=\"value\">");
					pw.println("\t\t{{#:field}}"+id+fieldType+"{{/:field}}");
					pw.println("\t</div>");

					pw.println("</div>");
					pw.println("{{/"+schemaStructure+"}}");
				}

			} else if( "string".equals(type) 
			 || "localized".equals(type) 
			 || "reference".equals(type) 
			 || "custom".equals(type) 
			 || "checkbox".equals(type) 
			 || "date".equals(type) ){
				if( null != id ){
					String fieldType = "";
					fieldType += ",id="+encodeFieldParameter(id);

					if( null != label ){
						fieldType += ",label="+encodeFieldParameter(label);
					}

					if( "localized".equals(type) ){
						fieldType += ",localized";
					} else if( "date".equals(type) ){
						fieldType += ",date";
					} else if( "reference".equals(type) ){
						fieldType += ",reference";
					} else if( "custom".equals(type) ){
						fieldType += ",custom="+encodeFieldParameter(customType);
					} else if( "checkbox".equals(type) ){
						fieldType += ",checkbox";
					}

					if( isWikiTransform() ){
						fieldType += ",wikiTransform";
					}

					if( null != placeholder ){
						fieldType += ",placeholder="+encodeFieldParameter(placeholder);
					}

					if( null != searchFunction ){
						fieldType += ",search="+encodeFieldParameter(searchFunction);
					}					
					
						pw.println("{{#"+schemaStructure+"}}");
						pw.println("<div class=\""+schemaClass+"_"+id+"\">");
						pw.println("\t<div class=\"value\">");
						pw.println("\t\t{{#:field}}"+id+fieldType+"{{/:field}}");
						pw.println("\t</div>");
						pw.println("</div>");
						
						pw.println("{{/"+schemaStructure+"}}");
			 	}

			} else if( "selection".equals(type) ){
				if( null != id ){
					pw.println("{{#"+schemaStructure+"}}");

					pw.println("\t<div class=\""+schemaClass+"_"+id+"\">");

					pw.println("\t\t<div class=\"label"+labelLocalizeClass+"\">"+label+"</div>");
					pw.println("\t\t<div class=\"value\">");
					pw.println("\t\t\t<select class=\"{{#:input}}"+id+"{{/:input}}\">");
					
					for(SelectionOption option : options){
						pw.print("\t\t\t\t<option class=\"n2s_localize\" value=\""+option.getValue()+"\">");
						String optLabel = option.getLabel();
						if( null == optLabel ){
							optLabel = option.getValue();
						}
						pw.print(optLabel);
						pw.println("</option>");
					}
					
					pw.println("\t\t\t</select>");
					pw.println("\t\t</div>");
					pw.println("\t\t<div class=\"end\"></div>");
					
					pw.println("\t</div>");
					
					
					pw.println("{{/"+schemaStructure+"}}");
				}

			} else if( "array".equals(type) ){
				if( null != id ){
					String fieldType = null;
					String arrayType = "";
					if( "string".equals(elementType) ){
						fieldType = "";
						arrayType = " \"string\"";
					} else if( "localized".equals(elementType) ){
						fieldType = ",localized";
						arrayType = " \"localized\"";
					} else if( "date".equals(elementType) ){
						fieldType = ",date";
						arrayType = " \"date\"";
					} else if( "reference".equals(elementType) ){
						fieldType = ",reference";
						arrayType = " \"reference\"";
					} else if( "custom".equals(elementType) ){
						fieldType = ",custom="+customType;
						arrayType = " \"custom\"";
					}
					
					if( isTextarea() ){
						fieldType += ",textarea";
					}

					String searchFnName = "";
					if( null != searchFunction ){
						searchFnName = ",search="+searchFunction;
					}
					
					if( null != fieldType ){
						pw.println("{{#"+schemaStructure+"}}");

						pw.println("\t<div class=\""+schemaClass+"_"+id+"\">");

						pw.println("\t\t<div class=\"label"+labelLocalizeClass+"\">"+label+"</div>");
						pw.println("\t\t<div class=\"value\">");
						pw.println("\t\t\t{{#:array "+id+arrayType+"}}");
						pw.println("\t\t\t\t<div>{{#:field}}."+fieldType+searchFnName+"{{/:field}}</div>");
						pw.println("\t\t\t{{/:array}}");
						pw.println("\t\t</div>");
						pw.println("\t\t<div class=\"end\"></div>");
						
						pw.println("\t</div>");
						
						
						pw.println("{{/"+schemaStructure+"}}");
					}
				}

			} else if( "checkbox_group".equals(type) ){
				if( null != id ){
					pw.println("{{#"+schemaStructure+"}}");

					pw.println("\t<div class=\""+schemaClass+"_"+id+"\">");

					pw.println("\t\t<div class=\"label"+labelLocalizeClass+"\">"+label+"</div>");
					pw.println("\t\t<div class=\"value\">");
					
					for(CheckboxGroupItem item : checkboxes){
						String itemId = item.getId();
						String itemLabel = item.getLabel();
						String forId = id+"_"+itemId;
						
						pw.println("\t\t\t\t<div>");
						pw.print("\t\t\t\t\t<input type=\"checkbox\" class=\"{{#:input}}"+itemId+"{{/:input}}\" id=\""+forId+"\"/>");
						if( null == itemLabel ) {
							pw.println(" <label for=\""+forId+"\">"+itemId+"</label>");
						} else {
							pw.println(" <label for=\""+forId+"\" class=\"n2s_localize\">"+itemLabel+"</label>");
						}
						pw.println("\t\t\t\t</div>");
					}

					pw.println("\t\t</div>");
					pw.println("\t\t<div class=\"end\"></div>");
					
					pw.println("\t</div>");
					
					
					pw.println("{{/"+schemaStructure+"}}");
				}

			} else if( "file".equals(type) ){
				// nothing to do
				
			} else if( "geometry".equals(type) ){
				String labelValue = "";

				if( null != id ){
					throw new Exception("'id' should not be specified for attributes of type 'geometry'");
				}

				if( null != label ){
					labelValue = ",label="+encodeFieldParameter(label);
				}

				pw.println("<div class=\"nunaliit_geom\">");
				pw.println("\t<div class=\"value\">{{#:field}}nunaliit_geom,geometry"+labelValue+"{{/:field}}</div>");
				pw.println("</div>");

			} else if( "hover_sound".equals(type) ){
				if( null != id ){
					throw new Exception("'id' should not be specified for attributes of type 'hover_sound'");
				}

				String searchFunctionString = ",search=getHoverSound"; 
				if( null != searchFunction ){
					searchFunctionString = ",search="+encodeFieldParameter(searchFunction);
				}

				pw.println("<div class=\"nunaliit_hoverSound\">");

				pw.println("\t<div class=\"label"+labelLocalizeClass+"\">"+label+"</div>");
				pw.println("\t<div class=\"value\">{{#:field}}nunaliit_hoverSound,reference"+searchFunctionString+"{{/:field}}</div>");
				pw.println("\t<div class=\"end\"></div>");
				
				pw.println("</div>");

			} else if( "createdBy".equals(type) ){
				// nothing to do

			} else if( "createdTime".equals(type) ){
				// nothing to do
				
			} else {
				throw new Exception("Unable to include type "+type+" in form");
			}
		}
	}

	public void addExportField(JSONArray exportArr, String schemaName) throws Exception {

		if( excludedFromExport ) return;
		
		if( "title".equals(type) ){
			// do not export title
			
		} else if( "string".equals(type) ){
			JSONObject attrExport = new JSONObject();
			attrExport.put("select", schemaName+"."+id);
			attrExport.put("label", id);
			attrExport.put("type", "text");
			exportArr.put(attrExport);

		} else if( "localized".equals(type) ){
			JSONObject attrExport = new JSONObject();
			attrExport.put("select", schemaName+"."+id);
			attrExport.put("label", id);
			attrExport.put("type", "json");
			exportArr.put(attrExport);

		} else if( "date".equals(type) ){
			JSONObject attrExport = new JSONObject();
			attrExport.put("select", schemaName+"."+id+".date");
			attrExport.put("label", id);
			attrExport.put("type", "text");
			exportArr.put(attrExport);
			
		} else if( "reference".equals(type) ){
			JSONObject attrExport = new JSONObject();
			attrExport.put("select", schemaName+"."+id+".doc");
			attrExport.put("label", id);
			attrExport.put("type", "text");
			exportArr.put(attrExport);
			
		} else if( "geometry".equals(type) ){
			JSONObject attrExport = new JSONObject();
			attrExport.put("select", "nunaliit_geom.wkt");
			attrExport.put("label", "nunaliit_geom");
			attrExport.put("type", "text");
			exportArr.put(attrExport);
			
		} else if( "hover_sound".equals(type) ){
			JSONObject attrExport = new JSONObject();
			attrExport.put("select", "nunaliit_hoverSound.doc");
			attrExport.put("label", "nunaliit_hoverSound");
			attrExport.put("type", "text");
			exportArr.put(attrExport);
			
		} else if( "createdBy".equals(type) ){
			JSONObject attrExportName = new JSONObject();
			attrExportName.put("select", "nunaliit_created.name");
			attrExportName.put("label", "nunaliit_created_name");
			attrExportName.put("type", "text");
			exportArr.put(attrExportName);
			
		} else if( "createdTime".equals(type) ){
			JSONObject attrExportTime = new JSONObject();
			attrExportTime.put("select", "nunaliit_created.time");
			attrExportTime.put("label", "nunaliit_created_time");
			attrExportTime.put("type", "text");
			exportArr.put(attrExportTime);
			
		} else {
			JSONObject attrExport = new JSONObject();
			attrExport.put("select", schemaName+"."+id);
			attrExport.put("label", id);
			attrExport.put("type", "json");
			exportArr.put(attrExport);
		}
	}
	
	private String encodeFieldParameter(String value) throws Exception {
		String encoded = URLEncoder.encode(value, "UTF-8");
		encoded = encoded.replaceAll("\\+", "%20");
		return encoded;
	}
}
