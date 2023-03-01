package ca.carleton.gcrc.couch.export.impl;

import java.io.OutputStream;

import org.json.JSONObject;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.app.Document;
import ca.carleton.gcrc.couch.export.DocumentRetrieval;
import ca.carleton.gcrc.couch.export.ExportFormat;
import ca.carleton.gcrc.couch.export.SchemaCache;
import ca.carleton.gcrc.couch.export.SchemaExportInfo;
import ca.carleton.gcrc.couch.export.SchemaExportProperty;
import ca.carleton.gcrc.couch.utils.NunaliitDocument;

import org.apache.jena.rdf.model.Resource;
import org.apache.jena.rdf.model.Property;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.apache.jena.vocabulary.RDF;
import org.apache.jena.riot.RDFDataMgr;
import org.apache.jena.riot.Lang;

public class ExportFormatRDF implements ExportFormat {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private DocumentRetrieval retrieval = null;
	private SchemaCache schemaCache = null;
	private Lang language = null;
	private String atlasName = null;
	private String defaultNs = null;
	private static final String geoSPARQLNs = "http://www.opengis.net/ont/geosparql#";
	private boolean isGeoSPARQLNsSet = false;

	public ExportFormatRDF(
			SchemaCache schemaCache,
			DocumentRetrieval retrieval,
			String language,
			String atlasName) throws Exception {
		this.schemaCache = schemaCache;
		this.retrieval = retrieval;
		this.atlasName = atlasName;
		this.defaultNs = "http://" + atlasName + "/ont/#";
		setLanguageType(language);
	}

	private void setLanguageType(String langParam) {
		if (langParam == null) {
			this.language = Lang.TURTLE;
		} else if (langParam.equals("turtle") || langParam.equals("ttl")) {
			this.language = Lang.TURTLE;
		} else if (langParam.equals("jsonld")) {
			this.language = Lang.JSONLD;
		} else if (langParam.equals("rdf") || langParam.equals("rdfxml")) {
			this.language = Lang.RDFXML;
		} else {
			this.language = Lang.TURTLE;
		}
	}

	@Override
	public String getMimeType() {
		if (Lang.TURTLE == language) {
			return "text/turtle";
		} else if (Lang.JSONLD == language) {
			return "application/json+ld";
		} else if (Lang.RDFXML == language) {
			return "application/rdf+xml";
		} else {
			return "application/octet-stream";
		}
	}

	@Override
	public String getCharacterEncoding() {
		return "utf-8";
	}

	@Override
	public void outputExport(OutputStream os) throws Exception {
		Model graph = ModelFactory.createDefaultModel();
		outputExport(graph);
		RDFDataMgr.write(os, graph, language);
		os.flush();
	}

	public void outputExport(Model graph) throws Exception {
		graph.setNsPrefix(atlasName, defaultNs);
		while (retrieval.hasNext()) {
			Document doc = retrieval.getNext();
			if (doc == null)
				break;
			try {
				outputDocument(graph, doc);
			} catch (Exception e) {
				throw new Exception("Failed to export document as RDF: " + doc.getId(), e);
			}
		}
	}

	private void outputDocument(Model graph, Document doc) throws Exception{
		NunaliitDocument nunaliitDoc = new NunaliitDocument(doc);
		JSONObject json = nunaliitDoc.getJSONObject();
		String schemaName = json.optString("nunaliit_schema");
		if (schemaName.equals(""))
			return;
		SchemaExportInfo exportInfo = null;
		try {
			exportInfo = schemaCache.getExportInfo(schemaName);
		} catch (Exception e) {
			throw new Exception("Failed to retrieve export info for schema: " + schemaName, e);
		}
		if (exportInfo == null)
			return;

		Resource type = graph.createResource(defaultNs + schemaName);
		Resource blankInstance = graph.createResource();
		graph.add(blankInstance, RDF.type, type);

		JSONObject nunaliitGeom = json.optJSONObject("nunaliit_geom");
		if (nunaliitGeom != null) {
			String wkt = nunaliitGeom.optString("wkt");
			if (!wkt.equals("")) {
				if (!isGeoSPARQLNsSet) {
					isGeoSPARQLNsSet = true;
					graph.setNsPrefix("geo", geoSPARQLNs);
				}
				graph.add(blankInstance, RDF.type, graph.createResource(geoSPARQLNs + "Feature"));
				Property hasGeometry = graph.createProperty(geoSPARQLNs + "hasGeometry");
				Resource blankWKTNode = graph.createResource();
				graph.add(blankInstance, hasGeometry, blankWKTNode);
				Property asWKT = graph.createProperty(geoSPARQLNs + "asWKT");
				// TODO: make it a typed literal (geo:wktLiteral)?
				// https://opengeospatial.github.io/ogc-geosparql/geosparql11/spec.html#C.1.1.2.2
				graph.add(blankWKTNode, asWKT, graph.createLiteral(wkt.toString(), false));
			}
		}
		for (SchemaExportProperty exportProperty : exportInfo.getProperties()) {
			Object value = exportProperty.select(json);
			if (null != value) {
				Property schemaProperty = graph.createProperty(defaultNs + exportProperty.getLabel());
				// TODO: does not consider if value is another object
				graph.add(blankInstance, schemaProperty, graph.createLiteral(value.toString(), false));
			}
		}
	}
}
