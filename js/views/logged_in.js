UsabilityTimer.Views.LoggedIn = Backbone.View.extend({

  template: function() {
    options = this.options;
    template = _.template($("script#logged-in").html());
    var jsonModelAttrs = ({
      title: options.title,
      description: options.description,
      location: options.location,
      researcher: options.researcher
    });
    return template(jsonModelAttrs);
  },

  initialize: function() {
    this.startTimer();
    $collection = new UsabilityTimer.Collections.UsabilityEntries();
  },

  className: "row-fluid",

  events: {
    "click a.select-participant-username": "selectPartipantUsername",
    "click button#create-entry": "saveEntry",
    "click button#end-session": "finishSession",
    "blur input#usernames": "validateParticipantsPresence",
    "click input#usernames": "validateParticipantsPresence",
    "keydown input#usernames": "validateParticipantsPresence",
    "keyup input#usernames": "validateParticipantsPresence"
  },

  render: function() {
    var view = this.$el.html(this.template());
    $("div#main").html(view);
    var view = new UsabilityTimer.Views.UsabilityEntriesIndex({
      collection: $collection
    });
    view.render();
    $("div#entries_container").html(view.$el);
    // This methods can't be in initialize b/c the page has to be rendered
    this.autoCompleteUsernames()
    this.appendPatients()
    return this;
  },

  appendPatients: function() {
    var participantsCollection = new UserCollection({"group_id":"MobilyzeBetaTestSept2012"});
    participantsCollection.fetch({
      async: false
    });
    var ulTag = $("ul#usernames-dropdown");
    var usernamesArray = [];
    $.each([1,2], function(index, Element) {
    // $.each(participantsCollection.models, function(index, Element) {
      // ulTag.append('<li><a value="'+Element.get('username')+'">'+Element.get('username')+'</a></i>');
      ulTag.append('<li><a class="select-participant-username" value="'+'mike'+'">'+'mike'+'</a></i>');
    });
  },

  autoCompleteUsernames: function() {
    var participantsCollection = new UserCollection({"group_id":"MobilyzeBetaTestSept2012"});
    participantsCollection.fetch({async: false});
    var availableUsernames = [];
    $.each(participantsCollection.models, function(index, Element) {
      availableUsernames.push(Element.get('username'))
    });

    function split( val ) {
        return val.split( /,\s*/ );
    };
    function extractLast( term ) {
        return split( term ).pop();
    };
    $("input#usernames")
      // don't navigate away from the field on tab when selecting an item
      .bind("keydown", function(event) {
        if ( event.keyCode === $.ui.keyCode.TAB &&
            $( this ).data( "autocomplete" ).menu.active ) {
          event.preventDefault();
        }
      })
      .bind("focus", function(event){
        $(this).trigger("keydown");
      })
      .autocomplete({
        minLength: 0,
        source: function( request, response ) {
          // delegate back to autocomplete, but extract the last term
          response( $.ui.autocomplete.filter(
              availableUsernames, extractLast( request.term ) ) );
        },
        focus: function() {
          // prevent value inserted on focus
          return false;
        },
        select: function( event, ui ) {
          var terms = split( this.value );
          // remove the current input
          terms.pop();
          // add the selected item
          terms.push( ui.item.value );
          // add placeholder to get the comma-and-space at the end
          terms.push( "" );
          this.value = terms.join( ", " );
          return false;
        }
      });
  },

  finishSession: function(){
    event.preventDefault();
    if (this.validateParticipantsPresence()) { // This vlaidation might have to be removed if annoying b/c maybe the researcher was finished without noting anything.
      if(confirm("This will save and clear all existing data.  Are you sure?")){
        var endTime = new Date();
        $collection.each(function(entry){
          readable_end_time = makeTimeReadable(endTime);
          entry.set_field("readable_end_time", "string", readable_end_time);
          entry.setDuration(endTime);
        });
        location.reload();
      };
    };
    return false;
  },

  saveEntry: function(event) {
    event.preventDefault();
    if (this.validateParticipantsPresence()) {
      // Continues if researcher selected at least 1 participant
      var originalDateTime = new Date();
      var readableTime = makeTimeReadable(originalDateTime);
      var readable_start_time = makeTimeReadable(options.startTime);
      // Find all participants
      // trims the white spaces and then removes the last comma.
      var usernamesList = $.trim($("input#usernames:first").val())
      if(usernamesList.charAt( usernamesList.length-1 ) === ",") {
        usernamesList = usernamesList.slice(0, -1)
      };
      var usernamesArray = usernamesList.split( ',' );
      // Create Entry for each participant - this may not be the best way to do this!
      _.each(usernamesArray, function(num){
        var username = $.trim(num) //trim white spaces surrounding username
        var entry = new UsabilityTimer.Models.UsabilityEntry({
          group_id: current_user.get("group_id"),
          user_id: username,
          xelement_id: "XE"
        });

        // Set entry attributes
        entry.set_field("time", "string", readableTime);
        entry.set_field("problem", "string", "");
        entry.set_field("username", "string", $(num).text());
        entry.set_field("user_event", "string", "");
        entry.set_field("issues", "string", "");
        entry.set_field("notes", "string", "");
        entry.set_field("date", "string", $date);
        entry.set_field("videos", "string", "");
        entry.set_field("device", "string", "");
        entry.set_field("start_time", "string", options.startTime);
        entry.set_field("readable_start_time", "string", readable_start_time);
        entry.set_field("end_time", "string", "");
        entry.set_field("readable_end_time", "string", "");
        entry.set_field("researcher_name", "string", options.researcher);
        entry.set_field("year", "string", originalDateTime.getFullYear());
        entry.set_field("month", "string", originalDateTime.getMonth());
        entry.set_field("day", "string", originalDateTime.getDate());
        entry.set_field("hour", "string", originalDateTime.getHours());
        entry.set_field("minute", "string", originalDateTime.getMinutes());
        entry.set_field("second", "string", originalDateTime.getSeconds());
        entry.set_field("dateTime", "string", originalDateTime);

        entry.save();
        $collection.add(entry);

        // Display entry
        var edit_view = new UsabilityTimer.Views.UsabilityEntryEdit({model: entry});
        edit_view.render();

        // Add highlighting the row containing the newly created model
        $('tr#'+entry.cid).addClass("warning");
      }); //_.each
    }; // if
    return false;
  },

  selectPartipantUsername: function() {
    event.preventDefault();
    var name = $(event.target).attr('value');
    var text = ($('input#usernames').val() + name  + ', ')
    $('input#usernames').val(text)
  },

  // http://www.alessioatzeni.com/blog/css3-digital-clock-with-jquery/
  startTimer: function() {
    // Create two variable with the names of the months and days in an array
    var monthNames = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ]; 
    var dayNames= ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]

    // Create a newDate() object
    var newDate = new Date();
    // Extract the current date from Date object
    newDate.setDate(newDate.getDate());
    // Output the month, date, and year

    $date = monthNames[newDate.getMonth()] + " " + newDate.getDate() + ", " + newDate.getFullYear();
    $('#Date').html($date);

    setInterval( function() {
      // Create a newDate() object and extract the seconds of the current time on the visitor's
      var seconds = new Date().getSeconds();
      var hours = new Date().getHours();
      var period = (hours < 12 ? "AM" : "PM")

      $("#sec").html(( seconds < 10 ? "0" : "" ) + seconds + " "+period);
      },1000);
      
    setInterval( function() {
      // Create a newDate() object and extract the minutes of the current time on the visitor's
      var minutes = new Date().getMinutes();
      // Add a leading zero to the minutes value
      $("#min").html(( minutes < 10 ? "0" : "" ) + minutes);
        },1000);
      
    setInterval( function() {
      // Create a newDate() object and extract the hours of the current time on the visitor's
      var hours = new Date().getHours();
      
      // user views nonmilitary time
      if (hours > 12) {
        hours = hours - 12
      };

      // Add a leading zero to the hours value
      $("#hours").html(( hours < 10 ? "0" : "" ) + hours);
    }, 1000);
    
  },

  validateParticipantsPresence: function() {
    var usernamesCG = $('div#c-g-participant-usernames');
    // debugger
    if (usernamesCG.find('input').val().length === 0) {
      usernamesCG.removeClass('success').addClass('error');
      return false;
    } else {
      usernamesCG.removeClass('error').addClass('success');
      return true;
    };
  }

})