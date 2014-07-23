UsabilityTimer.Views.UsabilityEntry = Backbone.View.extend({

  template: function() {
    var template = _.template($("script#usability_entry").html());
    var jsonModelAttrs = {
      time: this.model.get_field("time")[1],
      problem: this.model.get_field("problem")[1],
      user_event: this.model.get_field("user_event")[1],
      issues: this.model.get_field("issues")[1],
      notes: this.model.get_field("notes")[1],
      videos: this.model.get_field("videos")[1],
      username: this.model.get('user_id'), // or this.model.get_field("username")[1],
      device: this.model.get_field("device")[1],
      td_class: this.model.get_field("td_class")[1]
    };
    return template(jsonModelAttrs);
  },

  initialize: function() {
    _.bindAll(this);
    this.model.on('change', this.render);
  },

  tagName: 'tr',

  events: {
    "click td:not('.delete')": "edit",
    "click a.delete" : "delete",
    "click td": "setAsCurrent"
  },

  render: function() {
    $(this.el).attr('id', this.model.cid).html(this.template());
    return this;
  },

  delete: function() {
    this.model.destroy()
  },

  edit: function(event) {
    event.preventDefault();
    var view = new UsabilityTimer.Views.UsabilityEntryEdit({model: this.model});
    view.render();
  },

  setAsCurrent: function() {
    var tbody = this.$el.closest('tbody')
    var tbodyRows = tbody.find('tr');
    tbodyRows.each(function(index, Element){
      $(Element).removeClass('warning')
    });
    this.$el.addClass("warning");
    this.render();
  }

});