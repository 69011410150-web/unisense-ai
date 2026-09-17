import Types "../types/smart-moment";
import NavTypes "../types/navigation";
import ScheduleLib "./schedule";
import NavLib "./navigation";
import CampusLib "./campus";

module {
  // ---- Smart Moment proactive recommendation (DEMO DATA ONLY) -------------
  //
  // The recommendation is derived entirely from the existing demo data:
  // the fixed demo clock (08:30), the fixed demo day ("จันทร์"),
  // `ScheduleLib.getNextClass()` and `NavLib.planRoute()`. It never reads the
  // real canister clock, a real device clock, or a real GPS position, so the
  // same values are returned on every call.

  // Short Thai explanation shown under the recommendation.
  let explanationText : Text = "AI วิเคราะห์จากตารางเรียน เวลา และเส้นทาง";

  // Situation A: enough time to leave now.
  let messageA : Text = "คุณยังมีเวลา 20 นาที แนะนำให้ออกเดินทางตอนนี้";

  // Situation B: limited time, take the fastest route.
  let messageB : Text = "⚠️ เวลาค่อนข้างกระชั้น ฉันแนะนำเส้นทางที่เร็วที่สุด";

  // Situation C: even the fastest route does not arrive before class.
  let messageC : Text = "⚠️ เส้นทางปกติอาจไปไม่ทัน ฉันเลือกเส้นทางที่เร็วที่สุดให้แล้ว";

  // Situation A applies when the remaining time is comfortably greater than
  // the total travel time. The demo 08:30 case (30 minutes remaining, 10
  // minutes of travel) is A.
  let comfortableBufferMinutes : Nat = 5;

  // The proactive recommendation for the demo student's current situation.
  // Returns `null` only when the demo day has no class left to attend.
  public func getSmartMoment() : ?Types.SmartMoment {
    switch (ScheduleLib.getNextClass()) {
      case null { null };
      case (?nextClass) {
        // The recommended route runs from the demo current location to the
        // next-class room, matching what the map page plans on hand-off.
        let route = NavLib.planRoute(CampusLib.getCurrentLocation().name, nextClass.roomCode);
        let remaining = nextClass.minutesUntil;
        let total = route.totalMinutes;

        // Situation level from the remaining time versus the recommended
        // route's total travel time.
        let situation : Types.SituationLevel = if (remaining > total + comfortableBufferMinutes) {
          #A;
        } else if (route.arriveBeforeClass) {
          #B;
        } else {
          #C;
        };

        let situationMessage = switch (situation) {
          case (#A) { messageA };
          case (#B) { messageB };
          case (#C) { messageC };
        };

        ?{
          subject = nextClass.subject;
          startTime = nextClass.startTime;
          buildingName = nextClass.buildingName;
          roomCode = nextClass.roomCode;
          minutesRemaining = remaining;
          walkingMinutes = route.walkingMinutes;
          evMinutes = route.evMinutes;
          finalWalkingMinutes = route.finalWalkingMinutes;
          totalMinutes = total;
          estimatedArrival = route.estimatedArrival;
          arriveBeforeClass = route.arriveBeforeClass;
          situation;
          situationMessage;
          explanation = explanationText;
          originName = route.originName;
          destinationName = route.destinationName;
        };
      };
    };
  };
};
