import Common "common";

module {
  // A campus building in the demo dataset.
  public type Building = {
    id : Common.Id;
    code : Text; // e.g. "SC"
    name : Text; // Thai name, e.g. "อาคารวิทยาศาสตร์ 2"
    description : Text; // Thai description
    floors : Nat;
  };

  // A room inside a building.
  public type Room = {
    id : Common.Id;
    code : Text; // e.g. "SC-204"
    buildingId : Common.Id;
    buildingName : Text; // Thai building name
    floor : Nat;
    description : Text; // Thai description
  };

  // A named campus location usable as a navigation origin or destination.
  public type CampusLocation = {
    id : Common.Id;
    name : Text; // Thai name, e.g. "โรงอาหารกลาง"
    kind : Text; // Thai kind label, e.g. "อาคาร", "โรงอาหาร", "จุดจอด EV"
    description : Text; // Thai description
  };

  // A walking route segment between two campus locations.
  public type RouteSegment = {
    fromLocationId : Common.Id;
    toLocationId : Common.Id;
    distanceMetres : Common.Metres;
    walkingMinutes : Common.Minutes;
    instruction : Text; // Thai step-by-step instruction
  };

  // A demo EV shuttle line.
  public type EvLine = {
    id : Common.Id;
    name : Text; // e.g. "EV สาย 1"
    stops : [Text]; // ordered Thai stop names
    nextStation : Text; // Thai next station name
    arrivalMinutes : Common.Minutes;
    crowdLevel : Text; // Thai crowd level, e.g. "ปานกลาง", "น้อย"
  };

  // A simulated AI scan detection result.
  public type ScanResult = {
    buildingName : Text; // Thai detected building name
    roomCode : Text; // e.g. "SC-204"
    floor : Nat;
    instruction : Text; // Thai walking instruction
  };
};
