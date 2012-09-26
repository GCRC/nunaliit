Compile FFMPEG
--------------

> svn checkout svn://svn.ffmpeg.org/ffmpeg/trunk ffmpeg

> cd ffmpeg

> sudo apt-get install libfaac-dev libgsm1-dev libschroedinger-dev libspeex-dev libtheora-dev libvorbis-dev libdc1394-22-dev

> ./configure --prefix=/usr --enable-avfilter --enable-avfilter-lavf --enable-bzlib --enable-libgsm --enable-libschroedinger --enable-libspeex --enable-libtheora --enable-libvorbis --enable-pthreads --enable-zlib --enable-libfaac --disable-stripping --enable-gpl --enable-postproc --enable-x11grab --enable-libdc1394 --enable-shared --disable-static --enable-nonfree



> LD_LIBRARY_PATH="${FFMPEG_HOME}/libavutil:${FFMPEG_HOME}/libavcodec:${FFMPEG_HOME}/libswscale:${FFMPEG_HOME}/libavformat:${FFMPEG_HOME}/libavdevice:${FFMPEG_HOME}/libpostproc:${FFMPEG_HOME}/libavfilter" ${FFMPEG_HOME}/ffmpeg -i upl4340493453837670413.mp3 -y -acodec libfaac -ab 48000 -ac 2 -threads 0 -f mp4 test.mp4