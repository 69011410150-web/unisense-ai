import Common "common";

module {
  // A planned route between two campus locations.
  public type RoutePlan = {
    originName : Text; // Thai origin name
    destinationName : Text; // Thai destination name
    walkingMinutes : Common.Minutes;
    evMinutes : Common.Minutes;
    finalWalkingMinutes : Common.Minutes;
    totalMinutes : Common.Minutes;
    estimatedArrival : Common.ClockTime; // "HH:MM"
    arriveBeforeClass : Bool;
    walkingSteps : [Text]; // Thai step-by-step walking instructions
    evSteps : [Text]; // Thai step-by-step EV instructions
  };

  // The next class relative to the current demo time.
  public type NextClass = {
    subject : Text; // Thai subject name
    startTime : Common.ClockTime;
    endTime : Common.ClockTime;
    buildingName : Text;
    roomCode : Text;
    minutesUntil : Common.Minutes;
    locationName : Text; // Thai navigation destination name
  };

  // A Thai answer composed from the demo campus dataset.
  public type AssistantAnswer = {
    intent : Text; // recognised intent key
    answer : Text; // Thai answer text
    route : ?RoutePlan; // present when the answer carries a route
  };
};
