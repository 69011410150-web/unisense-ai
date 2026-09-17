import ScheduleLib "../lib/schedule";
import ScheduleTypes "../types/schedule";
import NavTypes "../types/navigation";

mixin () {
  public query func listSchedule() : async [ScheduleTypes.ClassEntry] {
    ScheduleLib.listSchedule();
  };

  public query func getProfile() : async ScheduleTypes.StudentProfile {
    ScheduleLib.getProfile();
  };

  public query func getNextClass() : async ?NavTypes.NextClass {
    ScheduleLib.getNextClass();
  };
};
