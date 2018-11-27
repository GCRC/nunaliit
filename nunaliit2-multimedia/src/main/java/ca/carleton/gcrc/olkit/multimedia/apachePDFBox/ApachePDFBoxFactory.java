package ca.carleton.gcrc.olkit.multimedia.apachePDFBox;

public class ApachePDFBoxFactory {

	static public ApachePDFBoxProcessor g_apachePdfBoxProcessor = null;

	static synchronized public ApachePDFBoxProcessor getProcessor() {
		if( null == g_apachePdfBoxProcessor ) {
			g_apachePdfBoxProcessor = new ApachePDFBoxProcessorDefault();
		} 
		return g_apachePdfBoxProcessor;
		
	}
}
