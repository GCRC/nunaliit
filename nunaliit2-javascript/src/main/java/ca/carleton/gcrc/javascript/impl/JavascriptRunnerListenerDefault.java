package ca.carleton.gcrc.javascript.impl;

import ca.carleton.gcrc.javascript.JavascriptRunnerListener;

public class JavascriptRunnerListenerDefault implements JavascriptRunnerListener {

	@Override
	public void unexpectedError(Exception e) {
	}

	@Override
	public void compileError(String details, String sourceName, int lineNumber, int columnNumber) {
	}

	@Override
	public void runtimeError(String details, String sourceName, int lineNumber) {
	}

}
