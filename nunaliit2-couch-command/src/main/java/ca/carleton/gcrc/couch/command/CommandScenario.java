package ca.carleton.gcrc.couch.command;

/**
 * This class is being used to set/get the nunaliit command being executed globally.
 * Commands scenario can be one of: update, run or config.
 * 
 * This class is used in the following files:
 * - Main.java
 * - AtlasProperties.java
 */
public class CommandScenario {

    private static CommandScenario instance;

    public static final String CONFIG_COMMAND = "config";
    public static final String UPDATE_COMMAND = "update";
    public static final String RUN_COMMAND = "run";

    private String command = "";

    public static CommandScenario getInstance() {
        if (instance == null) {
            instance = new CommandScenario();
        }

        return instance;
    }

    public String getCommand() {
        return this.command;
    }

    public void setCommand(String command) {
        this.command = command;
    }
}
