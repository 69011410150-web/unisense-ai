import Common "common";

module {
  // The situation level of a proactive Smart Moment recommendation.
  // A = enough time, B = limited time, C = too late for the normal route.
  public type SituationLevel = {
    #A; // มีเวลาเพียงพอ
    #B; // เวลากระชั้น
    #C; // เส้นทางปกติอาจไปไม่ทัน
  };

  // A proactive recommendation computed from the demo schedule and the
  // recommended demo route. Every value is derived from the fixed demo clock
  // (08:30) and the fixed demo day ("จันทร์"); nothing reads the real clock or
  // a real device location.
  public type SmartMoment = {
    // Next class of the demo day.
    subject : Text; // Thai subject name, e.g. "ชีววิทยา"
    startTime : Common.ClockTime; // "HH:MM"
    buildingName : Text; // Thai building name
    roomCode : Text; // e.g. "SC-204"

    // Timing analysis.
    minutesRemaining : Common.Minutes; // minutes until the class starts
    walkingMinutes : Common.Minutes; // first walking leg
    evMinutes : Common.Minutes; // EV shuttle ride
    finalWalkingMinutes : Common.Minutes; // final walking leg
    totalMinutes : Common.Minutes; // total travel time
    estimatedArrival : Common.ClockTime; // "HH:MM"
    arriveBeforeClass : Bool;

    // Situation and Thai copy.
    situation : SituationLevel;
    situationMessage : Text; // Thai message for the situation level
    explanation : Text; // short Thai explanation of the analysis

    // Route hand-off to the existing map page.
    originName : Text; // Thai recommended origin
    destinationName : Text; // Thai recommended destination (room code)
  };
};
