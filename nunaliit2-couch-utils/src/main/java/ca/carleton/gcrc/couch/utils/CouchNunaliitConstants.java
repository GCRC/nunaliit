package ca.carleton.gcrc.couch.utils;

public class CouchNunaliitConstants {

	private CouchNunaliitConstants(){}

	public static final String DOC_KEY_CREATED = "nunaliit_created";
	public static final String DOC_KEY_LAST_UPDATED = "nunaliit_last_updated";
	public static final String DOC_KEY_TYPE = "nunaliit_type";
	public static final String DOC_KEY_GEOMETRY = "nunaliit_geom";
	public static final String DOC_KEY_SCHEMA = "nunaliit_schema";
	public static final String DOC_KEY_ATLAS = "nunaliit_atlas";
	public static final String DOC_KEY_NAVIGATION = "nunaliit_navigation";

	public static final String TYPE_ACTION_STAMP = "actionstamp";

	public static final String CREATE_UPDATE_KEY_TIME = "time";
	public static final String CREATE_UPDATE_KEY_NAME = "name";

	/**
	 * The site design document Id.
	 */
	public static final String SITE_DESIGN_DOC_ID = "_design/site";
	public static final String INDEX_HTML = "index.html";
	public static final String ROBOTS_TXT = "robots.txt";
	/**
	 * File where the navigation doc Id is found.
	 */
	public static final String NUNALIIT_CUSTOM_JS = "nunaliit_custom.js";
	/**
	 * Atlas document Id. Should only be one.
	 */
	public static final String ATLAS_DOC_ID = "atlas";
}
