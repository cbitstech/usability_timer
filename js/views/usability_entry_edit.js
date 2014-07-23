UsabilityTimer.Views.UsabilityEntryEdit = Backbone.View.extend({

  template: function() {
    var template = _.template($("script#edit_entry").html());
    var jsonModelAttrs = {
      time: this.model.get_field("time")[1],
      problem: this.model.get_field("problem")[1],
      user_event: this.model.get_field("user_event")[1],
      issues: this.model.get_field("issues")[1],
      notes: this.model.get_field("notes")[1],
      date_time: this.model.get_field("date_time")[1],
      videos: this.model.get_field("videos")[1],
      device: this.model.get_field("device")[1],
      dateTime: this.model.get_field("dateTime")[1]
    };
    return template(jsonModelAttrs);
  },
  
  initialize: function() {
    this.model.on('remove', function() {
      $(this.el).remove();
    }, this);
  },

  events: {
    "click div#edit_entry_attributes .btn-group a" : "updateProblem",
    "keyup form.optional textarea#event" : "updateEvent",
    "keyup form.optional textarea#issues" : "updateIssues",
    "keyup form.optional textarea#notes" : "updateNotes"
  },

  render: function() {
    var view = $(this.el).html(this.template());
    $('div#edit_container').html(view);
    return this;
  },

  updateEvent: function(event) {
    event.preventDefault();
    var value = $(event.target).val();
    this.model.set_field("user_event", "string", value).save();
  },

  updateIssues: function(event) {
    event.preventDefault();
    var issues = $(event.target).val();
    this.model.set_field("issues", "string", issues).save();
  },

  updateNotes: function(event) {
    event.preventDefault();
    var notes = $(event.target).val();
    this.model.set_field("notes", "string", notes).save();
  },

  updateProblem: function(event) {
    console.log('updating problem before save')
    event.preventDefault();
    var problem = $(event.target).data().problem;
    this.model.set_field("problem", "string", problem);
    this.model.addTDClass();
    this.model.save();
  }

});