//  
//  
//  Dynamo.Core.Models.js
// 
// 
//  Dependencies:
//    - Dynamo.Core.js


// Dynamo.Model
// Although currently no special functionality, all other models should
// at least inherit from this one, and not from Backbone.Model directly for encapsulation.
Dynamo.Model = Backbone.Model.extend({

});


// Dynamo.SaveableModel
// Adds a Bevy of Methods and Functionality related to Saving.
Dynamo.SaveableModel = Dynamo.Model.extend({
  // Attributes
  saveStates: ['new', 'unsaved_changes', 'current'],
  codeName: 'saveable',
  prettyName: 'Saveable Model',

  initializeAsSaveable: function() {
    this.on('change', this.logChange);
    this.on('change', this.setUnsavedChanges);
    this.on('sync',   this.clearUnsavedChanges);
  },

  logChange: function () { 
    console.log("Xelement<cid="+self.cid+"> - "+this.prettyName+" changed");
  },
  
  currentSaveState: function() {
    if (this.isNew()) { return 'new' };
    if (this.hasUnsavedChanges()) {return 'unsaved_changes' };
    return 'current';
  },

  currentSaveText: function() {
    switch (this.currentSaveState()) {
      case 'new':
        return 'Unsaved';
      case 'unsaved_changes':
        return 'Unsaved changes'
      case 'current':
        return 'All changes saved'
    };
  },

  startPeriodicSaving: function(interval_in_seconds) {
    console.log('started Periodic saving at the model level every '+interval_in_seconds+' seconds');
    var self = this, saveIntervalID;
    if (!this.currentSaveIntervalID) {
      this.currentSaveIntervalID = setInterval(self.suggestSaveIfChanged, interval_in_seconds*1000);
    } else {
      console.warn("Attempted to initiate interval-initiated-save of Model<cid: "+this.cid+">"+
        " but it is already being saved at an interval.  Command Ignored. Current Interval ID is: "+ this.currentSaveIntervalID);
    } 
    this.on('change', this.setUnsavedChanges); 
    this.on('destroy', this.stopPeriodicSaving);
  },

  stopPeriodicSaving: function() {
    console.log('stopping scheduled saving at the model level');
    clearInterval(this.currentSaveIntervalID);
    this.currentSaveIntervalID = null;
  },

  hasUnsavedChanges: function() {
    return !!this._unsavedChanges;
  },

  setUnsavedChanges: function() {
    if (this._unsavedChanges != true) { this.trigger('save_status_change') };
    this._unsavedChanges = true;
  },

  clearUnsavedChanges: function() {
    if (this._unsavedChanges != false) { this.trigger('save_status_change') };
    this._unsavedChanges = false;
  },

  suggestSaveIfChanged: function() {
    console.log("in suggestSaveIfChanged; this._unsavedChanges= "+ this._unsavedChanges);
    if (this.hasUnsavedChanges()) {
      console.log("Suggesting Xelements Save on:");
      console.log(this);
      this.trigger('ModelSaysSave');
    };
  }

});

Dynamo.ReadOnlyModel = Dynamo.Model.extend({
  codeName: 'read_only',
  prettyName: 'Read-Only Model',

  sync: ReadOnlySync

});



Dynamo.User = Dynamo.Model.extend({

  codeName: 'user',
  prettyName: 'User',

  idAttribute: "guid",

  initialize: function() {
    return _.bindAll(this);
  },

  defaults: {
    username: "guest_user",
    created_at: new Date(),
    group_id: "DEFAULT_GROUP_GUID"
  },
  
  urlRoot: function() { return Dynamo.TriremeURL+'/users' },

});


//This is not directly a model, but is instead a base object to mix into each
//Xelement Class that might exist.
Dynamo.XelementRoot = {

  codeName: 'xelement',
  prettyName: 'Xelement',
  idAttribute: 'guid',


  defaultsFor: function(xelement_type) {
    var defaults = {},
    types = XELEMENT_BASE.get(xelement_type)["1"].content_types,
    defaults_as_strings = XELEMENT_BASE.get(xelement_type)["1"].default_values;
    _.each(types, function(type_value, attribute_key) {
        defaults[attribute_key] = stringToXelementType(type_value, defaults_as_strings[attribute_key]);
    });
    return {
      title: "new "+xelement_type,
      xelement_type: xelement_type,
      xel_data_types: types,
      xel_data_values: defaults
    };
  },

  metacontent: function() {

    return this.get_field_value('metacontent_external');

  },
  
  // url: function() { return Dynamo.TriremeURL+'/xelements' },
  urlRoot: function() {
    return Dynamo.TriremeURL+'/xelements' 
  }

};


Dynamo.UnitaryXelement = Dynamo.SaveableModel.extend( _.extend({}, Dynamo.XelementRoot, {

  codeName: 'unitary_xelement',
  prettyName: 'Xelement',

  initAsXelement: function() {
    this.stringifyAllValues();
    this.initializeAsSaveable();
  },

  get_field_type: function(attribute) {
    var field_types = this.get('xel_data_types');
    return field_types[attribute];
  },

  get_field_value: function(attribute) {
    var value, field_values = this.get('xel_data_values');
    switch ( this.get_field_type(attribute) ) {
      case "array":
        value = JSONparseNested(field_values[attribute]);
        break; 
      case "json":
        value = convertFalses(JSONparseNested(field_values[attribute]));
        break;
      default:
        value = field_values[attribute];
    };    
    return value;
  },

  set_field_value: function(attribute, new_value) {
    var field_values = this.get('xel_data_values');
    switch ( this.get_field_type(attribute) ) {
      case "array":
      case "json":
        if (_.isString(new_value)) {
          field_values[attribute] = new_value;
        } 
        else {
          field_values[attribute] = JSON.stringify(new_value);
        };
        break;
      default:
        field_values[attribute] = new_value;
    };      
    this.trigger('change');
    this.trigger('change:xel_data_values');
    this.trigger('change:xel_data_values:'+attribute);
    return this;
  },

  stringifyAllValues: function() {
    var self = this;
    _.each(this.get('xel_data_values'), function(value, key) {
      self.set_field_value(key, value);
    });
  }

}));


// A client-side Xelement is NOT saveable!
// From the perspective of a Unitary Xelement, 
// a ClientSide Xelement's attributes are those that 
// comprise the xel_data_values key in a UnitaryXelement
Dynamo.ValuesOnlyXelement = Dynamo.ReadOnlyModel.extend( _.extend({}, Dynamo.XelementRoot, {

  codeName: 'values_only_xelement',
  prettyName: 'Xelement',

  idAttribute: 'guid',
  urlRoot: Dynamo.TriremeURL+'/xelements',
  converted_atts: [
      "active_membership", 
      "authorization_rule_guids_list", 
      "data_collections", 
      "metacontent_external", 
      "methods"
  ],
  removed_atts: [
    "metacontent_internal", 
    "required_xelement_ids" 
  ],
  sync: ReadOnlySync,

  initAsXelement: function() {},

  defaultsFor: function(xelement_type) {
    switch (xelement_type) {
      case "question_group":
        return {
          active_membership: [],
          authorization_rule_guids_list: [],
          content: "",
          content_description: "Question Group Default Description",
          created_at: (new Date()),
          data_collections: [],
          days_in_treatment: null,
          is_presentational: true,
          is_standalone: true,
          metacontent_external: {
            metadata: {},
            questions: [],
            
          },
          methods: {},
          produces_instantiated_data: false,
          replace_remote_version: false,
          title: "new question",
          transmittable_to_client_at: (new Date()),
          version_id: null,
          views: {},
          xelement_type: "question"
        }; 
        break;    
      case "question":
        return {
          active_membership: [],
          authorization_rule_guids_list: [],
          content: "",
          content_description: "Provides question functionality.",
          created_at: (new Date()),
          data_collections: [],
          days_in_treatment: null,
          is_presentational: true,
          is_standalone: true,
          metacontent_external: {
            metaContent: {},
            responseGroup: []
          },
          methods: {},
          produces_instantiated_data: false,
          replace_remote_version: false,
          title: "new question",
          transmittable_to_client_at: (new Date()),
          version_id: null,
          views: {},
          xelement_type: "question"
        };
        break;
      default:
        throw new Error("ValuesOnlyXelement.defaultsFor: No defaults specified");
    };
  },

  get_field_type: function(attribute) {
    throw new Error("For the moment, we can't do this!!");
  },

  get_field_value: function(attribute) {
    return this.get(attribute);
  },  

  set_field_value: function(attribute, new_value) {
    return this.set(attribute, new_value); 
  },

  parseBeforeLocalSave: function(resp) {
    return this.parse(resp);
  },
  parse: function(resp) {
    var self = this;
    console.log("In ValuesOnlyXelement.parse", resp);
    if ( !_.isObject(resp) ) {
      throw new Error("ValuesOnlyXelement.parse: Unexpected response from server.");
    };
    if ( resp.xel_data_values ) {
      var atts = {};
      
      atts.guid = resp.guid;

      _.each(resp.xel_data_values,  function(value, key) { //each function
        if ( _.indexOf(self.removed_atts, key) === -1 ) {

          if ( _.indexOf(self.converted_atts, key) !== -1 ) {
            atts[key] = convertFalses( JSONparseNested( value ) );
          } else {
            atts[key] = value;
          };

        };
      });

      console.log("returning atts: ", atts);
      return atts;
    }
    else {
      console.log("returning original response");
      return resp; 
    };
  }

}));


//Data
//modified from Data class in Backhand.js
//expects: 
//- an xelement_id // 
//- a user_id //
//- a group_id
Dynamo.Data = Dynamo.SaveableModel.extend({

  codeName: 'data',
  prettyName: 'Data',
  idAttribute: "instance_id",

  initialize: function() {
    _.bindAll(this);

    if (this.collection) {
      var c = this.collection;
      if ( !this.get('xelement_id')   ) { this.set('xelement_id',   c.xelement_id)  };
      if ( !this.get('user_id')       ) { this.set('user_id',       c.user_id)      };
      if ( !this.get('group_id')      ) { this.set('group_id',      c.group_id)     }; 
    };

    this.initializeAsSaveable();

    return true;
  },

  defaults: function() {
    return {
      names: [],
      datatypes: [],
      values: [],
      created_at: (new Date()).toString()
    };
  },

  // get_fields
  // Returns all of the data's fields as an array of 3-element arrays,
  // Each element array being the name, type and value of a field:
  // [ [field_1_name, field_1_type, field_1_value], [field_2_name, field_2_type, field_2_value], ...]
  get_fields: function() {
    return _.zip(this.get('names'), this.get('datatypes'), this.get('values'));
  },

  // get_field
  // Finds a data's field by name and returns it's type and value as a 2-element an array.
  // If not found, returns an array of [ undefined, undefined ] 
  get_field: function(name) {
    var i = _.indexOf(this.get('names'), name);
    if ( i == -1 ) { return [ void 0, void 0 ] };
    var datatypes = this.get('datatypes'),
        values = this.get('values');
    return [ datatypes[i], values[i] ];
  },

  // get_field_type
  // Finds a data's field by name and returns it's type
  // If not found, returns undefined
  get_field_type: function(name) {
    var i = _.indexOf(this.get('names'), name);
    if ( i == -1 ) { return void 0 };
    var datatypes = this.get('datatypes');
    return datatypes[i];
  },  

  // get_field_value
  // Finds a data's field by name and returns it's value
  // If not found, returns undefined
  get_field_value: function(name) {
    var i = _.indexOf(this.get('names'), name);
    if ( i == -1 ) { return void 0 };
    var values = this.get('values');
    return values[i];
  },

  // remove_field
  // Removes a field from Data and returns it;
  // Returns false if the field was not found
  remove_field: function(name) {
    var removed = [],
        names = this.get('names'), 
        datatypes = this.get('datatypes'), 
        values = this.get('values'),
        i = _.indexOf(names, name);
    
    if ( i == -1 ) { return false };
    
    //Splice out an array value:
    _.each([names, datatypes, values], function(a, index) {
      removed[index] = a.splice(i, 1);
    });

    return removed;
  },

  // set_field
  // Mimicks the behavior of Backbone's "model.set" for a data field.
  // If the model has a validate method, it will be validated before 
  // the attributes are set; No changes will occur if the validation fails, 
  // and set will return false. 
  // Otherwise, set returns a reference to the model.
  set_field: function(name, type, value) {
    var names = this.get('names'), 
        datatypes = this.get('datatypes'), 
        values = this.get('values'),
        field_index = _.indexOf(names, name);

    if ( field_index == -1 ) { 
      names.push(name);
      datatypes.push(type);
      values.push(value);
      return this.set({ 'names': names, 'datatypes': datatypes, 'values': values } );
    };

    datatypes[field_index] = type;
    values[field_index] = value;
    return this.set({'datatypes': datatypes, 'values': values } );
  },

  //  The URL to which this data should post.
  urlRoot: function() {
    return  Dynamo.TriremeURL + 
            "/data/groups/" + this.get('group_id') + 
            "/users/" + this.get('user_id') + 
            "/xelements/" + this.get('xelement_id');
  }

});


// Same as Data, but doesn't save to a server.
Dynamo.TempData = Dynamo.Data.extend({
  codeName: 'temp_data',
  prettyName: 'Data',

  sync: PseudoSync
  
});


Dynamo.typeToModelClass = function(xelement_type) {
  switch(xelement_type) {
    case 'question_group':
      return Dynamo.QuestionGroupModel;
      break;
    case 'question':
      return Dynamo.QuestionModel;
      break;
    default:
      throw "undefined class for xelement_type '"+xelement_type+"'";
  };
}