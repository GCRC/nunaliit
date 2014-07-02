package ca.carleton.gcrc.javascript;

public interface JavascriptRunnerListener {

	void unexpectedError(Exception e);

	void compileError(
			String details, 
			String sourceName, 
			int lineNumber,
			int columnNumber);

	void runtimeError(String details, String sourceName, int lineNumber);

}
