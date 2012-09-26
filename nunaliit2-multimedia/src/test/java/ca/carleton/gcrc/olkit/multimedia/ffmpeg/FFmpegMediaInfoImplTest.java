package ca.carleton.gcrc.olkit.multimedia.ffmpeg;

import java.io.File;
import java.io.StringReader;

import junit.framework.TestCase;

public class FFmpegMediaInfoImplTest extends TestCase {

	public void test1() throws Exception {
		String testString = 
"Seems stream 1 codec frame rate differs from container frame rate: 1000.00 (1000/1) -> 30.00 (30/1)\n"+
"Input #0, asf, from 'whale.WMV':\n"+
"  Metadata:\n"+
"    WMFSDKVersion   : 8.00.00.4487\n"+
"    WMFSDKNeeded    : 0.0.0.0000\n"+
"    title           : whales\n"+
"    author          : DDD\n"+
"    copyright       : 2005-4-18\n"+
"    comment         : \n"+
"  Duration: 00:00:18.03, start: 3.100000, bitrate: 230 kb/s\n"+
"    Chapter #0.0: start 3.100000, end 21.133000\n"+
"    Metadata:\n"+
"      title           : Clip 3\n"+
"    Stream #0.0: Audio: wmav2, 32000 Hz, 2 channels, s16, 32 kb/s\n"+
"    Stream #0.1: Video: wmv1, yuv420p, 320x240, 30 tbr, 1k tbn, 1k tbc\n"+
"";
		
		StringReader reader = new StringReader(testString);
		FFmpegMediaInfoImpl info = new FFmpegMediaInfoImpl( new File("./test") );
		info.parseFromFFmpegReader(reader);
		
		if( false == info.getFileType().equals("asf") ) {
			fail("Invalid file type");
		}
		if( false == info.getDurationString().equals("00:00:18.03") ) {
			fail("Invalid duration string");
		}
		if( info.getDurationInSec().intValue() != 18 ) {
			fail("Invalid duration in sec");
		}
		if( false == info.getStartString().equals("3.100000") ) {
			fail("Invalid start string");
		}
		if( info.getStartInSec().intValue() != 3 ) {
			fail("Invalid start in sec");
		}
		if( false == info.getBitRateString().equals("230 kb/s") ) {
			fail("Invalid bit rate string");
		}
		if( info.getBitRate().intValue() != 230000 ) {
			fail("Invalid bit rate");
		}
		if( info.getWidth() != 320 ) {
			fail("Invalid width");
		}
		if( info.getHeight() != 240 ) {
			fail("Invalid height");
		}
		if( false == info.getAudioCodec().equals("wmav2") ) {
			fail("Invalid audio codec");
		}
		if( false == info.getVideoCodec().equals("wmv1") ) {
			fail("Invalid video codec");
		}
	}
	
	public void test2() throws Exception {
		String testString = 
"Seems stream 1 codec frame rate differs from container frame rate: 1000.00 (1000/1) -> 30.00 (30/1)\n"+
"Input #0, asf, from 'whale.WMV':\n"+
"  Metadata:\n"+
"    WMFSDKVersion   : 8.00.00.4487\n"+
"    WMFSDKNeeded    : 0.0.0.0000\n"+
"    title           : whales\n"+
"    author          : DDD\n"+
"    copyright       : 2005-4-18\n"+
"    comment         : \n"+
"  Duration: 00:00:18.03, bitrate: 230 kb/s\n"+
"    Chapter #0.0: start 3.100000, end 21.133000\n"+
"    Metadata:\n"+
"      title           : Clip 3\n"+
"    Stream #0.0: Audio: wmav2, 32000 Hz, 2 channels, s16, 32 kb/s\n"+
"    Stream #0.1: Video: wmv1, yuv420p, 320x240, 30 tbr, 1k tbn, 1k tbc\n"+
"";
		
		StringReader reader = new StringReader(testString);
		FFmpegMediaInfoImpl info = new FFmpegMediaInfoImpl( new File("./test") );
		info.parseFromFFmpegReader(reader);
		
		if( false == info.getFileType().equals("asf") ) {
			fail("Invalid file type");
		}
		if( false == info.getDurationString().equals("00:00:18.03") ) {
			fail("Invalid duration string");
		}
		if( info.getDurationInSec().intValue() != 18 ) {
			fail("Invalid duration in sec");
		}
		if( null != info.getStartString() ) {
			fail("Invalid start string");
		}
		if( info.getStartInSec().intValue() != 0 ) {
			fail("Invalid start in sec");
		}
		if( false == info.getBitRateString().equals("230 kb/s") ) {
			fail("Invalid bit rate string");
		}
		if( info.getBitRate().intValue() != 230000 ) {
			fail("Invalid bit rate");
		}
		if( info.getWidth() != 320 ) {
			fail("Invalid width");
		}
		if( info.getHeight() != 240 ) {
			fail("Invalid height");
		}
		if( false == info.getAudioCodec().equals("wmav2") ) {
			fail("Invalid audio codec");
		}
		if( false == info.getVideoCodec().equals("wmv1") ) {
			fail("Invalid video codec");
		}
	}
	
	/*
	 * Test from a particular wav file that caused grief on Mac OS X 10.6 with a macports install of ffmpeg
	 * Notably, no "start" field on the "Duration" line.
	 */
	public void test3() throws Exception {
		String testString = 
"FFmpeg version 0.6.1, Copyright (c) 2000-2010 the FFmpeg developers\n"+
"  built on Oct 27 2010 14:31:33 with gcc 4.2.1 (Apple Inc. build 5664)\n"+
"  configuration: --prefix=/opt/local --enable-gpl --enable-postproc --enable-swscale --enable-avfilter --enable-avfilter-lavf --enable-libmp3lame --enable-libvorbis --enable-libtheora --enable-libdirac --enable-libschroedinger --enable-libfaac --enable-libfaad --enable-libxvid --enable-libx264 --enable-libvpx --enable-libspeex --enable-nonfree --mandir=/opt/local/share/man --enable-shared --enable-pthreads --disable-indevs --cc=/usr/bin/gcc-4.2 --arch=x86_64\n"+
"  libavutil     50.15. 1 / 50.15. 1\n"+
"  libavcodec    52.72. 2 / 52.72. 2\n"+
"  libavformat   52.64. 2 / 52.64. 2\n"+
"  libavdevice   52. 2. 0 / 52. 2. 0\n"+
"  libavfilter    1.19. 0 /  1.19. 0\n"+
"  libswscale     1.11. 0 /  1.11. 0\n"+
"  libpostproc   51. 2. 0 / 51. 2. 0\n"+
"[wav @ 0x12180c800]max_analyze_duration reached\n"+
"[wav @ 0x12180c800]Estimating duration from bitrate, this may be inaccurate\n"+
"Input #0, wav, from 'creaking_boat.wav':\n"+
"  Duration: 00:00:12.80, bitrate: 1023 kb/s\n"+
"    Stream #0.0: Audio: pcm_s16le, 32000 Hz, 2 channels, s16, 1024 kb/s\n"+
"At least one output file must be specified"+
"";
		
		StringReader reader = new StringReader(testString);
		FFmpegMediaInfoImpl info = new FFmpegMediaInfoImpl( new File("./test") );
		info.parseFromFFmpegReader(reader);
		
		if( false == info.getFileType().equals("wav") ) {
			fail("Invalid file type");
		}
		if( false == info.getDurationString().equals("00:00:12.80") ) {
			fail("Invalid duration string");
		}
		if( info.getDurationInSec().intValue() != 12 ) {
			fail("Invalid duration in sec");
		}
		if( null != info.getStartString() ) {
			fail("Invalid start string");
		}
		if( info.getStartInSec().intValue() != 0 ) {
			fail("Invalid start in sec");
		}
		if( false == info.getBitRateString().equals("1023 kb/s") ) {
			fail("Invalid bit rate string");
		}
		if( info.getBitRate().intValue() != 1023000 ) {
			fail("Invalid bit rate");
		}
		if( null != info.getWidth() ) {
			fail("Invalid width");
		}
		if( null != info.getHeight() ) {
			fail("Invalid height");
		}
		if( false == info.getAudioCodec().equals("pcm_s16le") ) {
			fail("Invalid audio codec");
		}
		if( null != info.getVideoCodec() ) {
			fail("Invalid video codec");
		}
	}
}
