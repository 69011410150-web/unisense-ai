import NavLib "../lib/navigation";
import NavTypes "../types/navigation";

mixin () {
  public query func planRoute(originName : Text, destinationName : Text) : async NavTypes.RoutePlan {
    NavLib.planRoute(originName, destinationName);
  };

  public query func askCampus(question : Text) : async NavTypes.AssistantAnswer {
    NavLib.answer(question);
  };
};
