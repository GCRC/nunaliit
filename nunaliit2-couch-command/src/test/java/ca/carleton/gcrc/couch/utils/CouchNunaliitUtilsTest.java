package ca.carleton.gcrc.couch.utils;

import junit.framework.TestCase;

import javax.servlet.http.HttpServletRequest;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class CouchNunaliitUtilsTest extends TestCase {

    //TODO: more testing req'd
    public void testBuildBaseUrlNoProxy() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getScheme()).thenReturn("http");
        when(request.getServerName()).thenReturn("develop.gcrc.carleton.ca");
        when(request.getServerPort()).thenReturn(80);
        when(request.getHeader("REQUEST-SCHEME")).thenReturn("http");
        when(request.getHeader("REQUEST-URI")).thenReturn("/atlases/atlas1/index.html");
        when(request.getHeader("X-Forwarded-Host")).thenReturn(null);

    }

    public void testGetFolderPath() {
        String url = "https://develop.gcrc.carleton.ca/sarah/sitemap.xml";
        String path = CouchNunaliitUtils.getFolderPath(url);

        assertEquals("sarah", path);
    }
}