UsabilityTimer.Models.UsabilityEntry = Dynamo.Data.extend({

  addTDClass: function(){
    var tdClass, problem = this.get_field("problem")[1];
    tdClass = (function() {
      switch (problem) {
        case "Success":
          return "text-success";
        case "Failure":
          return "text-error";
        case "Point of Interest":
          return "text-info";
        default:
          return "muted";
      }
    })();
    this.set_field("td_class", "string", tdClass);
  },

  displayReadableDuration: function(time) {
    // strip the miliseconds
    time/=1000;

    // get seconds
    var seconds = Math.round(time % 60);

    // remove seconds from the date
    time/= Math.round(60);

    // get minutes
    var minutes = Math.round(time % 60);

    // remove minutes from the date
    time/= Math.round(60);

    // get hours
    var hours = Math.round(time % 24);

    // remove hours from the date
    time/= Math.round(24);

    // the rest of t is number of days
    var days = time;

    var timeString = ""

    $.each([hours, minutes, seconds], function(index, value) {
      if (index === 0) { var label = "hr"; };
      if (index === 1) { var label = "min"; };
      if (index === 2) { var label = "sec"; };
      switch(value)
        {
        case 0:
          return timeString = timeString
          break;
        case 1:
          return timeString = timeString + value + " "+label+" "
          break;
        default:
          return timeString = timeString + value + " "+label+"s "
        }
    });
    return timeString
  },

  setDuration: function(endTime) {
    var startTime = this.get_field("start_time")[1]

    // time difference in ms
    var duration = endTime.getTime() - startTime.getTime();

    var durationString = this.displayReadableDuration(duration)
    this.set_field("end_time", "string", endTime);
    this.set_field("duration", "string", duration);
    this.set_field("durationString", "string", durationString);
    this.save();
  }

});