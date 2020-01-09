
package ca.carleton.gcrc.couch.metadata;

import junit.framework.TestCase;

public class MetadataServletTest extends TestCase {

    private MetadataServlet metadataServlet;

    @Override
    protected void setUp() {
        metadataServlet = new MetadataServlet();
    }

    public void testFindModuleDocId_moduleExists() {
        assertEquals("module.clyderiver.boundaries", metadataServlet.findModuleDocId("https://clyderiveratlas.ca/index.html?module=module.clyderiver.boundaries#eyJ0IjoieCIsImkiOiIwYzE4NjlhNTgyMzRlMjkyNmM1YTZhOWVmZGVmZmFiMiIsInMiOjE1NzY2OTc5Nzc5MDZ9"));
        assertEquals("module.test3_canvas", metadataServlet.findModuleDocId("http://localhost:8081/index.html?module=module.test3_canvas"));
    }

    public void testFindModuleDocId_noModule() {
        assertNull(metadataServlet.findModuleDocId("https://clyderiveratlas.ca/index.html?module="));
        assertNull(metadataServlet.findModuleDocId("http://localhost:8081/index.html"));
    }
}
