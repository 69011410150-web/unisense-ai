import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import ArrayEntity "mo:caffeineai-oql/ArrayEntity";
import RecordValue "mo:caffeineai-oql/RecordValue";
import NatValue "mo:caffeineai-oql/NatValue";
import TextValue "mo:caffeineai-oql/TextValue";
import CampusLib "../lib/campus";
import ScheduleLib "../lib/schedule";
import CampusTypes "../types/campus";
import ScheduleTypes "../types/schedule";

// Read-only OQL exposure of the demo campus dataset.
//
// The demo dataset is served from `lib` modules as constant data rather than
// mutable actor fields, so each entity is declared over the module's array
// accessor. Every entity is `.public_()`: the dataset is non-personal demo
// data that the app itself renders to anonymous visitors.
mixin () {
  include Expose({
    entities = [
      CampusLib.listBuildings().toEntity<CampusTypes.Building>("building", "Building", "id")
        .sample({ id = 0; code = ""; name = ""; description = ""; floors = 0 })
        .public_()
        .build(),
      CampusLib.listRooms().toEntity<CampusTypes.Room>("room", "Room", "id")
        .sample({ id = 0; code = ""; buildingId = 0; buildingName = ""; floor = 0; description = "" })
        .edge("buildingId", "building")
        .public_()
        .build(),
      CampusLib.listLocations().toEntity<CampusTypes.CampusLocation>("campusLocation", "CampusLocation", "id")
        .sample({ id = 0; name = ""; kind = ""; description = "" })
        .public_()
        .build(),
      CampusLib.listRouteSegments().toEntity<CampusTypes.RouteSegment>("routeSegment", "RouteSegment", "fromLocationId")
        .sample({ fromLocationId = 0; toLocationId = 0; distanceMetres = 0; walkingMinutes = 0; instruction = "" })
        .edge("fromLocationId", "campusLocation")
        .edge("toLocationId", "campusLocation")
        .public_()
        .build(),
      // `EvLine.stops` is a `[Text]` field, which has no `_toRow` instance, so
      // this entity is declared manually and the stop list is joined into a
      // single Text column.
      Entity.manual<CampusTypes.EvLine>(
        "evLine",
        func () = CampusLib.listEvLines().values(),
        "EvLine",
        "id",
      )
        .sample({ id = 0; name = ""; stops = []; nextStation = ""; arrivalMinutes = 0; crowdLevel = "" })
        .payload("id", func l = l.id)
        .payload("name", func l = l.name)
        .payload("stops", func l = l.stops.values().join(" | "))
        .payload("nextStation", func l = l.nextStation)
        .payload("arrivalMinutes", func l = l.arrivalMinutes)
        .payload("crowdLevel", func l = l.crowdLevel)
        .public_()
        .build(),
      ScheduleLib.listSchedule().toEntity<ScheduleTypes.ClassEntry>("classEntry", "ClassEntry", "id")
        .sample({
          id = 0;
          subject = "";
          day = "";
          startTime = "";
          endTime = "";
          buildingName = "";
          roomCode = "";
          instructor = "";
        })
        .public_()
        .build(),
      // The demo profile is a single record, not a collection, so it is
      // exposed as a one-row entity over a singleton array.
      [ScheduleLib.getProfile()].toEntity<ScheduleTypes.StudentProfile>("studentProfile", "StudentProfile", "studentId")
        .sample({ displayName = ""; studentId = ""; faculty = ""; year = 0; avatarPlaceholder = "" })
        .public_()
        .build(),
    ];
  });
};
