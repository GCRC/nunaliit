package ca.carleton.gcrc.couch.utils;

import junit.framework.TestCase;
import org.apache.commons.lang3.StringUtils;

import javax.servlet.http.HttpServletRequest;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class CouchNunaliitUtilsTest extends TestCase {

    public void testBuildBaseUrlNoProxyNonStandardPort() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        // These values should be used while not behind a proxy.
        when(request.getScheme()).thenReturn("http");
        when(request.getServerName()).thenReturn("develop.gcrc.carleton.ca");
        when(request.getServerPort()).thenReturn(8080);

        // These are the headers we should be using only if proxied.
        when(request.getHeader(RequestHeaderConstants.REQUEST_SCHEME)).thenReturn("http");
        when(request.getHeader(RequestHeaderConstants.REQUEST_URI)).thenReturn("/atlases/atlas1/index.html");
        when(request.getHeader(RequestHeaderConstants.X_FORWARDED_HOST)).thenReturn(null);
        when(request.getHeader(RequestHeaderConstants.SERVER_PORT)).thenReturn("80");

        String url = CouchNunaliitUtils.buildBaseUrl(request);
        assertEquals("http://develop.gcrc.carleton.ca:8080/atlases/atlas1/", url);
    }

    public void testBuildBaseUrlNoProxyStandardPort() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        // These values should be used while not behind a proxy.
        when(request.getScheme()).thenReturn("http");
        when(request.getServerName()).thenReturn("develop.gcrc.carleton.ca");
        when(request.getServerPort()).thenReturn(80);

        // These are the headers we should be using only if proxied.
        when(request.getHeader(RequestHeaderConstants.REQUEST_SCHEME)).thenReturn("http");
        when(request.getHeader(RequestHeaderConstants.REQUEST_URI)).thenReturn("/atlases/atlas1/index.html");
        when(request.getHeader(RequestHeaderConstants.X_FORWARDED_HOST)).thenReturn(null);
        when(request.getHeader(RequestHeaderConstants.SERVER_PORT)).thenReturn("8080");

        String url = CouchNunaliitUtils.buildBaseUrl(request);
        assertEquals("http://develop.gcrc.carleton.ca/atlases/atlas1/", url);
    }

    public void testBuildBaseUrlNoProxySslStandardPort() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        // These values should be used while not behind a proxy.
        when(request.getScheme()).thenReturn("https");
        when(request.getServerName()).thenReturn("develop.gcrc.carleton.ca");
        when(request.getServerPort()).thenReturn(443);

        // These are the headers we should be using only if proxied.
        when(request.getHeader(RequestHeaderConstants.REQUEST_SCHEME)).thenReturn("http");
        when(request.getHeader(RequestHeaderConstants.REQUEST_URI)).thenReturn("/atlases/atlas1/index.html");
        when(request.getHeader(RequestHeaderConstants.X_FORWARDED_HOST)).thenReturn(null);
        when(request.getHeader(RequestHeaderConstants.SERVER_PORT)).thenReturn("8080");

        String url = CouchNunaliitUtils.buildBaseUrl(request);
        assertEquals("https://develop.gcrc.carleton.ca/atlases/atlas1/", url);
    }


    public void testBuildBaseUrlProxiedNonStandardPort() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        // These values should be used while not behind a proxy.
        when(request.getScheme()).thenReturn("https");
        when(request.getServerName()).thenReturn("noproxy.gcrc.carleton.ca");
        when(request.getServerPort()).thenReturn(80);

        // These are the headers we should be using only if proxied.
        when(request.getHeader(RequestHeaderConstants.REQUEST_SCHEME)).thenReturn("http");
        when(request.getHeader(RequestHeaderConstants.REQUEST_URI)).thenReturn("/atlases/atlas1/index.html");
        when(request.getHeader(RequestHeaderConstants.X_FORWARDED_HOST)).thenReturn("develop.gcrc.carleton.ca");
        when(request.getHeader(RequestHeaderConstants.SERVER_PORT)).thenReturn("8080");

        String url = CouchNunaliitUtils.buildBaseUrl(request);
        assertEquals("http://develop.gcrc.carleton.ca:8080/atlases/atlas1/", url);
    }

    public void testBuildBaseUrlProxiedStandardPort() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        // These values should be used while not behind a proxy.
        when(request.getScheme()).thenReturn("https");
        when(request.getServerName()).thenReturn("noproxy.gcrc.carleton.ca");
        when(request.getServerPort()).thenReturn(8080);

        // These are the headers we should be using only if proxied.
        when(request.getHeader(RequestHeaderConstants.REQUEST_SCHEME)).thenReturn("http");
        when(request.getHeader(RequestHeaderConstants.REQUEST_URI)).thenReturn("/atlases/atlas1/index.html");
        when(request.getHeader(RequestHeaderConstants.X_FORWARDED_HOST)).thenReturn("develop.gcrc.carleton.ca");
        when(request.getHeader(RequestHeaderConstants.SERVER_PORT)).thenReturn("80");

        String url = CouchNunaliitUtils.buildBaseUrl(request);
        assertEquals("http://develop.gcrc.carleton.ca/atlases/atlas1/", url);
    }

    public void testBuildBaseUrlProxiedSslStandardPort() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        // These values should be used while not behind a proxy.
        when(request.getScheme()).thenReturn("http");
        when(request.getServerName()).thenReturn("noproxy.gcrc.carleton.ca");
        when(request.getServerPort()).thenReturn(8443);

        // These are the headers we should be using only if proxied.
        when(request.getHeader(RequestHeaderConstants.REQUEST_SCHEME)).thenReturn("https");
        when(request.getHeader(RequestHeaderConstants.REQUEST_URI)).thenReturn("/atlases/atlas1/index.html");
        when(request.getHeader(RequestHeaderConstants.X_FORWARDED_HOST)).thenReturn("develop.gcrc.carleton.ca");
        when(request.getHeader(RequestHeaderConstants.SERVER_PORT)).thenReturn("443");

        String url = CouchNunaliitUtils.buildBaseUrl(request);
        assertEquals("https://develop.gcrc.carleton.ca/atlases/atlas1/", url);
    }

    public void testBuildBaseUrlNoRequestUri() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        // These values should be used while not behind a proxy.
        when(request.getScheme()).thenReturn("http");
        when(request.getServerName()).thenReturn("noproxy.gcrc.carleton.ca");
        when(request.getServerPort()).thenReturn(8443);

        // These are the headers we should be using only if proxied.
        when(request.getHeader(RequestHeaderConstants.REQUEST_SCHEME)).thenReturn("https");
        when(request.getHeader(RequestHeaderConstants.REQUEST_URI)).thenReturn(null);
        when(request.getHeader(RequestHeaderConstants.X_FORWARDED_HOST)).thenReturn("develop.gcrc.carleton.ca");
        when(request.getHeader(RequestHeaderConstants.SERVER_PORT)).thenReturn("443");

        String url = CouchNunaliitUtils.buildBaseUrl(request);
        assertEquals("https://develop.gcrc.carleton.ca/", url);
    }

    public void testGetFolderPath() {
        String url = "https://develop.gcrc.carleton.ca/atlas/index.html";
        String path = CouchNunaliitUtils.getFolderPath(url);
        assertEquals("atlas", path);

        url = "https://develop.gcrc.carleton.ca/atlases/atlas1/index.html?module=module.map";
        path = CouchNunaliitUtils.getFolderPath(url);
        assertEquals("atlases/atlas1", path);

        url = "https://develop.gcrc.carleton.ca/atlases/atlas1/";
        path = CouchNunaliitUtils.getFolderPath(url);
        assertEquals("atlases/atlas1", path);

        url = "https://develop.gcrc.carleton.ca/index.html";
        path = CouchNunaliitUtils.getFolderPath(url);
        assertTrue(StringUtils.isBlank(path));

        url = "https://develop.gcrc.carleton.ca";
        path = CouchNunaliitUtils.getFolderPath(url);
        assertTrue(StringUtils.isBlank(path));

        url = "https://develop.gcrc.carleton.ca/";
        path = CouchNunaliitUtils.getFolderPath(url);
        assertTrue(StringUtils.isBlank(path));
    }
}