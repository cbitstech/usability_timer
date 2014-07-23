// Dynamo.Core.js

// Dynamo is a client-side Xelements framework
// built on top of Backbone.js
// 
// Dynamo's Hard Dependencies are:
// 
// Underscore.js
// jQuery.js
// Backbone.js
// 
// Its purpose is to simplify the coding of client-side applications
// that adhere to the Trireme-expected schema of Xelements, Users, Groups, and Data.
// 
// Dynamo is Split up into two (in the long run (ITLR), possibly 3?) layers: The Core,
// and The Mantle. (ITLR: also, The Crust?)
// 
// The Core Specifies a set of Backbone-based Models, Views, and Collections 
// for interaction with a Trireme-Based Server Endpoint.
// 
// The Mantle Specifies a set of additional Model, View and Collection Backbone-based classes for Xelements 
// that provide differentiated functionality based upon an Xelement's xelement_type.
// (ITLR: Users, Groups, Data as well? for the moment, unlikely.)
// 
// Separating Dynamo into these two sections is part of a design that allows selection of 
// Dynamo 'core' attributes that can then later affect the definition of classes in the Mantle.  That is, 
// Mantle classes are not defined until the developer can make certain choices about how Dynamo will behave w/in
// the context of the application.
// 
// Hence, the analogy of a Core and Mantle: the developer must 'stabilize' aspects of Dynamo's 'Core' before 
// Dynamo can define (i.e. allow the developer to use) classes in Dynamo's Mantle.
// 
// Pragmatically, this two-stage initialization is accomplished 
// <del>through the use of jQuery Promises</del> as follows:
// 
// <script type="text/javascript" src="JS/Dynamo/Dynamo.Core.js "></script>
// <!-- Define The Location of Trireme -->
// <script>  Dynamo.TriremeURL = "https://[Fill in]";  </script>
// <script type="text/javascript" src="JS/Dynamo/Dynamo.Core.Models.js"></script>
// <script type="text/javascript" src="JS/Dynamo/Dynamo.Core.Collections.js"></script>
// <script type="text/javascript" src="JS/Dynamo/Dynamo.Core.Views.js"></script>
// <script>
// // Initialize Dynamo Core
// Dynamo.XelementClass = Dynamo.UnitaryXelement; // Define the Xelement Model Class to be used in the mantle classes.
// </script>
// //free to include additional mantle classes below.
// 
// <del>
// Hence, much like most jQuery-dependent code should be is written within the document ready callback, 
// most Dynamo-dependent code should be run inside of a callback on the resolution of Dynamo.stabilized():
//  
//  $.when( Dynamo.stabilized() ).done(function() {
//    //Dynamo-dependent code goes here.
//  });
// </del>


Dynamo = {};
Dynamo.mantleDefinitions = {};

_.bindAll(Dynamo);

// Core Stabilization occurs when a developer defines a set of Dynamo 
// attributes.  
// 
// Some Dynamo attributes must be defined by the developer: 
// 
// Dynamo.XelementClass: 
//  It's Purpose: Defines which version the Dynamo Xelement classes is to be used to inherit from by classes defined in the Mantle
//  It's value: One of the Dynamo Xelement Classes
// Dynamo.MantleNeeds 
//  It's Purpose: 
//    An application does not need to depend on all Mantle Classes, just some.  
//    This defines which of those classes the application depends on.
//  It's value: An array of strings, each of which is a class name defined in Dynamo's Mantle.
// 


//Returns true if the core is stable, false otherwise.
Dynamo.isCoreStable = function() {
  if ( typeof(this.XelementClass) == "undefined" ) { return false };
  return true;
}

//Returns true if the mantle is stable, false otherwise.
Dynamo.isMantleStable = function()  {
  
  if ( _.isUndefined( this.neededDefinitions ) ) { return false };
  
  _.each(this.neededDefinitions, function(neededKey) {

    if ( _.isUndefined( Dynamo[neededKey] ) ) { return false };

  });

  return true;

};

// CurrentUser
//  A placeholder function.
//  Must be overridden by the application
//  in order to return the current user object
Dynamo.CurrentUser = function() { return null }


// ************************************************
// 
// Helper Vars and Functions
// 
// ************************************************


// Underscore methods that we want to implement on a Model.
var methods = ['forEach', 'each', 'map', 'reduce', 'reduceRight','keys', 'values', 'pick', 'isEmpty', 'isEqual'];
// Mix in each Underscore method as a proxy to `Model#attributes`.
_.each(methods, function(method) {
  Backbone.Model.prototype[method] = function() {
    return _[method].apply(_, [this.attributes].concat(_.toArray(arguments)));
  };
});

//Copied from Backhand.js:
/**
 * convertFalses 
 * A helper function that replaces  
 * the string 'false' in an object with the value false
 * and returns the object. It doesn't create a copy; it changes the object itself.
 * the need for this function arises from needing to parse
 * objects contained within strings that Trireme may ship to the client.
 * 
 * @param  {[object]} obj [any js object of any depth]
 * @return {[object]}     [the object with any strings 'false' replaced with the value false]
*/
convertFalses = function(str_obj_or_other) {
  if (str_obj_or_other === "false") { return false; };
  if ( _.isObject(str_obj_or_other) ) {
    _.each(str_obj_or_other, function(val, key) {
      str_obj_or_other[key] = convertFalses(val);
    });
  };
  return str_obj_or_other;
};

/**
 * JSONparseNested 
 * A helper function that takes a string
 * which is presumably a JSON object that has then been 
 * stringified an arbitrary number of times and then returns
 * the result of parsing the string until it is an object  
 * @param  {[object]} stringified_json [a string which is, presumably at some level of escaping, a JSON object]
 * @return {[object]} [ the json object ]
*/
JSONparseNested = function(stringified_json) {
  
  //  undefined / null values become an empty object.
  if (stringified_json === null || typeof(stringified_json) === "undefined" ) { return {}; };

  var result = stringified_json;

  try {  
    while ( _.isString(result) ) { result = JSON.parse(result); };
  }
  catch (e) {
    console.warn("JSONparseNested(): Error parsing string as possible_object: ")
    console.log(e);
    console.log("Instead, leaving string as is: ");
    console.log(result);
  };

  return result;

};


/**
 * stringToXelementType 
 * A helper function that takes  
 * a type and a string and attempts to convert it to a specified type 
 * as is the case for XelementCMS content
 * i.e.
 * 
 * @param  {string} type [a string of the type to convert]
 * @return {[object]}     [the object with any strings 'false' replaced with the value false]
*/
stringToXelementType = function(type, value) {
  try {
    switch(type) {
      case 'html':
      case 'string':
        if (value === null || typeof(value) === 'undefined') {
          return ""
        } else {
          return value; 
        };
        break;
      case 'int':
        return parseInt(value);
        break;
      case 'Date':
        return new Date(value);
        break;
      case 'array':
      case 'xelementGuidArray':
      case 'json':
        try {
          return JSON.parse(value);
        }
        catch (error) {
           if (type == 'json') {
            return {}
           } else {
            return []
          };
        };
        break;
      case 'bool':
      case 'javascript':
        return eval(value);
        break;
      default:
        throw new Error("stringToXelementType(): unexpected type: '"+type+"' ");
    };
  }
  catch (error) {
    console.warn("error attempting to convert string '"+value+"' to type: '"+type+"'");
    console.warn(error);
    return null;
  };
}

//copied out of Backhand.js
addQueryVarToUrl = function(name, value, url) {
  var new_url;
  new_url = url;
  if (new_url.indexOf(name) === -1) {
    if (new_url.indexOf("?") === -1) {
      new_url = new_url + "?";
    } else {
      new_url = new_url + "&";
    }
    new_url = new_url + ("" + name + "=" + value);
  }
  return new_url;
};

//copied out of Backhand.js
addSessionVarsToUrl = function(url) {
  var new_url;
  new_url = addQueryVarToUrl("user_id", Dynamo.CurrentUser().id, url);
  new_url = addQueryVarToUrl("session_id", "YO-IMA-SESSION-ID", new_url);
  return new_url;
};



//
//
// Override Backbone.sync
//

Dynamo._previousSync = Backbone.sync;

Dynamo.AuthenticatedSync = function (method, model, options) {
  // Default options, unless specified.
  options || (options = {});
  console.log("");
  console.log("In AuthenticatedSync: ", method, model, options);
  
  // Ensure appropriate session variables for authentication.
  options.beforeSend = function(jqXHR, settings) {
    console.log("In BeforeSend (jqXHR, settings):", jqXHR, settings);
    var new_data;
    if (!settings.url) {
      console.warn("No settings.url in beforeSend??");
    };
    settings.url = addSessionVarsToUrl(settings.url);
    console.log("final URL: ", settings.url);
    if (settings.data) {
      console.log("adding transmitted_at as data", settings.data);
      new_data = JSON.parse(settings.data);
      new_data.transmitted_at = (new Date()).toString();
      settings.data = JSON.stringify(new_data);    
    };
    console.log("---------------");
  };
  
  return Dynamo._previousSync(method, model, options);
};

Backbone.sync = Dynamo.AuthenticatedSync

//
//
// Additional Sync Functions
//

ReadOnlySync = function (method, model, options) {
    console.log("Using ReadOnlySync", method, model, options);
    // Default options, unless specified.
    options || (options = {});
    switch(method) {
      case "create":
      case "update":
        throw new Error("ReadOnlySync prevents saving this model to the server.");
        break;
      case "read":
        return Backbone.sync("read", model, options);
        break;
      case "delete":
        throw new Error("ReadOnlySync prevents deleting this model from the server.");
        break;
      default: 
        throw new Error("Unexpected value for argument, 'method': '"+method+"' passed to PsuedoSync");
    };
};

PseudoSync = function (method, model, options) {
    console.log("Using PsuedoSync; No actual save-to or read-from server.", method, model, options);
    // Default options, unless specified.
    options || (options = {}); 
    switch(method) {
      case "create":
      case "update":
        return {};
        break;
      case "read":
        alert('PseudoSync: read operation attempted');
        throw new Error("PsuedoSync mocks Backbone.sync's response from the server; it cannot read data");
        break;
      case "delete":
        console.warn("PsuedoSync: delete operation attempted; Not 100% what return value should be...")
        return {};
        break;
      default: 
        throw new Error("PsuedoSync: Unexpected value for argument, 'method': '"+method+"'");
    };
};