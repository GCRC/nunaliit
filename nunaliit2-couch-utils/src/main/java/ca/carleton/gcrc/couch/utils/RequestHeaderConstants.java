package ca.carleton.gcrc.couch.utils;

/**
 * HTTP request header constants that aren't availble elsewhere. Also incluses headers setup on the Apache server manually. Should be used when an atlas is hosted behind a proxy, since the
 * servlet won't get the originating scheme, URI, query string or port in the request headers.
 */
public class RequestHeaderConstants {
    private RequestHeaderConstants() {
    }

    /**
     * e.g., module=module.mycoolmap
     */
    public static final String QUERY_STRING = "QUERY_STRING";
    /**
     * e.g., /atlas1/index.html
     */
    public static final String REQUEST_URI = "REQUEST_URI";
    /**
     * http or https
     */
    public static final String REQUEST_SCHEME = "REQUEST_SCHEME";
    public static final String SERVER_PORT = "SERVER_PORT";

    /** Standard header for proxies, represents originating host. */
    public static final String X_FORWARDED_HOST = "X-Forwarded-Host";
}
