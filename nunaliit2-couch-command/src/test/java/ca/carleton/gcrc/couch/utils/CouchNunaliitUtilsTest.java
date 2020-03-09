package ca.carleton.gcrc.couch.utils;

import junit.framework.TestCase;

import javax.servlet.http.HttpServletRequest;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class CouchNunaliitUtilsTest extends TestCase {

    //TODO: more testing req'd
    public void testBuildBaseUrlNoProxy() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        // These values should not be used while behind a proxy.
        when(request.getScheme()).thenReturn("http");
        when(request.getServerName()).thenReturn("develop.gcrc.carleton.ca");
        when(request.getServerPort()).thenReturn(8080);
        // These are the headers we should be using.
        when(request.getHeader(RequestHeaderConstants.REQUEST_SCHEME)).thenReturn("http");
        when(request.getHeader(RequestHeaderConstants.REQUEST_URI)).thenReturn("/atlases/atlas1/index.html");
        when(request.getHeader(RequestHeaderConstants.X_FORWARDED_HOST)).thenReturn(null);
        when(request.getHeader(RequestHeaderConstants.SERVER_PORT)).thenReturn("80");



    }

    public void testGetFolderPath() {
        String url = "https://develop.gcrc.carleton.ca/sarah/sitemap.xml";
        String path = CouchNunaliitUtils.getFolderPath(url);

        assertEquals("sarah", path);
    }
}