package ca.carleton.gcrc.olkit.multimedia.apachePDFBox;

import java.io.File;

import ca.carleton.gcrc.olkit.multimedia.utils.TestConfiguration;
import junit.framework.TestCase;

public class ApachePDFBoxTest extends TestCase{
	
	public void testGetPdfInfo() throws Exception {
		
		ApachePDFBoxProcessor pdfbox = ApachePDFBoxFactory.getProcessor();
		File file = TestConfiguration.getTestFile("adobe.pdf");
		PdfInfo info = pdfbox.getPdfInfo(file);
		if( info.file != file) {
			fail("Unexpected file");
		}
		if( 595 != info.width) {
			fail("Unexpected width");
		}
		if( 842 != info.height) {
			fail("Unexpected height");
		}
	}
	
	public void testCreatePdfThumbnail() throws Exception {
		ApachePDFBoxProcessor pdfbox = ApachePDFBoxFactory.getProcessor();
		File file = TestConfiguration.getTestFile("adobe.pdf");
		File outputFile = new File(file.getParentFile(), file.getName()+"_thumb.jpeg");
		
		pdfbox.createPdfThumbnail(pdfbox.getPdfInfo(file), outputFile, 350, 350);
		
	}
}
