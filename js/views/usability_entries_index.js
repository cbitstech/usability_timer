UsabilityTimer.Views.UsabilityEntriesIndex = Backbone.View.extend({

  template: function() {
    return _.template($("script#usability-entries").html());
  },
  
  initialize: function() {
    _.bindAll(this);
    this.collection.on('add', this.render);
    this.collection.on('remove', this.render);
    this.sortAttribute = "time";
    this.sortDirection = "DESC";
    this.highRowID = undefined;
    var self = this;
    this.collection.comparator = function(entryA, entryB) {
      if ( entryA.get_field(self.sortAttribute)[1] < entryB.get_field(self.sortAttribute)[1] ) {
        if (self.sortDirection == "ASC") {
          return -1
        } 
        else {
          return 1
        };
      };
      if ( entryA.get_field(self.sortAttribute)[1] > entryB.get_field(self.sortAttribute)[1] ) {
        if (self.sortDirection == "ASC") {
          return 1
        } 
        else {
          return -1
        };
      };      
      return 0
    };
    this.collection.sort();    
  },

  events: {
    "click th": "sortCollection"
  },

  render: function(options) {
    var self = this;
    $('div#entries_container').append($(this.el).html(this.template()));
    this.collection.each(this.prependUsabilityEntries);
    this.displayChevronArrow(options);
    this.keepHighlightedRow(options);
    return this;
  },

  displayChevronArrow: function(options) {
    if (options != undefined) {
      var th = $("th[data-sortableattr='"+options.sortAttr+"']")
      if (options.sortDir == "ASC") {
        th.append(' <i class="icon-chevron-up"></i>')
      } else {
        th.append(' <i class="icon-chevron-down"></i>')
      };
    };
    // add chevron ASC for time if nothing else exists
    if (($('i.icon-chevron-down').length == 0) && ($('i.icon-chevron-up').length == 0)) {
      $("th[data-sortableattr='time']").append(' <i class="icon-chevron-up"></i>')
    }
  },

  keepHighlightedRow: function(options) {
    if ((options != undefined) && (options.highRowID != undefined)) {
      $('tr#'+options.highRowID).addClass("warning");
    };
  },

  prependUsabilityEntries: function(usability_entry) {
    var view = new UsabilityTimer.Views.UsabilityEntry({model: usability_entry});
    $('tbody#usability-entries-tbody').prepend(view.$el);
    view.render();
  },

  sortCollection: function(event) {
    var self = this;
    var sortAttributeWas = this.sortAttribute;
    this.sortAttribute = $(event.currentTarget).data('sortableattr');
    if (this.sortAttribute == sortAttributeWas) {
      this.switchDirection();
    };

    this.collection.sort();

    var highlightedRowID = $('table tbody tr.warning').attr('id')

    this.render({sortAttr: this.sortAttribute, sortDir: this.sortDirection, highRowID: highlightedRowID});
  },

  switchDirection: function() {
    if (this.sortDirection == "DESC") {
      this.sortDirection = "ASC";
    } 
    else {
      this.sortDirection = "DESC";
    }
  }

});