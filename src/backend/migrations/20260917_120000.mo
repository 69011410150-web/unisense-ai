import AccessControl "mo:caffeineai-authorization/access-control";

module {
  type OldActor = {};

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
  };

  public func migration(_old : OldActor) : NewActor {
    {
      accessControlState = AccessControl.initState();
    };
  };
};
