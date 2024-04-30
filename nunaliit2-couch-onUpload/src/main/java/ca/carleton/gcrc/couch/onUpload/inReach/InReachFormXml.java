package ca.carleton.gcrc.couch.onUpload.inReach;

import java.util.List;
import java.util.Vector;

import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

public class InReachFormXml implements InReachForm {

	private String title = null;
	private String destination = null;
	private String prefix = null;
	private String delimiter = null;
	private List<InReachFormField> fields = new Vector<InReachFormField>();

	public InReachFormXml(Element formElem){

		title = getTextElement(formElem, "title");
		if (title != null) {
			title = title.trim().replace(" ", "_");
		}

		destination = getTextElement(formElem, "destination");
		prefix = getTextElement(formElem, "prefix");
		delimiter = getTextElement(formElem, "delimiter");
		
		NodeList fieldsList = formElem.getElementsByTagName("field");
		for(int i=0; i<fieldsList.getLength(); ++i){
			Element fieldElem = (Element)fieldsList.item(i);
			InReachFormFieldXml field = new InReachFormFieldXml(fieldElem);
			fields.add(field);
		}
	}

	@Override
	public String getTitle() {
		return title;
	}

	@Override
	public String getDestination() {
		return destination;
	}

	@Override
	public String getPrefix() {
		return prefix;
	}

	@Override
	public String getDelimiter() {
		return delimiter;
	}

	@Override
	public List<InReachFormField> getFields() {
		return fields;
	}
	
	private String getTextElement(Element parent, String elemName){
		String value = null;

		NodeList list = parent.getElementsByTagName(elemName);
		for(int i=0; i<list.getLength(); ++i){
			Element child = (Element)list.item(i);
			value = child.getTextContent();
		}
		
		return value;
	}
	
	public String toString() {
		return "form["+title+"/"+destination+"/"+prefix+"/"+delimiter+"]";
	}
}
