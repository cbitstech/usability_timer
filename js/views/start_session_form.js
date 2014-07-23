UsabilityTimer.Views.StartSession = Backbone.View.extend({

  template: function() {
    return _.template($("script#start-session-form").html());
  },

  className: "row-fluid",

  events: {
    "click button#session-info": "start",
    "blur input#form_session_researcher": "displayResearcherValidationState",
    "change input#form_session_researcher": "displayResearcherValidationState",
    "keydown input#form_session_researcher": "displayResearcherValidationState",
    "keyup input#form_session_researcher": "displayResearcherValidationState"
  },

  render: function() {
    var view = this.$el.html(this.template());
    $("div#main").html(view);
    return this;
  },

  start: function(event) {
    event.preventDefault();
    if (this.validateResearcher()) {
      researcher = $("input#form_session_researcher").val();
      startTime = new Date();
      var title = $("input#form_session_title").val();
      var desc = $("input#form_session_desc").val();
      var location = $("input#form_session_location").val();
      if (title === "") { title = "Untitled" };
      if (desc === "") { desc = "Not available" };
      if (location === "") { location = "Not available" };
      if (researcher === "") { researcher = "Not available" };
      var view = new UsabilityTimer.Views.LoggedIn({title:title, description: desc, location:location, researcher:researcher, startTime:startTime});
      view.render();
    }
    return false;
  },

  displayResearcherValidationState: function() {
    var researcherControlGroup = $('div#researcher-control-group');
    if (($("input#form_session_researcher").val() !== "")) {
      researcherControlGroup.removeClass('error').addClass('success');
    } else {
      researcherControlGroup.removeClass('success').addClass('error');
    };
  },

  validateResearcher: function() {
    var researcherControlGroup = $('div#researcher-control-group');
    if (($("input#form_session_researcher").val() !== "")) {
      researcherControlGroup.removeClass('error').addClass('success');
      return true;
    } else {
      researcherControlGroup.removeClass('success').addClass('error');
      return false;
    };
  }

})