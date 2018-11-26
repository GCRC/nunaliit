package ca.carleton.gcrc.olkit.multimedia.apachePDFBox;

import java.io.File;

public interface ApachePDFBoxProcessor {

	
	PdfInfo getPdfInfo(File pdfFile) throws Exception;
	
	void createPdfThumbnail(PdfInfo pdfInfo, File thumbnailFile, int maxWidth, int maxHeight ) 
	throws Exception;
}
