window.UsabilityTimer = {
  Models: {},
  Collections: {},
  Views: {},
  Routers: {},
  init: function(){
    var startSession = new UsabilityTimer.Views.StartSession()
    startSession.render()
  }
};

$(document).ready(function() {
  UsabilityTimer.init();
});