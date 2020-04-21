package ca.carleton.gcrc.olkit.multimedia.converter;

import java.io.File;
import java.math.BigInteger;

import ca.carleton.gcrc.olkit.multimedia.xmp.XmpInfo;
import org.apache.commons.io.FileUtils;


public class MultimediaConversionRequest {

	private boolean thumbnailRequested = false;
	private boolean conversionPerformed = false;
	private boolean thumbnailCreated = false;
	private boolean skipConversion = false;
	private File inFile;
	private long inFileSizeMb;
	private int inHeight = 0;
	private int inWidth = 0;
	private float inDurationInSec = (float) 0.0;
	private File outFile;
	private int outHeight = 0;
	private int outWidth = 0;
	private float outDurationInSec = (float) 0.0;
	private File thumbnailFile;
	private int thumbnailHeight = 0;
	private int thumbnailWidth = 0;
	private ExifData exifData = null;
	private XmpInfo xmpInfo = null;
	private MultimediaConversionProgress progress;
	
	public File getInFile() {
		return inFile;
	}
	public void setInFile(File inFile) {
		this.inFile = inFile;
		BigInteger sizeInBytes = FileUtils.sizeOfAsBigInteger(inFile);
		BigInteger sizeInMbBigInt = sizeInBytes.divide(BigInteger.valueOf(FileUtils.ONE_MB));
		// Safe to convert to long now that it's in MB.
		inFileSizeMb = sizeInMbBigInt.longValue();
	}

	public long getInFileSizeMb() {
		return inFileSizeMb;
	}

	public int getInHeight() {
		return inHeight;
	}
	public void setInHeight(int inHeight) {
		this.inHeight = inHeight;
	}

	public int getInWidth() {
		return inWidth;
	}
	public void setInWidth(int inWidth) {
		this.inWidth = inWidth;
	}

	public float getInDurationInSec() {
		return inDurationInSec;
	}
	public void setInDurationInSec(float inDurationInSec) {
		this.inDurationInSec = inDurationInSec;
	}

	public boolean isThumbnailRequested() {
		return thumbnailRequested;
	}
	public void setThumbnailRequested(boolean thumbnailRequested) {
		this.thumbnailRequested = thumbnailRequested;
	}
	
	public boolean isThumbnailCreated() {
		return thumbnailCreated;
	}
	public void setThumbnailCreated(boolean thumbnailCreated) {
		this.thumbnailCreated = thumbnailCreated;
	}

	public boolean isSkipConversion() {
		return skipConversion;
	}
	public void setSkipConversion(boolean skipConversion) {
		this.skipConversion = skipConversion;
	}
	
	public File getOutFile() {
		return outFile;
	}
	public void setOutFile(File outFile) {
		this.outFile = outFile;
	}

	public int getOutHeight() {
		return outHeight;
	}
	public void setOutHeight(int outHeight) {
		this.outHeight = outHeight;
	}

	public int getOutWidth() {
		return outWidth;
	}
	public void setOutWidth(int outWidth) {
		this.outWidth = outWidth;
	}
	
	public float getOutDurationInSec() {
		return outDurationInSec;
	}
	public void setOutDurationInSec(float outDurationInSec) {
		this.outDurationInSec = outDurationInSec;
	}

	public File getThumbnailFile() {
		return thumbnailFile;
	}
	public void setThumbnailFile(File thumbnailFile) {
		this.thumbnailFile = thumbnailFile;
	}

	public int getThumbnailHeight() {
		return thumbnailHeight;
	}
	public void setThumbnailHeight(int thumbnailHeight) {
		this.thumbnailHeight = thumbnailHeight;
	}

	public int getThumbnailWidth() {
		return thumbnailWidth;
	}
	public void setThumbnailWidth(int thumbnailWidth) {
		this.thumbnailWidth = thumbnailWidth;
	}
	
	public boolean isConversionPerformed() {
		return conversionPerformed;
	}
	public void setConversionPerformed(boolean conversionPerformed) {
		this.conversionPerformed = conversionPerformed;
	}

	public MultimediaConversionProgress getProgress() {
		return progress;
	}
	public void setProgress(MultimediaConversionProgress progress) {
		this.progress = progress;
	}
	
	public ExifData getExifData() {
		return exifData;
	}
	public void setExifData(ExifData exifData) {
		this.exifData = exifData;
	}
	
	public XmpInfo getXmpData() {
		return xmpInfo;
	}
	public void setXmpData(XmpInfo xmpInfo) {
		this.xmpInfo = xmpInfo;
	}
}
