import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import CampusApiMixin "mixins/campus-api";
import ScheduleApiMixin "mixins/schedule-api";
import NavigationApiMixin "mixins/navigation-api";
import SmartMomentApiMixin "mixins/smart-moment-api";
import OqlApiMixin "mixins/oql-api";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;

  include MixinAuthorization(accessControlState, null);
  include CampusApiMixin();
  include ScheduleApiMixin();
  include NavigationApiMixin();
  include SmartMomentApiMixin();
  include OqlApiMixin();
  include ApiDocMixin();
};
