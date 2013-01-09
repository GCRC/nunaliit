package ca.carleton.gcrc.olkit.multimedia.utils;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class SystemProcess {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private String command;
	private Process process = null;
	
	public SystemProcess() {
		
	}
	
	public SystemProcess(String command) {
		this.command = command;
	}

	public String getCommand() {
		return command;
	}

	public void setCommand(String command) {
		this.command = command;
	}

	public void start() throws Exception {
//		ProcessBuilder pb = new ProcessBuilder(command);
//		process = pb.start();
		
		Runtime rt = Runtime.getRuntime();
		process = rt.exec(command, null, null);
	}

	public Process getProcess() {
		return process;
	}

	public BufferedReader getInputReader() {
		InputStream inputStream = process.getInputStream();
		InputStreamReader inputReader = new InputStreamReader(inputStream);
		BufferedReader bufReader = new BufferedReader(inputReader);
		return bufReader;
	}

	public BufferedReader getErrorReader() {
		InputStream inputStream = process.getErrorStream();
		InputStreamReader inputReader = new InputStreamReader(inputStream);
		BufferedReader bufReader = new BufferedReader(inputReader);
		return bufReader;
	}
	
}
