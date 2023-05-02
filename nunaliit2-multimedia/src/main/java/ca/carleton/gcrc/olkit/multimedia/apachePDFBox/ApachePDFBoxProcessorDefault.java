package ca.carleton.gcrc.olkit.multimedia.apachePDFBox;

import java.awt.Graphics2D;
import java.awt.Image;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;



import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.olkit.multimedia.apachePDFBox.imageio.*;


public class ApachePDFBoxProcessorDefault implements ApachePDFBoxProcessor {
	
	static public int DPI =  72;
	static public float QUALITY = 1.0f;
	static public String IMAGEFORMAT = "jpeg";
	
	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	
	public ApachePDFBoxProcessorDefault (){
	};

	@Override
	public PdfInfo getPdfInfo(File pdfFile) throws Exception {
		PdfInfo pdfinfo = new PdfInfo();
		pdfinfo.file = pdfFile;
		PDDocument document = null;
		try {
			
			document = PDDocument.load(pdfFile);
			PDRectangle baseSize = document.getPage(0).getMediaBox();
			pdfinfo.width = (int)baseSize.getWidth();
			pdfinfo.height = (int)baseSize.getHeight();
			logger.debug("The geometry of pdf file: Width: " + pdfinfo.width + "Height: " 
					+ pdfinfo.height);
			return pdfinfo;
		}catch(Exception e) {
			throw new Exception("Unable to determine the pdf page info",e);
			
		} 
		finally {
			if( document !=null )
			{
				document.close();
			}
		}
	}
	@Override
	public void createPdfThumbnail(PdfInfo pdfInfo, File thumbnailFile, int maxWidth, int maxHeight ) 
	throws Exception
	{
		
		
		PDDocument document = null;
		
		String outputPrefix = null;
		
		if(outputPrefix == null) {
			String thumbnailFileName = thumbnailFile.getName();
			outputPrefix = thumbnailFileName.substring (0, thumbnailFileName.lastIndexOf('.') );
		}
		try
		{
			document = PDDocument.load(pdfInfo.file);
			boolean success = true;
			PDFRenderer renderer = new PDFRenderer(document);
			renderer.setSubsamplingAllowed(true);
		
			ImageType imageType = ImageType.RGB;
			BufferedImage image = renderer.renderImageWithDPI(0, DPI, imageType);
			BufferedImage resizedImage = _scaleImage(image, maxWidth, maxHeight);
			
			success &= _writeImage(resizedImage, thumbnailFile, DPI);
			
			if (!success) {
				throw new Exception("Error: no writer found for image format '" + IMAGEFORMAT + "'");
				
			}

		} catch (IOException e) {
			throw new Exception("Error while loading the pdf file into PDFBox PDDocument");
		} catch (Exception e) {
			throw new Exception ("Error while writing image to the file");
		}
		
		finally {
			if (document != null) {
				try {
					document.close();
				} catch (IOException e) {
					e.printStackTrace();
				}
			}
		}
		
	}
	private boolean _writeImage (BufferedImage resizedImage, File thumbnailFile, int dpi) throws Exception {
		boolean success = true;
		try(FileOutputStream output = new FileOutputStream(thumbnailFile)) {
			success &= ImageIOUtil.writeImage(resizedImage, IMAGEFORMAT, output, dpi, QUALITY, "");
		} catch(Exception e) {
			e.printStackTrace();
		}
		if (!success) {
			throw new Exception("Error: no writer found for image format "+ IMAGEFORMAT);
		}
		return success;
		
	}
	private BufferedImage _scaleImage( BufferedImage img, int width, int height) {
		BufferedImage dimg = null;
		try
		{ 
			Image tmp = img.getScaledInstance(width, -1, Image.SCALE_SMOOTH);
			//logger.debug(tmp.getWidth(null)+  " : " + tmp.getHeight(null));
			dimg = new BufferedImage(tmp.getWidth(null), tmp.getHeight(null), BufferedImage.TYPE_INT_RGB);

			Graphics2D g2d = dimg.createGraphics();
			g2d.drawImage(tmp, 0, 0, null);
			g2d.dispose();
		}
		catch (Exception e)
		{
			e.printStackTrace();
		}
		return dimg;
	}
	
	
}
