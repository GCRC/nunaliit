package ca.carleton.gcrc.couch.command.schema;

import java.io.PrintWriter;
import java.util.List;
import java.util.Vector;

import org.json.JSONArray;
import org.json.JSONObject;

public class SchemaAttribute {
	
	static public SchemaAttribute fromJson(JSONObject jsonAttr) throws Exception {
		String type = jsonAttr.getString("type");
		
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
		
		return attribute;
	}

	private String type;
	private String id;
	private String label;
	private boolean includedInBrief;
	private boolean excludedFromDisplay;
	private boolean excludedFromForm;
	private List<SelectionOption> options = new Vector<SelectionOption>();
	private List<CheckboxGroupItem> checkboxes = new Vector<CheckboxGroupItem>();
	private String elementType;
	private String referenceType;
	private String searchFunction;

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

	public String getSearchFunction() {
		return searchFunction;
	}

	public void setSearchFunction(String searchFunction) {
		this.searchFunction = searchFunction;
	}

	public JSONObject toJson() throws Exception {
		JSONObject jsonAttr = new JSONObject();
		
		jsonAttr.put("type", type);
		
		if( null != id ) jsonAttr.put("id", id);
		if( null != label ) jsonAttr.put("label", label);
		if( null != elementType ) jsonAttr.put("elementType", elementType);
		if( null != referenceType ) jsonAttr.put("referenceType", referenceType);
		if( null != searchFunction ) jsonAttr.put("searchFunction", searchFunction);
		if( includedInBrief ) jsonAttr.put("includedInBrief", true);
		if( excludedFromDisplay ) jsonAttr.put("excludedFromDisplay", true);
		if( excludedFromForm ) jsonAttr.put("excludedFromForm", true);

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
			
		} else if( "textarea".equals(type) ){
			if( null != id ){
				schemaDoc.put(id, "");
			}
			
		} else if( "date".equals(type) ){
			// leave date attributes as undefined
			
		} else if( "reference".equals(type) ){
			// leave reference attributes as undefined
			
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
			JSONObject files = attachments.getJSONObject("files");
			JSONObject media = files.optJSONObject("media");
			if( null == media ){
				media = new JSONObject();
				
				media.put("data", new JSONObject());
				
				files.put("media", media);
			}

		} else {
			throw new Exception("Unable to include type "+type+" in create");
		}
	}

	public boolean printBrief(PrintWriter pw, String schemaName, boolean isFirst) throws Exception {
		boolean printed = false;
		
		if( includedInBrief ){
			if( "title".equals(type) ){
				
			} else if( "string".equals(type) ){
				if( null != id ){
					pw.print("{{#"+schemaName+"}}");
					if( !isFirst ) pw.print(" ");
					pw.print("{{"+id+"}}");
					pw.print("{{/"+schemaName+"}}");
					printed = true;
				}
				
			} else if( "localized".equals(type) ){
				if( null != id ){
					pw.print("{{#"+schemaName+"}}");
					if( !isFirst ) pw.print(" ");
					pw.print("{{#:localize}}"+id+"{{/:localize}}");
					pw.print("{{/"+schemaName+"}}");
					printed = true;
				}
				
			} else if( "textarea".equals(type) ){
				if( null != id ){
					pw.print("{{#"+schemaName+"}}");
					if( !isFirst ) pw.print(" ");
					pw.print("{{"+id+"}}");
					pw.print("{{/"+schemaName+"}}");
					printed = true;
				}
				
			} else if( "selection".equals(type) ){
				if( null != id ){
					pw.print("{{#"+schemaName+"}}");
					if( !isFirst ) pw.print(" ");
					pw.print("<span class=\"n2s_select\" n2-choice=\"{{"+id+"}}\">");
					for(SelectionOption option : options){
						pw.print("<span class=\"n2s_choice n2s_localize\" n2-choice=\""+option.getValue()+"\">");
						String label = option.getLabel();
						if( null == label ){
							label = option.getValue();
						}
						pw.print(label);
						pw.print("</span>");
					}
					pw.print("</span>");
					pw.print("{{/"+schemaName+"}}");
					printed = true;
				}
				
			} else if( "date".equals(type) ){
				if( null != id ){
					pw.print("{{#"+schemaName+"}}");
					pw.print("{{#"+id+"}}");
					if( !isFirst ) pw.print(" ");
					pw.print("{{date}}");
					pw.print("{{/"+id+"}}");
					pw.print("{{/"+schemaName+"}}");
					printed = true;
				}
				
			} else if( "reference".equals(type) ){
				if( null != id ){
					pw.print("{{#"+schemaName+"}}");
					pw.print("{{#"+id+"}}");
					pw.print("{{#doc}}");
					if( !isFirst ) pw.print(" ");
					pw.print("<span class=\"n2s_briefDisplay\">{{.}}</span>");
					pw.print("{{/doc}}");
					pw.print("{{/"+id+"}}");
					pw.print("{{/"+schemaName+"}}");
					printed = true;
				}
				
			} else if( "array".equals(type) ){
				if( null != id ){
					pw.print("{{#"+schemaName+"}}");
					pw.print("{{#"+id+"}}");
					if( !isFirst ) pw.print(" ");
					
					if( "string".equals(elementType) ){
						pw.print("{{.}}");
						
					} else if( "localized".equals(elementType) ){
						pw.print("{{#:localize}}.{{/:localize}}");
						
					} else if( "textarea".equals(elementType) ){
						pw.print("{{.}}");
						
					} else if( "date".equals(elementType) ){
						pw.print("{{date}}");
						
					} else if( "reference".equals(elementType) ){
						pw.print("{{#doc}}");
						pw.print("<span class=\"n2s_briefDisplay\">{{.}}</span>");
						pw.print("{{/doc}}");
					}
					
					pw.print("{{/"+id+"}}");
					pw.print("{{/"+schemaName+"}}");
					printed = true;
				}
					
			} else {
				throw new Exception("Unable to include type "+type+" in brief");
			}
		}
		
		return printed;
	}

	public void printDisplay(PrintWriter pw, String schemaName) throws Exception {
		if( false == excludedFromDisplay ){
			String label = this.label;
			String labelLocalizeClass = " n2s_localize";
			if( null == label ){
				label = id;
				labelLocalizeClass = "";
			}

			if( "title".equals(type) ) {
				pw.println("<div class=\"title\">");

				pw.println("\t<div class=\"label"+labelLocalizeClass+"\">"+label+"</div>");
				pw.println("\t<div class=\"end\"></div>");
				
				pw.println("</div>");
				
			} else if( "string".equals(type)
			 || "textarea".equals(type)
			 || "localized".equals(type) ){
				if( null != id ){
					pw.println("{{#"+schemaName+"}}");
					pw.println("\t{{#"+id+"}}");

					pw.println("\t\t<div class=\""+schemaName+"_"+id+"\">");

					pw.println("\t\t\t<div class=\"label"+labelLocalizeClass+"\">"+label+"</div>");
					if( "textarea".equals(type) ){
						pw.println("\t\t\t<div class=\"value n2s_preserveSpaces n2s_installMaxHeight n2s_convertTextUrlToLink\" _maxheight=\"100\">{{.}}</div>");

					} else if( "localized".equals(type) ){
						pw.println("\t\t\t<div class=\"value\">{{#:localize}}.{{/:localize}}</div>");
					
					} else if( "string".equals(type) ){
						pw.println("\t\t\t<div class=\"value\">{{.}}</div>");
					}
					pw.println("\t\t\t<div class=\"end\"></div>");
					
					pw.println("\t\t</div>");
					
					pw.println("\t{{/"+id+"}}");
					pw.println("{{/"+schemaName+"}}");
				}
				
			} else if( "date".equals(type) ){
				if( null != id ){
					pw.println("{{#"+schemaName+"}}");
					pw.println("\t{{#"+id+"}}");

					pw.println("\t\t<div class=\""+schemaName+"_"+id+"\">");

					pw.println("\t\t\t<div class=\"label"+labelLocalizeClass+"\">"+label+"</div>");
					pw.println("\t\t\t<div class=\"value\">{{date}}</div>");
					pw.println("\t\t\t<div class=\"end\"></div>");
					
					pw.println("\t\t</div>");
					
					
					pw.println("\t{{/"+id+"}}");
					pw.println("{{/"+schemaName+"}}");
				}
				
			} else if( "reference".equals(type) ){
				if( null != id ){
					pw.println("{{#"+schemaName+"}}");
					pw.println("\t{{#"+id+"}}");

					pw.println("\t\t<div class=\""+schemaName+"_"+id+"\">");

					pw.println("\t\t\t<div class=\"label"+labelLocalizeClass+"\">"+label+"</div>");
					
					if( "thumbnail".equals(referenceType) ){
						pw.println("\t\t\t<div class=\"value n2s_insertFirstThumbnail\" nunaliit-document=\"{{doc}}\"></div>");
					} else {
						pw.println("\t\t\t<div class=\"value\"><a href=\"#\" class=\"n2s_referenceLink\">{{doc}}</a></div>");
					}

					pw.println("\t\t\t<div class=\"end\"></div>");
					
					pw.println("\t\t</div>");
					
					
					pw.println("\t{{/"+id+"}}");
					pw.println("{{/"+schemaName+"}}");
				}
				
			} else if( "array".equals(type) ){
				if( null != id ){
					pw.println("{{#"+schemaName+"}}");

					pw.println("\t<div class=\""+schemaName+"_"+id+"\">");

					pw.println("\t\t<div class=\"label"+labelLocalizeClass+"\">"+label+"</div>");
					pw.println("\t\t<div class=\"value\">");
					pw.println("\t\t{{#"+id+"}}");
					pw.print("\t\t\t<div class=\"array_element");
					if( "textarea".equals(elementType) ){
						pw.print(" n2s_preserveSpaces n2s_installMaxHeight n2s_convertTextUrlToLink\" _maxheight=\"100");
					}
					pw.println("\">");
					
					if( "string".equals(elementType) ){
						pw.println("{{.}}");
					} else if( "localized".equals(elementType) ){
						pw.println("{{#:localize}}.{{/:localize}}");
					} else if( "textarea".equals(elementType) ){
						pw.println("{{.}}");
					} else if( "date".equals(elementType) ){
						pw.println("{{date}}");
					} else if( "reference".equals(elementType) ){
						pw.println("\t\t\t\t<a href=\"#\" class=\"n2s_referenceLink\">{{doc}}</a>");
					}
					
					pw.println("\t\t\t</div>");
					pw.println("\t\t{{/"+id+"}}");
					pw.println("\t\t</div>");
					pw.println("\t\t<div class=\"end\"></div>");
					
					pw.println("\t</div>");
					
					
					pw.println("{{/"+schemaName+"}}");
				}

			} else if( "selection".equals(type) ){
				if( null != id ){
					pw.println("{{#"+schemaName+"}}");
					pw.println("\t{{#"+id+"}}");
	
					pw.println("\t\t<div class=\""+schemaName+"_"+id+"\">");
	
					pw.println("\t\t\t<div class=\"label"+labelLocalizeClass+"\">"+label+"</div>");
					pw.println("\t\t\t<div class=\"value n2s_select\" n2-choice=\"{{.}}\">");
					
					for(SelectionOption option : options){
						String value = option.getValue();
						String optLabel = option.getLabel();
						if( null == optLabel ){
							optLabel = value;
						}
						
						pw.println("\t\t\t\t<span class=\"n2s_choice n2s_localize\" n2-choice=\""+value+"\">"+optLabel+"</span>");
					}

					pw.println("\t\t\t\t<span class=\"n2s_choiceDefault\">{{.}}</span>");
					
					pw.println("\t\t\t</div>");
					pw.println("\t\t\t<div class=\"end\"></div>");
					
					pw.println("\t\t</div>");
					
					
					pw.println("\t{{/"+id+"}}");
					pw.println("{{/"+schemaName+"}}");
				}

			} else if( "checkbox".equals(type) ){
				if( null != id ){
					pw.println("{{#"+schemaName+"}}");

					pw.println("\t\t<div class=\""+schemaName+"_"+id+"\">");

					pw.println("\t\t\t<div class=\"label"+labelLocalizeClass+"\">"+label+"</div>");
					pw.println("\t\t\t<div class=\"value\">");
					pw.println("\t\t\t\t{{#if "+id+"}}");
					pw.println("\t\t\t\t\t<span class=\"n2s_localize\">Yes</span>");
					pw.println("\t\t\t\t{{else}}");
					pw.println("\t\t\t\t\t<span class=\"n2s_localize\">No</span>");
					pw.println("\t\t\t\t{{/if}}");
					pw.println("\t\t\t</div>");
					pw.println("\t\t\t<div class=\"end\"></div>");
					
					pw.println("\t\t</div>");
					
					
					pw.println("{{/"+schemaName+"}}");
				}

			} else if( "checkbox_group".equals(type) ){
				if( null != id ){
					pw.println("{{#"+schemaName+"}}");

					pw.println("\t\t<div class=\""+schemaName+"_"+id+"\">");

					pw.println("\t\t\t<div class=\"label"+labelLocalizeClass+"\">"+label+"</div>");
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
					
					
					pw.println("{{/"+schemaName+"}}");
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
				pw.println("\t\t\t\t\t<div class=\"n2s_insertExternalMediaLink\" nunaliit-attachment=\"{{.}}\"> </div>");
				pw.println("\t\t\t\t{{/attachmentName}}");

				pw.println("\t\t\t{{/source}}");
				pw.println("\t\t{{/value}}");
				pw.println("\t{{/:iterate}}");
				pw.println("{{/files}}");
				pw.println("{{/nunaliit_attachments}}");
							
			} else {
				throw new Exception("Unable to include type "+type+" in display");
			}
		}
	}

	public void printForm(PrintWriter pw, String schemaName) throws Exception {
		if( false == excludedFromForm ){
			String label = this.label;
			String labelLocalizeClass = " n2s_localize";
			if( null == label ){
				label = id;
				labelLocalizeClass = "";
			}

			if( "title".equals(type) ){
				pw.println("<div class=\"title\">");

				pw.println("\t<div class=\"label"+labelLocalizeClass+"\">"+label+"</div>");
				pw.println("\t<div class=\"end\"></div>");
				
				pw.println("</div>");

			} else if( "string".equals(type) 
			 || "localized".equals(type) 
			 || "textarea".equals(type) 
			 || "reference".equals(type) 
			 || "checkbox".equals(type) 
			 || "date".equals(type) ){
				if( null != id ){
					String fieldType = "";
					if( "localized".equals(type) ){
						fieldType = ",localized";
					} else if( "textarea".equals(type) ){
						fieldType = ",textarea";
					} else if( "date".equals(type) ){
						fieldType = ",date";
					} else if( "reference".equals(type) ){
						fieldType = ",reference";
					} else if( "checkbox".equals(type) ){
						fieldType = ",checkbox";
					}

					String searchFnName = "";
					if( null != searchFunction ){
						searchFnName = ",search="+searchFunction;
					}
					
					pw.println("{{#"+schemaName+"}}");

					pw.println("\t<div class=\""+schemaName+"_"+id+"\">");

					pw.println("\t\t<div class=\"label"+labelLocalizeClass+"\">"+label+"</div>");
					pw.println("\t\t<div class=\"value\">{{#:field}}"+id+fieldType+searchFnName+"{{/:field}}</div>");
					pw.println("\t\t<div class=\"end\"></div>");
					
					pw.println("\t</div>");
					
					
					pw.println("{{/"+schemaName+"}}");
				}

			} else if( "selection".equals(type) ){
				if( null != id ){
					pw.println("{{#"+schemaName+"}}");

					pw.println("\t<div class=\""+schemaName+"_"+id+"\">");

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
					
					
					pw.println("{{/"+schemaName+"}}");
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
					} else if( "textarea".equals(elementType) ){
						fieldType = ",textarea";
						arrayType = " \"string\"";
					} else if( "date".equals(elementType) ){
						fieldType = ",date";
						arrayType = " \"date\"";
					} else if( "reference".equals(elementType) ){
						fieldType = ",reference";
						arrayType = " \"reference\"";
					}

					String searchFnName = "";
					if( null != searchFunction ){
						searchFnName = ",search="+searchFunction;
					}
					
					if( null != fieldType ){
						pw.println("{{#"+schemaName+"}}");

						pw.println("\t<div class=\""+schemaName+"_"+id+"\">");

						pw.println("\t\t<div class=\"label"+labelLocalizeClass+"\">"+label+"</div>");
						pw.println("\t\t<div class=\"value\">");
						pw.println("\t\t\t{{#:array "+id+arrayType+"}}");
						pw.println("\t\t\t\t<div>{{#:field}}."+fieldType+searchFnName+"{{/:field}}</div>");
						pw.println("\t\t\t{{/:array}}");
						pw.println("\t\t</div>");
						pw.println("\t\t<div class=\"end\"></div>");
						
						pw.println("\t</div>");
						
						
						pw.println("{{/"+schemaName+"}}");
					}
				}

			} else if( "checkbox_group".equals(type) ){
				if( null != id ){
					pw.println("{{#"+schemaName+"}}");

					pw.println("\t<div class=\""+schemaName+"_"+id+"\">");

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
					
					
					pw.println("{{/"+schemaName+"}}");
				}

			} else if( "file".equals(type) ){
				// nothing to do
				
			} else {
				throw new Exception("Unable to include type "+type+" in form");
			}
		}
	}
}
