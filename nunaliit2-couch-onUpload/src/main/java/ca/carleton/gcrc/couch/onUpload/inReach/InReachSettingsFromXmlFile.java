package ca.carleton.gcrc.couch.onUpload.inReach;

import java.io.File;
import java.util.Collection;
import java.util.List;
import java.util.Vector;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

public class InReachSettingsFromXmlFile implements InReachSettings {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private File xmlFile = null;
	private List<InReachForm> forms = new Vector<InReachForm>();
	
	public InReachSettingsFromXmlFile(File xmlFile){
		this.xmlFile = xmlFile;
	}

	public void load() throws Exception {
		try {
			DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
			DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
			Document doc = dBuilder.parse(xmlFile);
			
			Element rootElem = doc.getDocumentElement();
			NodeList tableElems = rootElem.getElementsByTagName("table");
			for(int i=0; i<tableElems.getLength(); ++i){
				Element tableElem = (Element)tableElems.item(i);
				NodeList formElems = tableElem.getElementsByTagName("form");
				for(int j=0; j<formElems.getLength(); ++j){
					Element formElem = (Element)formElems.item(j);
					InReachFormXml form = new InReachFormXml(formElem);
					forms.add(form);
				}
			}
		} catch (Exception e) {
			throw new Exception("Error while loading XML settings", e);
		}
	}

	@Override
	public Collection<InReachForm> getForms() {
		return forms;
	}
}
