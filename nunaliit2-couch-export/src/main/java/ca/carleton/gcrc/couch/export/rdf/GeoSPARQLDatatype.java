package ca.carleton.gcrc.couch.export.rdf;

import org.apache.jena.datatypes.BaseDatatype;

public class GeoSPARQLDatatype extends BaseDatatype {
    public static final String GEOSPARQL = "http://www.opengis.net/ont/geosparql";

    public static final GeoSPARQLDatatype GeoSPARQLWKTLiteral = new GeoSPARQLWKTLiteral("wktLiteral");

    public GeoSPARQLDatatype(String typeName) {
        super("");
        this.uri = GEOSPARQL + "#" + typeName;
    }
}
