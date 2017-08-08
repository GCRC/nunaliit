package ca.carleton.gcrc.couch.onUpload.inReach;

import java.util.List;
import java.util.Vector;

import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

public class InReachFormFieldXml implements InReachFormField {

	private String name;
	private String type;
	private boolean required = false;
	private List<String> values = new Vector<String>();
	private Long length = null;
	private String defaultText;

	public InReachFormFieldXml(Element fieldElem) {
		name = getTextElement(fieldElem, "name");
		type = getTextElement(fieldElem, "type");
		defaultText = getTextElement(fieldElem, "default");
		
		// required
		{
			String requiredStr = getTextElement(fieldElem, "required");
			if( "Y".equals(requiredStr) ){
				required = true;
			}
		}
		
		// length
		{
			String lengthStr = getTextElement(fieldElem, "length");
			if( null != lengthStr ){
				length = Long.parseLong(lengthStr);
			}
		}
		
		// values
		{
			NodeList valuesList = fieldElem.getElementsByTagName("value");
			for(int i=0; i<valuesList.getLength(); ++i){
				Element valueElem = (Element)valuesList.item(i);
				String valueStr = valueElem.getTextContent();
				values.add(valueStr);
			}
		}
	}

	@Override
	public String getName() {
		return name;
	}

	@Override
	public String getType() {
		return type;
	}

	@Override
	public boolean isRequired() {
		return required;
	}

	@Override
	public List<String> getValues() {
		return values;
	}

	@Override
	public Long getLength() {
		return length;
	}

	@Override
	public String getDefault() {
		return defaultText;
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
}
