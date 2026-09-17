import SmartMomentLib "../lib/smart-moment";
import SmartMomentTypes "../types/smart-moment";

mixin () {
  // Read-only proactive recommendation for the demo student's current
  // situation. Deterministic: the demo clock and demo day are fixed, so the
  // same values are returned on every call.
  public query func getSmartMoment() : async ?SmartMomentTypes.SmartMoment {
    SmartMomentLib.getSmartMoment();
  };
};
