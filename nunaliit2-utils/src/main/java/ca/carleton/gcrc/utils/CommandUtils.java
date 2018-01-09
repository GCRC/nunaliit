package ca.carleton.gcrc.utils;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.StringReader;
import java.io.StringWriter;
import java.io.Writer;
import java.util.List;
import java.util.Vector;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class CommandUtils {

	final static protected Logger logger = LoggerFactory.getLogger(CommandUtils.class);

	/**
	 * Takes a single line command as a string and breaks it up in tokens
	 * acceptable for the java.lang.ProcessBuilder.ProcessBuilder
	 * @param command Complete command as a single string
	 * @return Array of strings that are acceptable tokens for ProcessBuilder
	 * @throws Exception 
	 */
	static public List<String> breakUpCommand(String command) throws Exception{
		try {
			List<String> commandTokens = new Vector<String>();
			
			StringBuilder currentToken = null;
			boolean isTokenQuoted = false;
			StringReader sr = new StringReader(command);
			int b = sr.read();
			while( b >= 0 ){
				char c = (char)b;

				if( null == currentToken ){
					// At token is not in progress

					// Skipping spaces
					if( ' ' == c || '\t' == c ){
						
					} else if( '"' == c ) {
						// Starting a quoted token
						currentToken = new StringBuilder();
						//currentToken.append(c);
						isTokenQuoted = true;
					} else {
						// Starting a non-quoted token
						currentToken = new StringBuilder();
						currentToken.append(c);
						isTokenQuoted = false;
					}

				} else if( isTokenQuoted ) {
					// A quoted token is in progress. It ends with a quote
					if( '"' == c ){
						//currentToken.append(c);
						String token = currentToken.toString();
						currentToken = null;
						commandTokens.add(token);

					} else {
						// Continuation
						currentToken.append(c);
					}
					
				} else {
					// A non-quoted token is in progress. It ends with a space
					if( ' ' == c || '\t' == c ){
						String token = currentToken.toString();
						currentToken = null;
						commandTokens.add(token);

					} else {
						// Continuation
						currentToken.append(c);
					}
				}
				
				b = sr.read();
			}
			
			if( null != currentToken ){
				String token = currentToken.toString();
				commandTokens.add(token);
			}

			return commandTokens;

		} catch (IOException e) {
			throw new Exception("Error while breaking up command into tokens: "+command,e);
		}
	}

	static public void executeCommand(String command, Writer writer) throws Exception {
		List<String> commandTokens = breakUpCommand(command);
		executeCommand(commandTokens, (String)null, writer);
	}	

	static public void executeCommand(String command, String content, Writer writer) throws Exception {
		List<String> commandTokens = breakUpCommand(command);
		executeCommand(commandTokens, content, writer);
	}	

	static public void executeCommand(List<String> commandTokens, Writer writer) throws Exception {
		executeCommand(commandTokens, (String)null, writer);
	}	

	static public void executeCommand(List<String> commandTokens, String content, Writer writer) throws Exception {
		String commandStr = null;

		try {
			// Turn command into a string to report error
			{
				StringBuilder sb = new StringBuilder();
				if( null != commandTokens ){
					boolean first = true;
					for(String token : commandTokens){
						if( first ){
							first = false;
						} else {
							sb.append(' ');
						}
						sb.append(token);
					}
				}
				commandStr = sb.toString();
			}

			ProcessBuilder pb = new ProcessBuilder(commandTokens);
			Process p = pb.start();

			OutputStream os = p.getOutputStream();
			if( null != content ){
				OutputStreamWriter osw = new OutputStreamWriter(os, "UTF-8");
				osw.write(content);
				osw.flush();
				osw.close();
			}
			os.close();

			InputStream err = p.getErrorStream();
			InputStreamReader errReader = new InputStreamReader(err,"UTF-8");
			StringWriter errWriter = new StringWriter();
			ReadGobbler errGobbler = new ReadGobbler(errReader, errWriter);
			errGobbler.start();

			InputStream is = p.getInputStream();
			InputStreamReader isr = new InputStreamReader(is,"UTF-8");
			BufferedReader bufReader = new BufferedReader(isr);
			
			char[] cbuf = new char[1024];
			int size = bufReader.read(cbuf);
			while( size >= 0 ) {
				if( null != writer ){
					writer.write(cbuf,0,size);
				}
				
				size = bufReader.read(cbuf);
			}

			if( null != writer ){
				writer.flush();
			}

			int exitValue = p.waitFor();
			
			errGobbler.join();
			
			if( 0 != exitValue ){
				logger.info("Command ("+commandStr+") exited with value "+exitValue+": "+errWriter.toString());
				throw new Exception("Process exited with value: "+exitValue);
			}
			
		} catch (Exception e) {
			throw new Exception("Error while running command: "+commandStr,e);
		}
	}

	static public BufferedReader executeCommand(String command) throws Exception {
		List<String> commandTokens = breakUpCommand(command);
		return executeCommand(commandTokens, (String)null);
	}	

	static public BufferedReader executeCommand(String command, String content) throws Exception {
		List<String> commandTokens = breakUpCommand(command);
		return executeCommand(commandTokens, content);
	}	

	static public BufferedReader executeCommand(List<String> commandTokens) throws Exception {
		return executeCommand(commandTokens, (String)null);
	}	

	static public BufferedReader executeCommand(List<String> commandTokens, String content) throws Exception {
		String commandStr = null;

		try {
			// Turn command into a string to report error
			{
				StringBuilder sb = new StringBuilder();
				if( null != commandTokens ){
					boolean first = true;
					for(String token : commandTokens){
						if( first ){
							first = false;
						} else {
							sb.append(' ');
						}
						sb.append(token);
					}
				}
				commandStr = sb.toString();
			}

			ProcessBuilder pb = new ProcessBuilder(commandTokens);
			Process p = pb.start();

			InputStream err = p.getErrorStream();
			InputStreamReader errReader = new InputStreamReader(err,"UTF-8");
			StringWriter errWriter = new StringWriter();
			ReadGobbler errGobbler = new ReadGobbler(errReader, errWriter);
			errGobbler.start();

			InputStream std = p.getInputStream();
			InputStreamReader stdReader = new InputStreamReader(std,"UTF-8");

			OutputStream os = p.getOutputStream();
			if( null != content ){
				OutputStreamWriter osw = new OutputStreamWriter(os, "UTF-8");
				osw.write(content);
				osw.flush();
				osw.close();
			}
			os.close();
			
			
			StringWriter stdWriter = new StringWriter();
			char[] cbuf = new char[1024];
			int size = stdReader.read(cbuf);
			while( size >= 0 ) {
				stdWriter.write(cbuf,0,size);
				
				size = stdReader.read(cbuf);
			}

			stdWriter.flush();

			int exitValue = p.waitFor();
			
			errGobbler.join();
			
			if( 0 != exitValue ){
				if( errWriter.toString().isEmpty() ) {
					// No error was output. Dump stdout
					logger.info("Command ("+commandStr+") exited with value "+exitValue+": "+stdWriter.toString());
				} else {
					logger.info("Command ("+commandStr+") exited with value "+exitValue+": "+errWriter.toString());
				}
				throw new Exception("Process exited with value: "+exitValue);
			}
			
			StringReader sr = new StringReader(stdWriter.toString());
			BufferedReader br = new BufferedReader(sr);
			
			return br;
			
		} catch (Exception e) {
			throw new Exception("Error while running command: "+commandStr,e);
		}
	}
}
