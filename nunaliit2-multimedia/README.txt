TESTING
-------

If you wish the test cases to be run during Maven testing, copy file
	.../src/test/resources/multimedia.properties.example
to
	.../src/test/resources/multimedia.properties
	
Ubuntu 10.10
------------

sudo wget http://www.medibuntu.org/sources.list.d/`lsb_release -cs`.list --output-document=/etc/apt/sources.list.d/medibuntu.list && sudo apt-get -q update && sudo apt-get --yes -q --allow-unauthenticated install medibuntu-keyring && sudo apt-get -q update
sudo apt-get install ffmpeg libavcodec-extra-52


Using an older version of libavcodec-extra-52 that supports libfaac

apt-cache show libavcodec-extra-52
sudo apt-get install libavcodec-extra-52=4:0.6-2ubuntu3+medibuntu1


FFMpeg Installation
-------------------
ffmpegConvertVideoCommand=ffmpeg -i %1$s -y -acodec aac -ab 48000 -ac 2 -vcodec mpeg4 -b 128000 -s 320x240 -f mp4 %2$s


Enable repositories: restricted, universe, multiverse

Ubuntu 10.04 (does not work)
sudo apt-get install libavcodec-unstripped-52
sudo apt-get install libavdevice-unstripped-52
sudo apt-get install libavformat-unstripped-52
sudo apt-get install libavfilter-extra-0
sudo apt-get install libavutil-unstripped-49
sudo apt-get install libpostproc-unstripped-51
sudo apt-get install libswscale-unstripped-0
sudo apt-get install libfaac0
sudo apt-get install ffmpeg

Compile ffmpeg for 10.04 (works):
sudo apt-get update
sudo apt-get install build-essential git-core checkinstall yasm texi2html libfaac-dev \
 libopencore-amrnb-dev libopencore-amrwb-dev libsdl1.2-dev libtheora-dev \
 libvorbis-dev libx11-dev libxfixes-dev libxvidcore-dev zlib1g-dev
cd
mkdir src
cd src
git clone git://git.videolan.org/x264.git
cd x264
./configure
make
sudo checkinstall --pkgname=x264 --pkgversion "2:0.$(grep X264_BUILD x264.h -m1 | \
 cut -d' ' -f3).$(git rev-list HEAD | wc -l)+git$(git rev-list HEAD -n 1 | \
 head -c 7)" --backup=no --default --deldoc=yes
sudo apt-get remove libmp3lame-dev
sudo apt-get install nasm
cd ~/src
wget http://downloads.sourceforge.net/project/lame/lame/3.98.4/lame-3.98.4.tar.gz
tar xzvf lame-3.98.4.tar.gz
cd lame-3.98.4
./configure --enable-nasm --disable-shared
make
sudo checkinstall --pkgname=lame-ffmpeg --pkgversion="3.98.4" --backup=no --default \
 --deldoc=yes 
cd ~/src
git clone git://review.webmproject.org/libvpx.git
cd libvpx
./configure
make
sudo checkinstall --pkgname=libvpx --pkgversion="$(date +%Y%m%d%H%M)-git" --backup=no \
 --default --deldoc=yes
cd ~/src
git clone git://git.ffmpeg.org/ffmpeg.git
cd ffmpeg
./configure --enable-gpl --enable-version3 --enable-nonfree --enable-postproc \
 --enable-libfaac --enable-libopencore-amrnb --enable-libopencore-amrwb \
 --enable-libtheora --enable-libvorbis --enable-libx264 --enable-libxvid \
 --enable-x11grab --enable-libmp3lame --enable-libvpx
make
sudo checkinstall --pkgname=ffmpeg --pkgversion="5:$(./version.sh)" --backup=no \
 --deldoc=yes --default
hash x264 ffmpeg ffplay ffprobe 


to remove:
sudo apt-get remove x264 ffmpeg qt-faststart build-essential git-core checkinstall \
    nasm yasm texi2html libfaac-dev lame-ffmpeg libsdl1.2-dev libtheora-dev libvorbis-dev \
    libx11-dev libxfixes-dev libxvidcore-dev zlib1g-dev


Ubuntu 10.10 (does not work):
sudo apt-get install libavcodec-unstripped-52
sudo apt-get install libavdevice-unstripped-52
sudo apt-get install libavformat-unstripped-52
sudo apt-get install libavfilter-extra-1
sudo apt-get install libavutil-unstripped-50
sudo apt-get install libpostproc-unstripped-51
sudo apt-get install libswscale-unstripped-0
sudo apt-get install ffmpeg



Conversion commands:
ffmpeg -i whale.WMV -y -acodec libfaac -ab 48000 -ac 2 -vcodec libx264 -vpre slow -b 128000 -s 320x240 -threads 0 -f mp4 whale.mp4

Command that works on 10.10 devel machine:
ffmpeg -i %1$s -y -acodec aac -ab 48000 -ac 2 -vcodec mpeg4 -b 128000 -s 320x240 -f mp4 %2$s


Report whale.WMV 10.04
Seems stream 1 codec frame rate differs from container frame rate: 1000.00 (1000/1) -> 30.00 (30/1)
Input #0, asf, from 'whale.WMV':
  Duration: 00:00:15.00, start: 3.100000, bitrate: 276 kb/s
    Stream #0.0: Audio: wmav2, 32000 Hz, stereo, s16, 32 kb/s
    Stream #0.1: Video: wmv1, yuv420p, 320x240, 30 tbr, 1k tbn, 1k tbc
At least one output file must be specified


Report whale.WMV 10.10
Seems stream 1 codec frame rate differs from container frame rate: 1000.00 (1000/1) -> 30.00 (30/1)
Input #0, asf, from 'whale.WMV':
  Metadata:
    WMFSDKVersion   : 8.00.00.4487
    WMFSDKNeeded    : 0.0.0.0000
    title           : whales
    author          : DDD
    copyright       : 2005-4-18
    comment         : 
  Duration: 00:00:18.03, start: 3.100000, bitrate: 230 kb/s
    Chapter #0.0: start 3.100000, end 21.133000
    Metadata:
      title           : Clip 3
    Stream #0.0: Audio: wmav2, 32000 Hz, 2 channels, s16, 32 kb/s
    Stream #0.1: Video: wmv1, yuv420p, 320x240, 30 tbr, 1k tbn, 1k tbc
At least one output file must be specified
