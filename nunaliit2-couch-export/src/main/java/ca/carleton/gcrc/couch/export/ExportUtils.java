package ca.carleton.gcrc.couch.export;

public class ExportUtils {

	public enum Format {
		GEOJSON("geojson")
		,CSV("csv")
		;
		
		private String label;
		private Format(String label){
			this.label = label;
		}
		public String getLabel(){
			return label;
		}
		public boolean matches(String t){
			return label.equalsIgnoreCase(t);
		}
	}

	public enum Method {
		LAYER("layer")
		,SCHEMA("schema")
		,DOC_ID("doc-id")
		;
		
		private String label;
		private Method(String label){
			this.label = label;
		}
		public String getLabel(){
			return label;
		}
		public boolean matches(String t){
			return label.equalsIgnoreCase(t);
		}
	}

	public enum Filter {
		ALL("all")
		,POINTS("points")
		,LINESTRINGS("linestrings")
		,POLYGONS("polygons")
		;
		
		private String label;
		private Filter(String label){
			this.label = label;
		}
		public String getLabel(){
			return label;
		}
		public boolean matches(String t){
			return label.equalsIgnoreCase(t);
		}
	}
}
