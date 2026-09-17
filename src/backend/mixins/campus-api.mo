import CampusLib "../lib/campus";
import CampusTypes "../types/campus";

mixin () {
  public query func listBuildings() : async [CampusTypes.Building] {
    CampusLib.listBuildings();
  };

  public query func listRooms() : async [CampusTypes.Room] {
    CampusLib.listRooms();
  };

  public query func listLocations() : async [CampusTypes.CampusLocation] {
    CampusLib.listLocations();
  };

  public query func listRouteSegments() : async [CampusTypes.RouteSegment] {
    CampusLib.listRouteSegments();
  };

  public query func listEvLines() : async [CampusTypes.EvLine] {
    CampusLib.listEvLines();
  };

  public query func getCurrentLocation() : async CampusTypes.CampusLocation {
    CampusLib.getCurrentLocation();
  };

  // Returns the fixed demo scan detection (อาคารวิทยาศาสตร์ 2 / SC-204).
  public func scan() : async CampusTypes.ScanResult {
    CampusLib.scan();
  };
};
