package ca.carleton.gcrc.endpoint;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.HostAccess;
import org.graalvm.polyglot.PolyglotException;
import org.graalvm.polyglot.Value;
import org.json.JSONObject;

import junit.framework.TestCase;

public class Test extends TestCase {
    private final static String CONTEXT_LANG = "js";
    private final static String JS_PREFIX = "let docs = Java.from(source);";
    private final static String JS_POSTFIX = "docs;";

    public void testBasicGraalJSFunctionality() {
        Context context = Context.newBuilder(CONTEXT_LANG)
                .allowHostAccess(HostAccess.ALL)
                .allowHostClassLookup(s -> true)
                .build();

        List<Map<String, Object>> input = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            JSONObject obj = new JSONObject();
            input.add(obj.toMap());
        }

        context.getBindings(CONTEXT_LANG).putMember("source", input);

        Value result = null;
        try {
            result = context.eval(
                    CONTEXT_LANG,
                    JS_PREFIX +
                            "for (let i = 0; i < docs.length; i++) { docs[i]._id = i; docs[i].description = 'This is iteration #' + i; docs[i].js = true; }"
                            + JS_POSTFIX);
        } catch (PolyglotException pge) {
            throw pge;
        }

        List<Map<String, Object>> output = result.as(List.class);
        JSONObject[] convertedArray = output.stream()
                .map((JSONObject::new))
                .toArray(JSONObject[]::new);
        for (int j = 0; j < convertedArray.length; j++) {
            assertEquals(convertedArray[j].get("_id"), j);
            assertEquals(convertedArray[j].get("js"), true);
        }
    }
}
