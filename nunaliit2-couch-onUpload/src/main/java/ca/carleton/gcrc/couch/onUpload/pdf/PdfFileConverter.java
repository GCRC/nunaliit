package ca.carleton.gcrc.couch.onUpload.pdf;

import java.io.File;
import java.util.Properties;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.client.CouchAuthenticationContext;
import ca.carleton.gcrc.couch.onUpload.UploadConstants;
import ca.carleton.gcrc.couch.onUpload.conversion.AttachmentDescriptor;
import ca.carleton.gcrc.couch.onUpload.conversion.DocumentDescriptor;
import ca.carleton.gcrc.couch.onUpload.conversion.FileConversionContext;
import ca.carleton.gcrc.couch.onUpload.conversion.OriginalFileDescriptor;
import ca.carleton.gcrc.couch.onUpload.plugin.FileConversionMetaData;
import ca.carleton.gcrc.couch.onUpload.plugin.FileConversionPlugin;
import ca.carleton.gcrc.couch.utils.CouchNunaliitUtils;
import ca.carleton.gcrc.olkit.multimedia.converter.MultimediaConversionRequest;
import ca.carleton.gcrc.olkit.multimedia.converter.MultimediaConverter;
import ca.carleton.gcrc.olkit.multimedia.converter.impl.MultimediaConverterImpl;
import ca.carleton.gcrc.olkit.multimedia.file.SystemFile;

public class PdfFileConverter implements FileConversionPlugin {

	protected Logger logger = LoggerFactory.getLogger( this.getClass() );

	private MultimediaConverter mmConverter = new MultimediaConverterImpl();
	private String atlasName = null;

	public PdfFileConverter(){
	}
	
	public PdfFileConverter(Properties props){
		this.parseProperties(props);
	}
	
	public void parseProperties(Properties props){
		if( null != props ) {
			// atlas.name
			{
				String atlasName = props.getProperty("atlas.name", null);
				if( null != atlasName ) {
					this.atlasName = atlasName;
				}
			}
		}
	}

	public String getAtlasName() {
		return atlasName;
	}

	public void setAtlasName(String atlasName) {
		this.atlasName = atlasName;
	}
	
	@Override
	public String getName() {
		return "PDF Converter";
	}

	@Override
	public boolean handlesFileClass(String fileClass, String work) {
		
		if( "pdf".equalsIgnoreCase(fileClass) ) {
			if( work == FileConversionPlugin.WORK_ANALYZE ) {
				return true;
			}
			if( work == FileConversionPlugin.WORK_APPROVE ) {
				return true;
			}
		}
		
		return false;
	}

	@Override
	public FileConversionMetaData getFileMetaData(File file) {
		FileConversionMetaData result = new FileConversionMetaData();

		try {
			SystemFile sf = SystemFile.getSystemFile(file);
			String mimeType = sf.getMimeType();
			String mimeEncoding = sf.getMimeEncoding();

			// Is it a known MIME type?
			if( "application/pdf".equals(mimeType) ) {
				result.setMimeType(mimeType);
				result.setMimeEncoding(mimeEncoding);
				result.setFileClass("pdf");
				result.setFileConvertable(true);
			}
		} catch(Exception e) {
			// Ignore
		}
		
		return result;
	}

	@Override
	public void performWork(
		String work
		,AttachmentDescriptor attDescription
		) throws Exception {
		
		logger.debug("PDF start perform work: "+work);
		
		if( work == FileConversionPlugin.WORK_ANALYZE ) {
			analyzeFile(attDescription);
		
		} else if( work == FileConversionPlugin.WORK_APPROVE ) {
			approveFile(attDescription);
		
		} else {
			throw new Exception("Plugin can not perform work: "+work);
		}
		
		logger.debug("PDF end perform work: "+work);
	}

	public void analyzeFile(AttachmentDescriptor attDescription) throws Exception {
		DocumentDescriptor docDescriptor = attDescription.getDocumentDescriptor();
		OriginalFileDescriptor originalObj = attDescription.getOriginalFileDescription();
		CouchAuthenticationContext submitter = attDescription.getSubmitter();
		
		// Figure out media file located on disk
		File originalFile = originalObj.getMediaFile();

		// Perform conversion(s)
		MultimediaConversionRequest request = new MultimediaConversionRequest();
		request.setInFile( originalFile );
		request.setThumbnailRequested(true);
		request.setSkipConversion(true);
		mmConverter.convertImage(request);
		
		// Report original size
		if( request.getInHeight() != 0 && request.getInWidth() != 0 ) {
			originalObj.setHeight( request.getInHeight() );
			originalObj.setWidth( request.getInWidth() );
		}

		// Original object is the main object
		{
			attDescription.setOriginalUpload(true);
			attDescription.setMediaFileName(originalObj.getMediaFileName());
			attDescription.setContentType(originalObj.getContentType());
			attDescription.setEncodingType(originalObj.getEncodingType());
			attDescription.setSize(originalObj.getSize());
			if( request.getInHeight() != 0 && request.getInWidth() != 0 ) {
				attDescription.setHeight(request.getInHeight());
				attDescription.setWidth(request.getInWidth());
			}
		}

		// Report thumbnail object
		if( request.isThumbnailCreated() ) {
			File thumbFile = request.getThumbnailFile();
			SystemFile thumbSf = SystemFile.getSystemFile(thumbFile);
			
			String thumbnailAttachmentName = computeThumbnailName(attDescription.getAttachmentName(),"jpeg");
			AttachmentDescriptor thumbnailObj = docDescriptor.getAttachmentDescription(thumbnailAttachmentName);

			if( CouchNunaliitUtils.hasVetterRole(submitter, atlasName) ) {
				thumbnailObj.setStatus(UploadConstants.UPLOAD_STATUS_APPROVED);
			} else {
				thumbnailObj.setStatus(UploadConstants.UPLOAD_STATUS_WAITING_FOR_APPROVAL);
			}
			thumbnailObj.setFileClass("image");
			thumbnailObj.setOriginalName(attDescription.getOriginalName());
			thumbnailObj.setMediaFileName(thumbFile.getName());
			thumbnailObj.setSource(attDescription.getAttachmentName());

			thumbnailObj.setSize(thumbFile.length());
			thumbnailObj.setContentType(thumbSf.getMimeType());
			thumbnailObj.setEncodingType(thumbSf.getMimeEncoding());

			if( request.getThumbnailHeight() != 0 && request.getThumbnailWidth() != 0 ) {
				thumbnailObj.setHeight(request.getThumbnailHeight());
				thumbnailObj.setWidth(request.getThumbnailWidth());
			}

			attDescription.setThumbnailReference(thumbnailAttachmentName);
		}
	}

	public void approveFile(AttachmentDescriptor attDescription) throws Exception {
		// Upload file
		FileConversionContext conversionContext = attDescription.getContext();
		String attachmentName = attDescription.getAttachmentName();
		File file = attDescription.getMediaFile();
		String mimeType = attDescription.getContentType();
		conversionContext.uploadFile(attachmentName, file, mimeType);
	}

	private String computeThumbnailName(String attachmentName, String extension) {
		if( null == attachmentName ) {
			if( null != extension ) {
				return "thumbnail."+extension;
			} else {
				return "thumbnail";
			}
		}
		
		// Select a different file name
		String prefix = "";
		String suffix = "";
		int pos = attachmentName.lastIndexOf('.');
		if( pos < 1 ) {
			prefix = attachmentName;
		} else {
			prefix = attachmentName.substring(0, pos);
			suffix = attachmentName.substring(pos);
		}
		
		// Change extension if specified
		if( null != extension ){
			suffix = "."+extension;
		}
		
		String thumbnailName = prefix + "_thumb" + suffix;
		
		return thumbnailName;
	}
}
