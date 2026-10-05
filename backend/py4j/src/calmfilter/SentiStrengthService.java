package calmfilter;

import java.util.ArrayList;
import java.util.List;
import py4j.GatewayServer;
import uk.ac.wlv.sentistrength.SentiStrength;

public class SentiStrengthService {

  SentiStrength sentiStrength = new SentiStrength();

  public SentiStrengthService() {
    // Point at the folder containing SentiStrength data
    String ssthInitialisation[] = {
  "sentidata",                       // tells SentiStrength “the next value is my data folder”
  "en/"//,  // the path to the sentiment‑data directory
  //"explain"                          // an option flag: ask SentiStrength to include human‑readable explanations
};
    sentiStrength.initialise(ssthInitialisation);
  }

  /** Single‐text sentiment: returns e.g. "3 -1" (pos neg) */
  public String getScore(String text) {
    return sentiStrength.computeSentimentScores(text);
  }

  /** Batch processing */
  public List<String> getScores(List<String> textList) {
    List<String> result = new ArrayList<>();
    for (String t : textList) {
      result.add(getScore(t));
    }
    return result;
  }

  public static void main(String[] args) {
    try {
      // Start the Py4J gateway on default port (25333)
      GatewayServer gatewayServer = new GatewayServer(new SentiStrengthService());
      gatewayServer.start();
      System.out.println("SentiStrength Service Started");
    } catch (Exception e) {
      System.out.println("Service already running... Quitting...");
      System.exit(1);
    }
  }
}

