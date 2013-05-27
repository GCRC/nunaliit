/*
Copyright (c) 2010, Geomatics and Cartographic Research Centre, Carleton 
University
All rights reserved.

Redistribution and use in source and binary forms, with or without 
modification, are permitted provided that the following conditions are met:

 - Redistributions of source code must retain the above copyright notice, 
   this list of conditions and the following disclaimer.
 - Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.
 - Neither the name of the Geomatics and Cartographic Research Centre, 
   Carleton University nor the names of its contributors may be used to 
   endorse or promote products derived from this software without specific 
   prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE 
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE 
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE 
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF 
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS 
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN 
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) 
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE 
POSSIBILITY OF SUCH DAMAGE.

$Id$
*/
package ca.carleton.gcrc.olkit.multimedia.ffmpeg;

import java.io.File;

import junit.framework.TestCase;
import ca.carleton.gcrc.olkit.multimedia.utils.MultimediaTestingProgress;
import ca.carleton.gcrc.olkit.multimedia.utils.TestConfiguration;

public class FFmpegTest extends TestCase {

	public void testGetInfo() {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		FFmpeg.getInfo();
	}

	public void testGetMediaInfo1() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		FFmpegProcessor ffmpeg = FFmpeg.getProcessor(new MultimediaTestingProgress());
		
		{
			File file = TestConfiguration.getTestFile("Cinemap_BonCop2.mov");
			FFmpegMediaInfo info = ffmpeg.getMediaInfo(file);
			
			if( info.getFile() != file ) {
				fail("Unexpected file");
			}
			if( info.getBitRate() != 425000 ) {
				fail("Unexpected bitrate");
			}
			if( info.getDurationInSec().intValue() != 69 ) {
				fail("Unexpected duration");
			}
			if( false == info.getFileType().equalsIgnoreCase("mov") ) {
				fail("Unexpected file type");
			}
			if( info.getHeight() != 230 ) {
				fail("Unexpected height");
			}
			if( info.getWidth() != 375 && info.getWidth() != 376 ) {
				fail("Unexpected width");
			}
			if( false == info.getVideoCodec().equals("h264") ) {
				fail("Unexpected video codec");
			}
			if( false == info.getAudioCodec().equals("mpeg4aac") &&
				false == info.getAudioCodec().equals("aac") ) {
				fail("Unexpected audio codec");
			}
		}
	}
	
	public void testGetMediaInfo2() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		FFmpegProcessor ffmpeg = FFmpeg.getProcessor(new MultimediaTestingProgress());
		
		{
			File file = TestConfiguration.getTestFile("whale.WMV");
			FFmpegMediaInfo info = ffmpeg.getMediaInfo(file);
			
			if( info.getFile() != file ) {
				fail("Unexpected file");
			}
			if( info.getBitRate() != 230000 && info.getBitRate() != 276000 ) {
				fail("Unexpected bitrate");
			}
			if( info.getDurationInSec().intValue() != 18 &&
				(info.getDurationInSec().intValue() + info.getStartInSec().intValue()) != 18 ) {
				fail("Unexpected duration");
			}
			if( false == info.getFileType().equalsIgnoreCase("asf") ) {
				fail("Unexpected file type");
			}
			if( info.getHeight() != 240 ) {
				fail("Unexpected height");
			}
			if( info.getWidth() != 320 ) {
				fail("Unexpected width");
			}
			if( false == info.getVideoCodec().equals("wmv1") ) {
				fail("Unexpected video codec");
			}
			if( false == info.getAudioCodec().equals("wmav2") ) {
				fail("Unexpected audio codec");
			}
		}
	}
	
	public void testGetMediaInfo3() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		FFmpegProcessor ffmpeg = FFmpeg.getProcessor(new MultimediaTestingProgress());
		
		{
			File file = TestConfiguration.getTestFile("graphomap_key.mov");
			FFmpegMediaInfo info = ffmpeg.getMediaInfo(file);
			
			if( info.getFile() != file ) {
				fail("Unexpected file");
			}
			if( info.getBitRate() != 143000 ) {
				fail("Unexpected bitrate");
			}
			if( info.getDurationInSec().intValue() != 111 ) {
				fail("Unexpected duration");
			}
			if( false == info.getFileType().equalsIgnoreCase("mov") ) {
				fail("Unexpected file type");
			}
			if( info.getHeight() != 230 ) {
				fail("Unexpected height");
			}
			if( info.getWidth() != 375 && info.getWidth() != 376 ) {
				fail("Unexpected width");
			}
			if( false == info.getVideoCodec().equals("h264") ) {
				fail("Unexpected video codec");
			}
			if( false == info.getAudioCodec().equals("mpeg4aac") &&
				false == info.getAudioCodec().equals("aac") ) {
				fail("Unexpected audio codec");
			}
		}
	}
	
	public void testGetMediaInfo4() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		FFmpegProcessor ffmpeg = FFmpeg.getProcessor(new MultimediaTestingProgress());
		
		{
			File file = TestConfiguration.getTestFile("satellite.mp3");
			FFmpegMediaInfo info = ffmpeg.getMediaInfo(file);
			
			if( info.getFile() != file ) {
				fail("Unexpected file");
			}
			if( info.getBitRate() != 128000 ) {
				fail("Unexpected bitrate");
			}
			if( info.getDurationInSec().intValue() != 4 ) {
				fail("Unexpected duration");
			}
			if( false == info.getFileType().equalsIgnoreCase("mp3") ) {
				fail("Unexpected file type");
			}
			if( false == info.getAudioCodec().equals("mp3") ) {
				fail("Unexpected audio codec");
			}
		}
	}
	
	public void testGetMediaInfo5() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		FFmpegProcessor ffmpeg = FFmpeg.getProcessor(new MultimediaTestingProgress());
		
		{
			File file = TestConfiguration.getTestFile("steps_sound.ogg");
			FFmpegMediaInfo info = ffmpeg.getMediaInfo(file);
			
			if( info.getFile() != file ) {
				fail("Unexpected file");
			}
			// Too finicky between platforms
//			if( info.getBitRate() != 37000 
//			 && info.getBitRate() != 35000 ) {
//				fail("Unexpected bitrate");
//			}
//			if( info.getDurationInSec().intValue() != 7 ) {
//				fail("Unexpected duration");
//			}
			if( false == info.getFileType().equalsIgnoreCase("ogg") ) {
				fail("Unexpected file type");
			}
			if( false == info.getAudioCodec().equals("vorbis") ) {
				fail("Unexpected audio codec");
			}
		}
	}
	
	public void testConvertVideo() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		FFmpegProcessor ffmpeg = FFmpeg.getProcessor(new MultimediaTestingProgress());
		
		{
			File file = TestConfiguration.getTestFile("whale.WMV");
			File parent = file.getParentFile();
			File output = new File(parent,"test.mp4");
			
			ffmpeg.convertVideo(file, output);
			
			if( false == output.exists() ) {
				fail("Output file not created");
			}
			FFmpegMediaInfo info = ffmpeg.getMediaInfo(output);
			if( null == info ) {
				fail("Unbale to obtain info on converted file");
			}
		}
	}
	
	public void testConvertAudio() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		FFmpegProcessor ffmpeg = FFmpeg.getProcessor(new MultimediaTestingProgress());
		
		{
			File file = TestConfiguration.getTestFile("steps_sound.ogg");
			File parent = file.getParentFile();
			File output = new File(parent,"steps_sound.ogg.mp4");
			
			ffmpeg.convertAudio(file, output);
			
			if( false == output.exists() ) {
				fail("Output file not created");
			}
			FFmpegMediaInfo info = ffmpeg.getMediaInfo(output);
			if( null == info ) {
				fail("Unbale to obtain info on converted file");
			}
		}
	}
	
	public void testCreateThumbnail() throws Exception {
		if( false == TestConfiguration.isTestingConfigured() ) return;
		
		FFmpegProcessor ffmpeg = FFmpeg.getProcessor(new MultimediaTestingProgress());
		
		{
			File file = TestConfiguration.getTestFile("whale.WMV");
			File parent = file.getParentFile();
			File output = new File(parent,"whale_thumb.png");
			
			ffmpeg.createThumbnail(file, output, 80, 80);
			
			if( false == output.exists() ) {
				fail("Output file not created");
			}
		}
	}
}
