makeTimeReadable = function (originalTime) {
  var seconds = originalTime.getSeconds();
  var minutes = originalTime.getMinutes();
  var hours = originalTime.getHours();
  var period = (hours < 12 ? "AM" : "PM");

  seconds = (( seconds < 10 ? "0" : "" ) + seconds)
  minutes = (( minutes < 10 ? "0" : "" ) + minutes)

  // Convert to non-military time
  if (hours > 12) {
    hours = hours - 12
    hours = (( hours < 10 ? "0" : "" ) + hours)
  };
  readableTime = ""+hours+":"+minutes+":"+seconds+" "+period
  return readableTime
};