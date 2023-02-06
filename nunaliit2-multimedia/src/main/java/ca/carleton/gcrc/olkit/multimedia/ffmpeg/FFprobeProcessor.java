package ca.carleton.gcrc.olkit.multimedia.ffmpeg;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;

import java.io.BufferedReader;
import org.json.JSONObject;
import org.json.JSONArray;
import java.util.stream.Collectors;

import java.util.List;
import java.util.ArrayList;
import java.util.stream.IntStream;

public class FFprobeProcessor {

    private static final Logger log = LoggerFactory.getLogger(FFprobeProcessor.class);

    private static final String FFPROBE_COMMAND = "ffprobe -v quiet -print_format json -show_streams %s";

    private FFprobeProcessor() {
    }

    public static List<FileStream> getFileStreams(File file) {
        String cmd = String.format(FFPROBE_COMMAND, file.getPath());
        Process process = null;
        List<FileStream> fileStreams = null;
        try {
            process = Runtime.getRuntime().exec(cmd);
            BufferedReader br = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String output = br.lines().collect(Collectors.joining("\n"));
            JSONObject json = new JSONObject(output);
            JSONArray streams = json.getJSONArray("streams");

            fileStreams = IntStream.range(0, streams.length())
                        .mapToObj(i -> {
                            FileStream fileStream = new FileStream();
                            fileStream.setCodecType(streams.getJSONObject(i).getString("codec_type"));
                            return fileStream;
                        })
                        .collect(Collectors.toList());
        } catch (IOException e) {
            log.warn("Problem getting file streams: {}", e.getMessage());
        } finally {
            if (process != null) {
                process.destroy();
            }
        }

        return fileStreams;
    }

}
