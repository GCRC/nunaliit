package ca.carleton.gcrc.couch.command;

public class Commands {

    private static Commands instance;

    public static final String CONFIG_COMMAND = "config";
    public static final String UPDATE_COMMAND = "update";
    public static final String RUN_COMMAND = "run";

    private String command = "";

    public static Commands getInstance() {
        if (instance == null) {
            instance = new Commands();
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
