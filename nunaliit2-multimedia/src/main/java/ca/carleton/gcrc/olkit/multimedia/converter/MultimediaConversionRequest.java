package ca.carleton.gcrc.olkit.multimedia.converter;

import java.io.File;


public class MultimediaConversionRequest {

	private boolean thumbnailRequested = false;
	private boolean conversionPerformed = false;
	private boolean thumbnailCreated = false;
	private File inFile;
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
	private MultimediaConversionProgress progress;
	
	public File getInFile() {
		return inFile;
	}
	public void setInFile(File inFile) {
		this.inFile = inFile;
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
}
