package ca.carleton.gcrc.olkit.multimedia.apachePDFBox;

import java.io.File;

import ca.carleton.gcrc.olkit.multimedia.utils.TestConfiguration;
import junit.framework.TestCase;

public class ApachePDFBoxTest extends TestCase{
	
	public void testGetPdfInfo() throws Exception {
		
		ApachePDFBoxProcessor pdfbox = ApachePDFBoxProcessorDefault.getProcessor();
		File file = TestConfiguration.getTestFile("22 77 21 - Schadensstatistiken mit dem Stand vom 1. Mai 1944 - Schnellermittlung_Düsseldorf.pdf");
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
		ApachePDFBoxProcessor pdfbox = ApachePDFBoxProcessorDefault.getProcessor();
		File file = TestConfiguration.getTestFile("22 77 21 - Schadensstatistiken mit dem Stand vom 1. Mai 1944 - Schnellermittlung_Düsseldorf.pdf");
		File outputFile = new File(file.getParentFile(), file.getName()+"_thumb.jpeg");
		
		pdfbox.createPdfThumbnail(pdfbox.getPdfInfo(file), outputFile, 350, 350);
		
	}
}
