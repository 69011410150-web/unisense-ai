import Common "common";

module {
  // A weekly class entry in the demo student schedule.
  public type ClassEntry = {
    id : Common.Id;
    subject : Text; // Thai subject name
    day : Common.DayOfWeek; // Thai day name
    startTime : Common.ClockTime; // "HH:MM"
    endTime : Common.ClockTime; // "HH:MM"
    buildingName : Text; // Thai building name
    roomCode : Text; // e.g. "SC-204"
    instructor : Text; // Thai instructor name
  };

  // The demo student profile.
  public type StudentProfile = {
    displayName : Text; // Thai display name
    studentId : Text; // demo student ID
    faculty : Text; // Thai faculty name
    year : Nat;
    avatarPlaceholder : Text; // demo avatar placeholder
  };
};
