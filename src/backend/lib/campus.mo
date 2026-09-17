import Types "../types/campus";

module {
  // ---- Demo campus dataset (DEMO DATA ONLY) -------------------------------

  let buildings : [Types.Building] = [
    { id = 1; code = "SC"; name = "อาคารวิทยาศาสตร์ 2"; description = "อาคารเรียนและปฏิบัติการวิทยาศาสตร์ 2"; floors = 5 },
    { id = 2; code = "EN"; name = "อาคารเรียนรวม"; description = "อาคารเรียนรวมและห้องบรรยายขนาดใหญ่"; floors = 6 },
    { id = 3; code = "PH"; name = "อาคารสาธารณสุข"; description = "อาคารเรียนและวิจัยด้านสาธารณสุข"; floors = 4 },
    { id = 4; code = "LB"; name = "อาคารหอสมุดกลาง"; description = "หอสมุดกลางและพื้นที่อ่านหนังสือ"; floors = 4 },
    { id = 5; code = "AD"; name = "อาคารสำนักงานมหาวิทยาลัย"; description = "อาคารบริหารและบริการนักศึกษา"; floors = 3 },
    { id = 6; code = "SP"; name = "อาคารกีฬาและนันทนาการ"; description = "โรงยิมและสนามกีฬาในร่ม"; floors = 2 },
  ];

  let rooms : [Types.Room] = [
    { id = 1; code = "SC-204"; buildingId = 1; buildingName = "อาคารวิทยาศาสตร์ 2"; floor = 2; description = "ห้องเรียนชีววิทยา ชั้น 2" },
    { id = 2; code = "SC-101"; buildingId = 1; buildingName = "อาคารวิทยาศาสตร์ 2"; floor = 1; description = "ห้องปฏิบัติการเคมี ชั้น 1" },
    { id = 3; code = "SC-305"; buildingId = 1; buildingName = "อาคารวิทยาศาสตร์ 2"; floor = 3; description = "ห้องปฏิบัติการฟิสิกส์ ชั้น 3" },
    { id = 4; code = "EN-302"; buildingId = 2; buildingName = "อาคารเรียนรวม"; floor = 3; description = "ห้องเรียนภาษาอังกฤษ ชั้น 3" },
    { id = 5; code = "EN-201"; buildingId = 2; buildingName = "อาคารเรียนรวม"; floor = 2; description = "ห้องบรรยายรวม ชั้น 2" },
    { id = 6; code = "PH-401"; buildingId = 3; buildingName = "อาคารสาธารณสุข"; floor = 4; description = "ห้องเรียนสาธารณสุข ชั้น 4" },
    { id = 7; code = "PH-202"; buildingId = 3; buildingName = "อาคารสาธารณสุข"; floor = 2; description = "ห้องสัมมนาสาธารณสุข ชั้น 2" },
    { id = 8; code = "LB-110"; buildingId = 4; buildingName = "อาคารหอสมุดกลาง"; floor = 1; description = "ห้องอ่านหนังสือเงียบ ชั้น 1" },
    { id = 9; code = "AD-105"; buildingId = 5; buildingName = "อาคารสำนักงานมหาวิทยาลัย"; floor = 1; description = "เคาน์เตอร์บริการนักศึกษา ชั้น 1" },
    { id = 10; code = "SP-100"; buildingId = 6; buildingName = "อาคารกีฬาและนันทนาการ"; floor = 1; description = "โรงยิมหลัก ชั้น 1" },
  ];

  let locations : [Types.CampusLocation] = [
    { id = 1; name = "โรงอาหารกลาง"; kind = "โรงอาหาร"; description = "ศูนย์อาหารกลางของมหาวิทยาลัย" },
    { id = 2; name = "อาคารวิทยาศาสตร์ 2"; kind = "อาคาร"; description = "อาคารเรียนวิทยาศาสตร์ 2" },
    { id = 3; name = "อาคารเรียนรวม"; kind = "อาคาร"; description = "อาคารเรียนรวมและห้องบรรยาย" },
    { id = 4; name = "อาคารสาธารณสุข"; kind = "อาคาร"; description = "อาคารเรียนสาธารณสุข" },
    { id = 5; name = "อาคารหอสมุดกลาง"; kind = "อาคาร"; description = "หอสมุดกลาง" },
    { id = 6; name = "อาคารสำนักงานมหาวิทยาลัย"; kind = "อาคาร"; description = "อาคารบริหารและบริการนักศึกษา" },
    { id = 7; name = "อาคารกีฬาและนันทนาการ"; kind = "อาคาร"; description = "โรงยิมและสนามกีฬา" },
    { id = 8; name = "ป้ายรถ EV หน้าหอสมุด"; kind = "จุดจอด EV"; description = "จุดจอดรถ EV สาย 1" },
    { id = 9; name = "ป้ายรถ EV หน้าโรงอาหาร"; kind = "จุดจอด EV"; description = "จุดจอดรถ EV สาย 2" },
  ];

  let routeSegments : [Types.RouteSegment] = [
    { fromLocationId = 1; toLocationId = 2; distanceMetres = 220; walkingMinutes = 3; instruction = "เดินออกจากโรงอาหารกลางตรงไปทางทิศเหนือ 220 เมตร" },
    { fromLocationId = 2; toLocationId = 1; distanceMetres = 220; walkingMinutes = 3; instruction = "เดินออกจากอาคารวิทยาศาสตร์ 2 ตรงไปทางทิศใต้ 220 เมตร" },
    { fromLocationId = 1; toLocationId = 3; distanceMetres = 300; walkingMinutes = 4; instruction = "เดินออกจากโรงอาหารกลางเลี้ยวขวาไปตามทางเดินหลัก 300 เมตร" },
    { fromLocationId = 3; toLocationId = 1; distanceMetres = 300; walkingMinutes = 4; instruction = "เดินออกจากอาคารเรียนรวมตรงไปทางทิศตะวันตก 300 เมตร" },
    { fromLocationId = 1; toLocationId = 4; distanceMetres = 380; walkingMinutes = 5; instruction = "เดินออกจากโรงอาหารกลางตรงไปทางทิศตะวันออก 380 เมตร" },
    { fromLocationId = 4; toLocationId = 1; distanceMetres = 380; walkingMinutes = 5; instruction = "เดินออกจากอาคารสาธารณสุขตรงไปทางทิศตะวันตก 380 เมตร" },
    { fromLocationId = 1; toLocationId = 5; distanceMetres = 260; walkingMinutes = 4; instruction = "เดินออกจากโรงอาหารกลางเลี้ยวซ้ายไปทางหอสมุดกลาง 260 เมตร" },
    { fromLocationId = 5; toLocationId = 1; distanceMetres = 260; walkingMinutes = 4; instruction = "เดินออกจากหอสมุดกลางตรงไปทางทิศใต้ 260 เมตร" },
    { fromLocationId = 2; toLocationId = 3; distanceMetres = 180; walkingMinutes = 3; instruction = "เดินออกจากอาคารวิทยาศาสตร์ 2 ตรงไปทางทิศตะวันออก 180 เมตร" },
    { fromLocationId = 3; toLocationId = 2; distanceMetres = 180; walkingMinutes = 3; instruction = "เดินออกจากอาคารเรียนรวมตรงไปทางทิศตะวันตก 180 เมตร" },
    { fromLocationId = 2; toLocationId = 5; distanceMetres = 240; walkingMinutes = 4; instruction = "เดินออกจากอาคารวิทยาศาสตร์ 2 เลี้ยวขวาไปทางหอสมุดกลาง 240 เมตร" },
    { fromLocationId = 5; toLocationId = 2; distanceMetres = 240; walkingMinutes = 4; instruction = "เดินออกจากหอสมุดกลางเลี้ยวซ้ายไปทางอาคารวิทยาศาสตร์ 2 240 เมตร" },
    { fromLocationId = 3; toLocationId = 4; distanceMetres = 200; walkingMinutes = 3; instruction = "เดินออกจากอาคารเรียนรวมตรงไปทางทิศตะวันออก 200 เมตร" },
    { fromLocationId = 4; toLocationId = 3; distanceMetres = 200; walkingMinutes = 3; instruction = "เดินออกจากอาคารสาธารณสุขตรงไปทางทิศตะวันตก 200 เมตร" },
    { fromLocationId = 5; toLocationId = 6; distanceMetres = 150; walkingMinutes = 2; instruction = "เดินออกจากหอสมุดกลางตรงไปทางทิศเหนือ 150 เมตร" },
    { fromLocationId = 6; toLocationId = 5; distanceMetres = 150; walkingMinutes = 2; instruction = "เดินออกจากอาคารสำนักงานมหาวิทยาลัยตรงไปทางทิศใต้ 150 เมตร" },
    { fromLocationId = 6; toLocationId = 7; distanceMetres = 320; walkingMinutes = 5; instruction = "เดินออกจากอาคารสำนักงานมหาวิทยาลัยตรงไปทางทิศตะวันออก 320 เมตร" },
    { fromLocationId = 7; toLocationId = 6; distanceMetres = 320; walkingMinutes = 5; instruction = "เดินออกจากอาคารกีฬาและนันทนาการตรงไปทางทิศตะวันตก 320 เมตร" },
    { fromLocationId = 1; toLocationId = 9; distanceMetres = 60; walkingMinutes = 1; instruction = "เดินออกจากโรงอาหารกลางไปยังป้ายรถ EV หน้าโรงอาหาร 60 เมตร" },
    { fromLocationId = 9; toLocationId = 1; distanceMetres = 60; walkingMinutes = 1; instruction = "เดินจากป้ายรถ EV หน้าโรงอาหารเข้าโรงอาหารกลาง 60 เมตร" },
    { fromLocationId = 5; toLocationId = 8; distanceMetres = 70; walkingMinutes = 1; instruction = "เดินออกจากหอสมุดกลางไปยังป้ายรถ EV หน้าหอสมุด 70 เมตร" },
    { fromLocationId = 8; toLocationId = 5; distanceMetres = 70; walkingMinutes = 1; instruction = "เดินจากป้ายรถ EV หน้าหอสมุดเข้าหอสมุดกลาง 70 เมตร" },
  ];

  let evLines : [Types.EvLine] = [
    {
      id = 1;
      name = "EV สาย 1";
      stops = ["ป้ายรถ EV หน้าหอสมุด", "อาคารเรียนรวม", "อาคารวิทยาศาสตร์ 2", "อาคารสาธารณสุข"];
      nextStation = "อาคารเรียนรวม";
      arrivalMinutes = 4;
      crowdLevel = "ปานกลาง";
    },
    {
      id = 2;
      name = "EV สาย 2";
      stops = ["ป้ายรถ EV หน้าโรงอาหาร", "โรงอาหารกลาง", "อาคารสำนักงานมหาวิทยาลัย", "อาคารกีฬาและนันทนาการ"];
      nextStation = "โรงอาหารกลาง";
      arrivalMinutes = 7;
      crowdLevel = "น้อย";
    },
  ];

  // The single simulated scan detection for the demo. Every scan returns the
  // same place so the "🧭 พาฉันไป" hand-off always routes to SC-204.
  let scanResult : Types.ScanResult = {
    buildingName = "อาคารวิทยาศาสตร์ 2";
    roomCode = "SC-204";
    floor = 2;
    instruction = "เดินตรง 50 เมตร แล้วเลี้ยวขวา";
  };

  // ---- Reads --------------------------------------------------------------

  public func listBuildings() : [Types.Building] { buildings };

  public func listRooms() : [Types.Room] { rooms };

  public func listLocations() : [Types.CampusLocation] { locations };

  public func listRouteSegments() : [Types.RouteSegment] { routeSegments };

  public func listEvLines() : [Types.EvLine] { evLines };

  public func getCurrentLocation() : Types.CampusLocation {
    locations[0]
  };

  // ---- Lookups ------------------------------------------------------------

  public func findLocation(name : Text) : ?Types.CampusLocation {
    let needle = name.toLower();
    locations.find(func l = l.name.toLower().contains(#text (needle)) or needle.contains(#text (l.name.toLower())))
  };

  public func findBuilding(name : Text) : ?Types.Building {
    let needle = name.toLower();
    buildings.find(func b = b.name.toLower().contains(#text (needle)) or needle.contains(#text (b.name.toLower())))
  };

  public func findRoom(code : Text) : ?Types.Room {
    let needle = code.toLower();
    rooms.find(func r = r.code.toLower() == needle)
  };

  // Student shorthand for a building, e.g. "ตึกวิทยาศาสตร์" or "ตึกวิทย์".
  // The demo dataset names buildings "อาคาร...", so a keyword match is needed
  // on top of the exact-name lookup.
  let buildingKeywords : [(Text, Text)] = [
    ("วิทยา", "อาคารวิทยาศาสตร์ 2"),
    ("วิทย์", "อาคารวิทยาศาสตร์ 2"),
    ("วิทยาศาสตร", "อาคารวิทยาศาสตร์ 2"),
    ("เรียนรวม", "อาคารเรียนรวม"),
    ("บรรยาย", "อาคารเรียนรวม"),
    ("สาธารณสุข", "อาคารสาธารณสุข"),
    ("อนามัย", "อาคารสาธารณสุข"),
    ("หอสมุด", "อาคารหอสมุดกลาง"),
    ("สมุด", "อาคารหอสมุดกลาง"),
    ("สำนักงาน", "อาคารสำนักงานมหาวิทยาลัย"),
    ("บริหาร", "อาคารสำนักงานมหาวิทยาลัย"),
    ("กีฬา", "อาคารกีฬาและนันทนาการ"),
    ("นันทนาการ", "อาคารกีฬาและนันทนาการ"),
    ("ยิม", "อาคารกีฬาและนันทนาการ"),
    ("โรงอาหาร", "โรงอาหารกลาง"),
    ("อาหาร", "โรงอาหารกลาง"),
    ("ป้ายรถ ev", "ป้ายรถ EV หน้าหอสมุด"),
    ("ป้าย ev", "ป้ายรถ EV หน้าหอสมุด"),
  ];

  // Resolves a building name from student shorthand, or null when nothing matches.
  public func findBuildingByKeyword(name : Text) : ?Types.Building {
    let needle = name.toLower();
    let matched = buildingKeywords.find(func pair = needle.contains(#text (pair.0)));
    switch (matched) {
      case null { null };
      case (?pair) { findBuilding(pair.1) };
    };
  };

  public func findRoomByBuilding(buildingName : Text) : ?Types.Room {
    let needle = buildingName.toLower();
    rooms.find(func r = r.buildingName.toLower().contains(#text (needle)))
  };

  public func findSegment(fromId : Nat, toId : Nat) : ?Types.RouteSegment {
    routeSegments.find(func s = s.fromLocationId == fromId and s.toLocationId == toId)
  };

  public func findEvLineFor(stationName : Text) : ?Types.EvLine {
    let needle = stationName.toLower();
    evLines.find(func l = l.stops.any(func s = s.toLower().contains(#text (needle))))
  };

  // ---- Scan ---------------------------------------------------------------

  // Returns the fixed demo detection (อาคารวิทยาศาสตร์ 2 / SC-204).
  public func scan() : Types.ScanResult {
    scanResult;
  };
};
