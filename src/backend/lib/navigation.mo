import Types "../types/navigation";
import CampusTypes "../types/campus";
import CampusLib "./campus";
import ScheduleLib "./schedule";

module {
  // ---- Route planning -----------------------------------------------------

  // Demo EV shuttle ride time between two campus locations.
  func evRideMinutes(originId : Nat, destinationId : Nat) : Nat {
    if (originId == destinationId) { 0 } else { 5 };
  };

  // Demo walking minutes for the recommended route from the demo current
  // location (โรงอาหารกลาง) to the demo next-class room (SC-204): walk to the
  // EV stop, ride EV สาย 2, then walk the last stretch.
  let demoRouteWalkMinutes : Nat = 3;
  let demoRouteFinalWalkMinutes : Nat = 2;

  // Walking minutes between two campus locations, using the demo segments.
  func walkingMinutes(originId : Nat, destinationId : Nat) : Nat {
    if (originId == destinationId) { 0 } else {
      switch (CampusLib.findSegment(originId, destinationId)) {
        case (?segment) { segment.walkingMinutes };
        case null { demoRouteWalkMinutes };
      };
    };
  };

  // Resolves a user-supplied place name to a demo campus location, falling
  // back to the demo current location instead of trapping.
  func resolveLocation(name : Text) : CampusTypes.CampusLocation {
    switch (CampusLib.findLocation(name)) {
      case (?location) { location };
      case null {
        switch (CampusLib.findRoom(name)) {
          case (?room) {
            switch (CampusLib.findLocation(room.buildingName)) {
              case (?location) { location };
              case null { CampusLib.getCurrentLocation() };
            };
          };
          case null {
            switch (CampusLib.findBuilding(name)) {
              case (?building) {
                switch (CampusLib.findLocation(building.name)) {
                  case (?location) { location };
                  case null { CampusLib.getCurrentLocation() };
                };
              };
              case null {
                // Student shorthand such as "ตึกวิทยาศาสตร์" is not an exact
                // dataset name, so fall back to a keyword match.
                switch (CampusLib.findBuildingByKeyword(name)) {
                  case (?building) {
                    switch (CampusLib.findLocation(building.name)) {
                      case (?location) { location };
                      case null { CampusLib.getCurrentLocation() };
                    };
                  };
                  case null { CampusLib.getCurrentLocation() };
                };
              };
            };
          };
        };
      };
    };
  };

  // The room code a question names, so a route can end at the room itself
  // (e.g. SC-204) instead of only the building.
  func roomCodeIn(name : Text) : ?Text {
    switch (CampusLib.findRoom(name)) {
      case (?room) { ?room.code };
      case null {
        switch (extractRoomCode(name)) {
          case (?code) { ?code };
          case null { null };
        };
      };
    };
  };

  // The destination label a route should report: the room code when the
  // question names one, otherwise the primary demo room of the resolved
  // building, so a building destination still pre-fills Smart Navigation with
  // a room code. Falls back to the location name when no room is known.
  func destinationLabel(name : Text, location : CampusTypes.CampusLocation) : Text {
    switch (roomCodeIn(name)) {
      case (?code) { code };
      case null {
        switch (CampusLib.findRoomByBuilding(location.name)) {
          case (?room) { room.code };
          case null { location.name };
        };
      };
    };
  };

  // Thai walking instructions for a route.
  func walkingSteps(origin : CampusTypes.CampusLocation, destination : CampusTypes.CampusLocation) : [Text] {
    if (origin.id == destination.id) {
      return ["คุณอยู่ที่ " # destination.name # " แล้ว"];
    };
    let first = switch (CampusLib.findSegment(origin.id, destination.id)) {
      case (?segment) { segment.instruction };
      case null { "เดินจาก " # origin.name # " ไปยัง " # destination.name };
    };
    let room = CampusLib.findRoomByBuilding(destination.name);
    let arrival = switch (room) {
      case (?r) { "ถึง " # destination.name # " แล้วขึ้นไปห้อง " # r.code # " ชั้น " # r.floor.toText() };
      case null { "ถึง " # destination.name # " แล้ว" };
    };
    [first, arrival];
  };

  // Thai EV instructions for a route.
  func evSteps(origin : CampusTypes.CampusLocation, destination : CampusTypes.CampusLocation) : [Text] {
    if (origin.id == destination.id) {
      return ["คุณอยู่ที่ " # destination.name # " แล้ว"];
    };
    let board = switch (CampusLib.findEvLineFor(origin.name)) {
      case (?line) { "ขึ้น " # line.name # " ที่ " # origin.name # " (รถมาถึงใน " # line.arrivalMinutes.toText() # " นาที)" };
      case null { "ขึ้นรถ EV ที่ " # origin.name };
    };
    let alight = switch (CampusLib.findEvLineFor(destination.name)) {
      case (?line) { "ลงที่ " # line.nextStation # " แล้วเดินต่อเข้า " # destination.name };
      case null { "ลงที่ " # destination.name };
    };
    [board, alight];
  };

  public func planRoute(originName : Text, destinationName : Text) : Types.RoutePlan {
    let origin = resolveLocation(originName);
    let destination = resolveLocation(destinationName);
    let walk = walkingMinutes(origin.id, destination.id);
    let ev = evRideMinutes(origin.id, destination.id);
    let finalWalk = if (origin.id == destination.id) { 0 } else { demoRouteFinalWalkMinutes };
    let total = walk + ev + finalWalk;
    let arrival = ScheduleLib.clockFromNow(total);
    let nextClass = ScheduleLib.getNextClass();
    let beforeClass = switch (nextClass) {
      case (?c) { total <= c.minutesUntil };
      case null { true };
    };
    {
      originName = origin.name;
      destinationName = destinationLabel(destinationName, destination);
      walkingMinutes = walk;
      evMinutes = ev;
      finalWalkingMinutes = finalWalk;
      totalMinutes = total;
      estimatedArrival = arrival;
      arriveBeforeClass = beforeClass;
      walkingSteps = walkingSteps(origin, destination);
      evSteps = evSteps(origin, destination);
    };
  };

  // ---- Rule-based Thai campus assistant -----------------------------------

  // Extracts a room code such as "SC-204" from a free-text question.
  func extractRoomCode(question : Text) : ?Text {
    let tokens = question.split(#predicate(func ch = ch == ' ' or ch == '?' or ch == '?' or ch == ',' or ch == '.')).toArray();
    tokens.find(func token {
      let upper = token.toUpper();
      let parts = upper.split(#char '-').toArray();
      parts.size() == 2 and parts[0].size() >= 2 and parts[1].size() >= 3
    });
  };

  // Extracts a "จาก X ไป Y" origin/destination pair from a question.
  func extractFromTo(question : Text) : ?(Text, Text) {
    let fromParts = question.split(#text "จาก").toArray();
    if (fromParts.size() < 2) { return null };
    let rest = fromParts[1];
    let toParts = rest.split(#text "ไป").toArray();
    if (toParts.size() < 2) { return null };
    let origin = toParts[0].trim(#predicate(func ch = ch == ' '));
    let destination = toParts[1].trim(#predicate(func ch = ch == ' ' or ch == '?' or ch == '?' or ch == '.'));
    if (origin.size() == 0 or destination.size() == 0) { return null };
    ?(origin, destination);
  };

  // Extracts a place name mentioned in the question, if any.
  func extractPlace(question : Text) : ?Text {
    let needle = question.toLower();
    let match = CampusLib.listLocations().find(func l = needle.contains(#text (l.name.toLower())));
    switch (match) {
      case (?location) { ?location.name };
      case null {
        let building = CampusLib.listBuildings().find(func b = needle.contains(#text (b.name.toLower())));
        switch (building) {
          case (?b) { ?b.name };
          case null {
            // Student shorthand such as "ตึกวิทยาศาสตร์" or "ตึกวิทย์".
            switch (CampusLib.findBuildingByKeyword(needle)) {
              case (?b) { ?b.name };
              case null { null };
            };
          };
        };
      };
    };
  };

  func nextClassAnswer() : Types.AssistantAnswer {
    switch (ScheduleLib.getNextClass()) {
      case null {
        { intent = "next_class"; answer = "วันนี้คุณเรียนครบทุกคาบแล้ว พักผ่อนให้เต็มที่นะ ?"; route = null };
      };
      case (?c) {
        // The recommended route runs from the demo current location to the
        // next-class room, so the answer carries the same plan the map shows.
        let route = planRoute(CampusLib.getCurrentLocation().name, c.roomCode);
        let answer = "อีก " # c.minutesUntil.toText() # " นาทีคุณมีเรียน " # c.subject # "\n"
          # "📍 " # c.buildingName # " ห้อง " # c.roomCode # "\n"
          # "⏰ เริ่มเรียน " # c.startTime # " น.";
        { intent = "next_class"; answer; route = ?route };
      };
    };
  };

  func roomAnswer(roomCode : Text) : Types.AssistantAnswer {
    switch (CampusLib.findRoom(roomCode)) {
      case null {
        {
          intent = "room_location";
          answer = "ยังไม่พบห้อง " # roomCode # " ในข้อมูลตัวอย่าง ลองถามเป็นชื่ออาคาร เช่น อาคารวิทยาศาสตร์ 2 ได้เลย";
          route = null;
        };
      };
      case (?room) {
        let route = planRoute(CampusLib.getCurrentLocation().name, room.code);
        let answer = "ห้อง " # room.code # " อยู่ที่ " # room.buildingName # " ชั้น " # room.floor.toText()
          # " (" # room.description # ") จาก " # route.originName
          # " เดินประมาณ " # route.walkingMinutes.toText() # " นาที ถึงประมาณ " # route.estimatedArrival;
        { intent = "room_location"; answer; route = ?route };
      };
    };
  };

  func routeAnswer(originName : Text, destinationName : Text) : Types.AssistantAnswer {
    let route = planRoute(originName, destinationName);
    let answer = "เส้นทางจาก " # route.originName # " ไป " # route.destinationName
      # " เดิน " # route.walkingMinutes.toText() # " นาที หรือนั่งรถ EV "
      # route.evMinutes.toText() # " นาที แล้วเดินต่อ " # route.finalWalkingMinutes.toText()
      # " นาที รวมประมาณ " # route.totalMinutes.toText() # " นาที ถึงประมาณ " # route.estimatedArrival;
    { intent = "route"; answer; route = ?route };
  };

  func arrivalAnswer() : Types.AssistantAnswer {
    let nextClass = ScheduleLib.getNextClass();
    switch (nextClass) {
      case null {
        { intent = "arrive_before_class"; answer = "วันนี้ไม่มีคาบเรียนเหลือแล้ว จึงไม่มีกำหนดเวลาที่ต้องไปให้ทัน"; route = null };
      };
      case (?c) {
        let route = planRoute(CampusLib.getCurrentLocation().name, c.buildingName);
        let answer = if (route.arriveBeforeClass) {
          "ทันแน่นอน ใช้เวลาประมาณ " # route.totalMinutes.toText() # " นาที ถึงประมาณ "
            # route.estimatedArrival # " ก่อนคาบ " # c.subject # " เริ่มเวลา " # c.startTime
            # " อีก " # c.minutesUntil.toText() # " นาที";
        } else {
          "อาจไม่ทัน คาบ " # c.subject # " เริ่มเวลา " # c.startTime # " แต่เส้นทางใช้เวลาประมาณ "
            # route.totalMinutes.toText() # " นาที แนะนำให้ออกเดินทางทันที";
        };
        { intent = "arrive_before_class"; answer; route = ?route };
      };
    };
  };

  func evAnswer() : Types.AssistantAnswer {
    let lines = CampusLib.listEvLines();
    let summary = lines.map(func l = l.name # " สถานีถัดไป " # l.nextStation
      # " ถึงใน " # l.arrivalMinutes.toText() # " นาที (ความหนาแน่น " # l.crowdLevel # ")");
    let answer = "รถ EV ในมหาวิทยาลัยตอนนี้: " # summary.values().join(" | ");
    { intent = "ev_shuttle"; answer; route = null };
  };

  func fallbackAnswer() : Types.AssistantAnswer {
    {
      intent = "fallback";
      answer = "ขออภัย ยังไม่เข้าใจคำถามนี้ ลองถามได้ เช่น \"อีก 30 นาทีฉันมีเรียนที่ไหน?\" "
        # "\"ห้อง SC-204 อยู่ตรงไหน?\" \"จากโรงอาหารกลางไปอาคารวิทยาศาสตร์ 2 ยังไง?\" "
        # "\"ฉันจะไปเรียนทันไหม?\" หรือ \"รถ EV คันต่อไปอยู่ไหน?\"";
      route = null;
    };
  };

  public func answer(question : Text) : Types.AssistantAnswer {
    let q = question.toLower();
    if (q.size() == 0) { return fallbackAnswer() };

    // Where is the next class / which class is next.
    if (q.contains(#text "เรียนที่ไหน") or q.contains(#text "คาบต่อไป") or q.contains(#text "เรียนอะไรต่อ")
      or q.contains(#text "วิชาอะไรต่อ") or q.contains(#text "ตารางเรียน")) {
      return nextClassAnswer();
    };

    // Will I arrive before class.
    if (q.contains(#text "ทันไหม") or q.contains(#text "จะทัน") or q.contains(#text "ทันหรือไม่")) {
      return arrivalAnswer();
    };

    // Next EV shuttle.
    if (q.contains(#text "รถ ev") or q.contains(#text "อีวี") or q.contains(#text "รถราง")
      or q.contains(#text "รถบัส") or q.contains(#text "รถไฟฟ้า")) {
      return evAnswer();
    };

    // Route between two named places.
    switch (extractFromTo(question)) {
      case (?(origin, destination)) {
        // A named room wins over the building, so the route ends at the room
        // code the student asked about.
        switch (CampusLib.findRoom(destination)) {
          case (?room) { return roomAnswer(room.code) };
          case null {};
        };
        return routeAnswer(origin, destination);
      };
      case null {};
    };

    // A specific room.
    switch (extractRoomCode(question)) {
      case (?code) { return roomAnswer(code) };
      case null {};
    };

    // A named place without an explicit origin.
    switch (extractPlace(question)) {
      case (?place) { return routeAnswer(CampusLib.getCurrentLocation().name, place) };
      case null {};
    };

    fallbackAnswer();
  };
};
