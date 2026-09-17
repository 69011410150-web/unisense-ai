import Types "../types/schedule";
import NavTypes "../types/navigation";
import CampusLib "./campus";

module {
  // ---- Demo weekly schedule (DEMO DATA ONLY) ------------------------------

  let schedule : [Types.ClassEntry] = [
    { id = 1; subject = "ชีววิทยา"; day = "จันทร์"; startTime = "09:00"; endTime = "11:00"; buildingName = "อาคารวิทยาศาสตร์ 2"; roomCode = "SC-204"; instructor = "อ.ดร.ปรีชา วงศ์วิทย์" },
    { id = 2; subject = "ภาษาอังกฤษ"; day = "จันทร์"; startTime = "13:00"; endTime = "15:00"; buildingName = "อาคารเรียนรวม"; roomCode = "EN-302"; instructor = "อ.สุนิสา ใจดี" },
    { id = 3; subject = "สาธารณสุข"; day = "จันทร์"; startTime = "15:00"; endTime = "17:00"; buildingName = "อาคารสาธารณสุข"; roomCode = "PH-401"; instructor = "ผศ.ดร.กมล ทองสุข" },
    { id = 4; subject = "เคมีพื้นฐาน"; day = "อังคาร"; startTime = "09:00"; endTime = "11:00"; buildingName = "อาคารวิทยาศาสตร์ 2"; roomCode = "SC-101"; instructor = "อ.ดร.ณัฐพล ศรีสุข" },
    { id = 5; subject = "คณิตศาสตร์"; day = "อังคาร"; startTime = "13:00"; endTime = "15:00"; buildingName = "อาคารเรียนรวม"; roomCode = "EN-201"; instructor = "อ.วิภา รักเรียน" },
    { id = 6; subject = "ฟิสิกส์"; day = "พุธ"; startTime = "10:00"; endTime = "12:00"; buildingName = "อาคารวิทยาศาสตร์ 2"; roomCode = "SC-305"; instructor = "อ.ดร.สมชาย พูลผล" },
    { id = 7; subject = "สุขศึกษา"; day = "พุธ"; startTime = "14:00"; endTime = "16:00"; buildingName = "อาคารสาธารณสุข"; roomCode = "PH-202"; instructor = "อ.ปิยะดา แสงทอง" },
    { id = 8; subject = "ชีววิทยา"; day = "พฤหัสบดี"; startTime = "09:00"; endTime = "11:00"; buildingName = "อาคารวิทยาศาสตร์ 2"; roomCode = "SC-204"; instructor = "อ.ดร.ปรีชา วงศ์วิทย์" },
    { id = 9; subject = "ภาษาอังกฤษ"; day = "พฤหัสบดี"; startTime = "13:00"; endTime = "15:00"; buildingName = "อาคารเรียนรวม"; roomCode = "EN-302"; instructor = "อ.สุนิสา ใจดี" },
    { id = 10; subject = "สาธารณสุข"; day = "ศุกร์"; startTime = "15:00"; endTime = "17:00"; buildingName = "อาคารสาธารณสุข"; roomCode = "PH-401"; instructor = "ผศ.ดร.กมล ทองสุข" },
  ];

  // ---- Demo student profile (DEMO DATA ONLY) ------------------------------

  let profile : Types.StudentProfile = {
    displayName = "นางสาวพิมพ์ชนก ใจดี";
    studentId = "66010001";
    faculty = "คณะวิทยาศาสตร์และสาธารณสุขศาสตร์";
    year = 1;
    avatarPlaceholder = "พ";
  };

  // ---- Helpers ------------------------------------------------------------

  let dayNames : [Text] = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

  // Demo clock: the schedule is a weekly timetable, so the demo "today" is
  // always Monday. This keeps the next-class experience deterministic.
  func demoDayName() : Text { "จันทร์" };

  // Simulated demo clock (DEMO DATA ONLY). The demo always runs at 08:30 so
  // the next-class experience is identical at any real-world time; no demo
  // behaviour may read the real canister clock.
  let demoNowClock : Text = "08:30";

  // Minutes since midnight for a "HH:MM" demo clock time.
  func toMinutes(clock : Text) : Nat {
    let parts = clock.split(#char ':').toArray();
    let hours = parts[0].toNat() ?? 0;
    let minutes = parts[1].toNat() ?? 0;
    hours * 60 + minutes
  };

  // "HH:MM" for a minutes-since-midnight value, wrapped into a 24-hour day.
  func toClock(totalMinutes : Nat) : Text {
    let dayMinutes = totalMinutes % 1440;
    let hours = dayMinutes / 60;
    let minutes = dayMinutes % 60;
    let hh = if (hours < 10) { "0" # hours.toText() } else { hours.toText() };
    let mm = if (minutes < 10) { "0" # minutes.toText() } else { minutes.toText() };
    hh # ":" # mm
  };

  // Current demo time of day in minutes since midnight, read from the fixed
  // simulated clock rather than the real canister clock.
  func nowMinutes() : Nat { toMinutes(demoNowClock) };

  // ---- Reads --------------------------------------------------------------

  public func listSchedule() : [Types.ClassEntry] { schedule };

  public func getProfile() : Types.StudentProfile { profile };

  // The next class of the demo day, with minutes remaining until it starts.
  public func getNextClass() : ?NavTypes.NextClass {
    let today = demoDayName();
    let now = nowMinutes();
    let todays = schedule.filter(func c = c.day == today);
    let upcoming = todays.filter(func c = toMinutes(c.startTime) >= now);
    let chosen = upcoming.find(func _ = true);
    switch (chosen) {
      case null { null };
      case (?c) {
        let locationName = switch (CampusLib.findLocation(c.buildingName)) {
          case (?l) { l.name };
          case null { c.buildingName };
        };
        ?{
          subject = c.subject;
          startTime = c.startTime;
          endTime = c.endTime;
          buildingName = c.buildingName;
          roomCode = c.roomCode;
          minutesUntil = toMinutes(c.startTime) - now;
          locationName;
        };
      };
    };
  };

  // ---- Shared helpers for the navigation domain ---------------------------

  public func dayLabel() : Text { demoDayName() };

  public func clockFromNow(offsetMinutes : Nat) : Text {
    toClock(nowMinutes() + offsetMinutes)
  };

  public func minutesOf(clock : Text) : Nat { toMinutes(clock) };

  public func nowMinutesOfDay() : Nat { nowMinutes() };

  public func dayNameFor(index : Nat) : Text { dayNames[index % dayNames.size()] };
};
