//  
//  
//  Dynamo.Core.Views.js
// 
// 
//  Dependencies:
//    - Dynamo.Core.js
//    - Dynamo.Core.Models.js


//
// A Global templates object is initialized.
// Each view in the file depends upon a specific key
// w/in this object being defined, but the way in which 
// that is done is left up to the user.
// 
// For example, 
// The question editor currently does this in a 2 step process:
// 1) the templates are injected into the index file as script blocks
// through the CMS and,
// 2) These script blocks are then reads them into the templates object as strings
// through JQUERY 
//
templates = {};


//  
//  
//  InputViews
//  
//  These views provide a way of displaying a particular type of individual form input,
//  or a more complex input such as a set of radio boxes / check boxes, or  a jquery slider, etc.
//  They then allow the updated value to be tied back to a model attribute.
//  On instantiation, two methods should be passed to an input view as the getter and setter of the
//  attribute to which they belong. these methods should be called 'getValue' and 'setValue'
//  Requirements:
//    Instances
//    Classes:
//      - viewClassName: All InputView classes must have their class name specified as a class property.
//          this aids in the abstraction away from any one particular type of input when viewing a question.
//          
//      - optionsAttributes: InputViews can specify a set of attributes
//          needed in order for the InputView to function correctly.
//          These are the attributes that need to be a key-value
//          pair in a response model's attributes if the response model
//          is to render correctly using the InputView.
//          
//      - canHaveResponseValues: A boolean specifying whether this InputView can (must?) accept
//          a discrete set of values as its reply.
//    
//    

// Dynamo.TextInputView
//  A general purpose way to create a text input
//  form field (whether single line or area) 
//  whose value is tied to some Model attribute.
//  As part of its options, it expects:
//    a getter method - to get what the value of the text input should be on render
//    a setter method - called whenever there is a 'new value' event generated from the view. 
//    updateOn - if set to 'keyup', it will call the setter method after each character typed.  
//               By default, the setter method is only the text-field's 'change' event
Dynamo.TextInputView = Backbone.View.extend(
  //
  //instance properties
  //
  {
    tagName: 'div',
    attributes: {
      width: 'inherit',
      overflow: 'visible'
    },
    initialize: function() {
      _.bindAll(this);
      this.cid = _.uniqueId('TextInputView-');
      this.keyup_count = 0;
      this.updateOn = this.options.updateOn || 'change';
      this.closeOn  = this.options.closeOn;
      this.getValue = this.options.getValue;
      this.setValue = this.options.setValue;
    },
    formType: function() {
      if (!this._field_type) {
        switch(this.options.responseType) {
          case "area":      
          case "textarea":  case "text-area":   case "text_area":
          case "textbox":   case "text-box":    case "text_box":
          case "multiline": case "multi-line":  case "multi_line":
            this._field_type = "textarea";
            break;
          case "line":  
          case (void 0):      case '':            case null: 
          case "textfield":   case "text-field":  case "text_field": 
          case "textline":    case "text-line":   case "text_line":
          case "text":
            this._field_type =  "text";
            break;
          default:
            throw 'unhandled field_type "'+this.options.field_type+'"';
        };
      };
      return this._field_type
    },
    events: function() {
      var e = { 
            "change textarea" : "setAttribute",
            "change input"    : "setAttribute",
            "keypress input"     : "resizeTextInput",
            "click button.close" : "remove"
      };
      switch(this.updateOn) {
        case 'key':
        case 'keyup':
        case 'keypress':
          e["keyup input"] = "setAttribute";
          e["keyup textarea"] = "setAttribute";
        break;
      };
      switch(this.closeOn) {
        case 'blur':
          e["blur textarea"] = "remove";
          e["blur input"] = "remove";
          break;
      };      
      return e;
    },
    setAttribute: function(change_event) {
      console.log('in TextInputView-setAttribute' );
      this.setValue($(change_event.currentTarget).val());
    },
    resizeTextInput: function(e) {
      var $input = $(e.currentTarget);
          $input.attr('size', _.min([255, ($input.val().length+2)]));
    },
    render: function () {
      var self = this, 
          html,
          tagAtts = { 
            value:  this.getValue()
          };
          if (this.getValue()) {
            tagAtts['size'] = this.getValue().length + 2;  
          };
      if (this.options.borderless) { tagAtts['style'] = 'border:0;'; };
      html = t.formInput(this.formType(), self.options.label, tagAtts);
      this.$el.html( html );
      return this;
    }
  }, 
  //
  //Class Properties
  // 
  {
    viewClassName: "TextInputView",
    optionsAttributes: ["label", "responseType"],
    editableOptionsAttributes: ["label"],
    canHaveResponseValues: false
  }
);

// Dynamo.InputGroupView
//  Displays a button group tied to a model attribute.
//  Required:
//    responseType: 'radio', 'checkbox', or 'select'; determines what type
//  The value of the model attribute is set upon each change in selection.
Dynamo.InputGroupView = Backbone.View.extend(
  {
    initialize: function() {
      _.bindAll(this);
      this.cid = _.uniqueId('InputGroupView-');
      this.getValue = this.options.getValue;
      this.setValue = this.options.setValue;
      this.groupType = this.options.responseType;
      this.groupOptions = this.options.responseValues || [{value: "value-1", label: "label-1" },{value: "value-2", label: "label-2" }]
      // DO NOT BIND A MODEL CHANGE TO RENDER b/c change is reflected by the field changing by default in html anyway.
    },
    events: {
      "click div.label_and_input" : "setInput",
      "change select"             : "setAttribute",
      "change input"              : "setAttribute"
    },
    setAttribute: function (event) {
      console.log('in Dynamo.InputGroupView-setAttribute cid:'+this.cid);
      this.setValue($(event.currentTarget).val());
    },
    setInput: function(event) {
      var $i = $('input', event.currentTarget);
      $i.attr( 'checked', !$i.is(':checked') );
      this.setValue( $i.val() );
      this.$el.find('div.label_and_input').removeClass('hasSelectedInput');
      this.$el.find('div.label_and_input:has(input:checked)').addClass('hasSelectedInput');
    },
    template: function(data, settings) {
      if (!this._template) { this._template = templates.form_group; };
      return _.template(this._template, data, settings)
    },
    render: function () {
      var self = this;
      this.$el.html( this.template({
        id: self.cid,
        name: (self.options.name || (self.groupType+'-group_'+self.cid)),
        label: (self.options.label || ''),
        selected_value: (self.getValue() || ''),
        type: self.groupType,
        options: self.groupOptions
      }) );
      return this;
    }
  }, 
  //
  //Class Properties
  // 
  {
    viewClassName: "InputGroupView",
    optionsAttributes: ["label", "responseType", "responseValues"],
    editableOptionsAttributes: ["label"],
    canHaveResponseValues: true
  }
);

// Dynamo.InputSliderView
//  Displays a jquery slider tied to a model attribute.
//  Required options:
//    low_end_text,
//    high_end_text,
//    initial_value,
//    min_value,
//    max_value,
//    step
//  The value of the model attribute is set upon 
//  each change in the value of the slider.
Dynamo.InputSliderView = Backbone.View.extend(
  {
    initialize: function() {
      _.bindAll(this);
      this.cid = _.uniqueId('InputSliderView-');
      this.getValue = this.options.getValue;
      this.setValue = this.options.setValue;

      this.initial_value = parseInt((this.options.initial_value || this.options.min_value || 0));
      this.min_value = parseInt(this.options.min_value || 0);
      this.max_value = parseInt(this.options.max_value || 100);
      this.step = parseInt(this.options.step || 1);
      
      // DO NOT BIND A MODEL CHANGE TO RENDER 
      // b/c change is reflected naturally by slider movement.
    },
    setAttribute: function (ui_value) {
      console.log('in Dynamo.InputSliderView-setAttribute cid:'+this.cid);
      this.setValue(ui_value);
      this.$el.find('div.current_value:first').html( ui_value );
    },
    render: function () {
      var self = this, $slider;
      this.$el.html(
        "<div class='current_value' style='width:30%; height:34px; min-height:34px; margin:0 auto; text-align:center; font-size:1.5em; color:black;'>"+
          self.initial_value + 
        "</div>" +
          "<div id='endpoints' style='width:80%;margin-left:10%;margin-right:10%;font-size:0.9em; font-weight:bold;overflow:auto;'>" +
            "<div class='end_right' style='float:left;'>"+ this.options.low_end_text +"</div>" +
            "<div class='end_left' style='float:right;'>"+ this.options.high_end_text +"</div>" +
          "</div>" +
        "<div class='slider' style='width:80%;margin-left:10%;margin-right:10%; margin-top:2em; height:60px;'></div>" +
        "<div style='height:10px;'></div>");
      //make the slider;
      $slider = this.$el.find("div.slider:first");
      $slider.slider({
        value: self.initial_value,
        min: self.min_value,
        max: self.max_value,
        step: self.step,
        slide: function( event, ui ) {
          self.setAttribute(ui.value) 
        }
      });
      $(this.el).find('.ui-slider-handle').height(70);
      $(this.el).find('h2').css('font-size', "1.8em");

      //add touch support on pads and phones.
      _.isFunction( $slider.addTouch ) ? $slider.addTouch() : undefined;
      
      return this;
    }
  }, 
  //
  //Class Properties
  // 
  {
    viewClassName: "InputSliderView",

    optionsAttributes: [
      "low_end_text", 
      "high_end_text", 
      "initial_value", 
      "min_value", 
      "max_value"
    ],
    editableOptionsAttributes: [
      "low_end_text", 
      "high_end_text", 
      "initial_value", 
      "min_value", 
      "max_value"
    ],    

    canHaveResponseValues: false
  }
);


//
//
// Aspect Views
// 
// These views abstract away a particular type of commonality across any possible
// collection or model.
// e.g. the 'ChooseFromCollectionView' is a user interface
// that lets the user select one model out of a collection, 
// regardless of what is contained within the collection
//
//

//  Dynamo.ChooseFromCollectionView
//  expects:
//    - A Dynamo collection of Xelements
//  description:
//    In many circumstances w/in the UI, it may be necessary to select one model from a collection of models.
//    pass this view a collection of models, and it will trigger on itself a backbone event ('element:chosen')
//    when the user clicks on a particular model w/in the collection.  The chosen model will be available from 
//    this.chosen_element
//    
//  options:
//    - onChoose: callback function (passed the click event) that runs when a user selects an xelement.
//      Default behavior sets this.chosen_element to the chosen model and triggers an 'element:chosen'
//      event on the view.
//    - chooseOn: the attribute of the xelement that should be displayed for the user to choose from. 
//      Defaults to 'title'
//    - modelHTML: function that returns what HTML should be displayed for an element. Defaults to
//      a span containing the value of the xelement's 'chooseOn' attribute.
Dynamo.ChooseOneXelementFromCollectionView = Backbone.View.extend({
  initialize: function() {
    _.bindAll(this);
    this.chooseOn = (this.options.chooseOn ? this.options.chooseOn : 'title');
    if (this.options.onChoose) { this.chooseXelement = this.options.onChoose };
    if (this.options.modelHTML) { this.modelHTML = this.options.modelHTML };
  },
  events: {
    "click button.create_new" : "createNewXelement",
    "click span.choose_element" : "chooseXelement" 
  },
  createNewXelement: function(clickEvent) {
    var mantleClass = Dynamo.typeToModelClass(clickEvent.currentTarget.dataset.xelement_type);
    this.chosen_element = new mantleClass();
    this.trigger("element:chosen");
  },
  chooseXelement: function(clickEvent) {
    var current_guid = clickEvent.currentTarget.dataset.guid;
    this.chosen_element = this.collection.get(current_guid);
    this.trigger("element:chosen");
  },
  modelHTML: function(m) {
    return t.span( m.get_field_value(this.chooseOn) );
  },
  template: function(data, settings) {
    if (!this._template) { this._template = templates.choose_one_xelement };
    return _.template(this._template, data, settings)
  },
  render: function() {
    var self = this;
    var elements = this.collection.map(function(m) { return { id: m.id, html: self.modelHTML(m) }  });
    this.$el.html( 
      this.template({ 
        collection_name: (this.options.collection_name || this.collection.prettyModelName()), 
        elements: elements,

        canCreateNew: this.options.canCreateNew,
        xelement_type: this.options.xelement_type,
        element_pretty_name: this.options.element_pretty_name
      }) 
    );
    return this;
  }
})

// Dynamo.SaveableModelView
//  Any View which has models or data that the user can save
//  can inherit from this view which provides a set of functions 
//  related to viewing the current save state,
//  or setting up periodic saving and triggering a save
Dynamo.SaveableModelView = Backbone.View.extend({
  initializeAsSaveable: function(saveableModel) {
    this.saveableModel = saveableModel;
    this.saveableModel.initializeAsSaveable();
    this.saveableModel.on('save_status_change', this.renderSaveStatus);
    this.on('saveable:save_now', this.saveSaveableModel);
  },

  saveableEvents: {
      'focusin'  : "setUserBusy",
      'focusout' : "clearUserBusy"
  },

  // Assumes you have an elment in the view like so:
  // <[some_tag: div, span, etc?] class='save_status'></[some_tag]>
  renderSaveStatus: function() {
    this.$el.find('.save_status:first').removeClass(this.saveableModel.saveStates.join(' '));
    this.$el.find('.save_status:first').addClass(this.saveableModel.currentSaveState());
    this.$el.find('.save_status:first').html(this.saveableModel.currentSaveText());      
  },

  saveSaveableModel: function() {
    this.saveableModel.save();
  },  

  saveifUserNotBusy: function () {
    if ( !this.isUserBusy() ) { this.trigger('saveable:save_now') };
  },

  // saving / recurrent-saving functions
  startPeriodicModelSaving: function(interval_in_seconds) {
    if (!interval_in_seconds) { throw new Error("startPeriodicModelSaving() interval_in_seconds cannot be "+interval_in_seconds) }
    console.log("in startPeriodicModelSaving in view");
    if (!this._modelSavingActive) {
      console.log("currently model saving NOT Active");
      this.saveableModel.startPeriodicSaving(interval_in_seconds);
      this.on('remove', this.stopPeriodicModelSaving);
      this._modelSavingActive = true;
      console.log("Xel may suggest save at most every "+interval_in_seconds+" seconds.");
    }
  },

  stopPeriodicModelSaving: function() {
    console.log("in stopPeriodicModelSaving in view");
    this.saveableModel.stopPeriodicSaving();
    this._modelSavingActive = false;
  },

  // along with the saveableEvents hash defined above, 
  // set a view property which answers the question:
  // "is the user focused on this view right now?"
  clearUserBusy: function () {
    this._userBusy = false;
  },

  isUserBusy: function () {
    return this._userBusy
  },

  setUserBusy: function () {
    this._userBusy = true;
  }

});


Dynamo.BaseUnitaryXelementView = Dynamo.SaveableModelView.extend({
  
  editTextFieldInPopup: function(field, click_event) {

    var self = this,
        popupView,
        $clicked_on = $(click_event.currentTarget);

    popupView = new Dynamo.TextInputView({
      responseType: 'line',
      updateOn: 'keypress',
      closeOn: 'blur',
      label: '',
      getValue: function() {
        return self.model.get_field_value(field);
      },
      setValue: function(new_value) {
        return self.model.set_field_value(field, new_value);
      }
    });

    $clicked_on.after(popupView.$el);
    popupView.render();

  },

  initializeAsUnitaryXelement: function() {
    // Adds methods related to saving
    this.initializeAsSaveable(this.model);
  },

  // initial_render convenience tracker functions
  initiallyRendered: function() { return (!!this._initialRender); },
  setInitialRender: function() { this._initialRender = true; },
  clearInitialRender: function() { this._initialRender = false; },
  completeRender: function() {
    this.clearInitialRender();
    this.render();
  }

});


//Dynamo.ManageCollectionView (mcw)
//
//On instantiation, mcw expects :
//
//1) a collection
//2) that all models in the collection each have:
//   - a 'viewClass' attribute which returns a Backbone View Class
//   - an 'editViewClass' attribute which returns a Backbone View Class
//
//3) That both of those View Classes can be instantiated w/the model
//   to which they belong and nothing else.
//
//4) Those View Classes are also passed an option,
// 	 'position' which is their index in the collection.
//
//options:
//  - addAtIndexHandler: callback function, passed the click event as an argument, 
//    responsible for handling the addition of a model to the collection at the appropriate index.
//    the index is available as clickEvent.srcElement.
//    Default behavior is to called when one of the
Dynamo.ManageCollectionView = Backbone.View.extend({

  initialize: function() {
    _.bindAll(this);
    this.start_content = this.options.start_content || '';
    this.end_content = this.options.end_content || '';
    this.display = this.options.display || { show: true };
    if (this.options.insertAtIndex) { this.insertAtIndex = this.options.insertAtIndex };
    this.collection.on("reset", this.render);
    this.collection.on("add", this.render);
    this.collection.on("remove", this.render);
  },

  events: function() {
    var self = this, e ={};
    e[("click button.insert."+self.collection.codeModelName())] = "insertAtIndex";
    e[("click button.delete."+self.collection.codeModelName())] = "removeElement";
    return e;
  },

  //Default implementation of insertAtIndex; can be overridden 
  //by passing in an insertAtIndex method as an option.
  insertAtIndex: function(clickEvent) {
    var element_index = clickEvent.currentTarget.dataset.collection_index; 
    console.log('insert: '+ this.collection.prettyModelName()+' - at location: '+ element_index);
    this.collection.add({}, {at: element_index});
  },

  removeElement: function(clickEvent) {
    var element_index = clickEvent.currentTarget.dataset.collection_index;
    console.log('removing: '+ this.collection.prettyModelName()+' - at location: '+ element_index);
    this.collection.remove(this.collection.at(element_index));
  },

  template: function(data, settings) {
    if (!this._template) {
      this._template = templates.manage_collection_widget;
    }
    return _.template(this._template, data, settings);
  },

  elementTemplate: function(data, settings) {
    if (!this._elementTemplate) {
      this._elementTemplate = templates.collection_widget_element;
    }
    return _.template(this._elementTemplate, data, settings);
  },

  render: function() {
    var self = this, 
        $elements, 
        root_element, 
        view_class, 
        view;
    
    this.$el.html(this.template({
      start_content: this.start_content,
      element_code_name: this.collection.codeModelName(),
      element_pretty_name: this.collection.prettyModelName(),
      display: this.display,
      num_elements: self.collection.length,
      end_content: this.end_content
    }));

    $elements = self.$el.find('div.collection_widget:first > div.elements:first');

    self.collection.each(function(model, index) {

      $elements.append( 
        self.elementTemplate({
          index: index,
          display: self.display,
          element_code_name: self.collection.codeModelName(),
          element_pretty_name: self.collection.prettyModelName()
        })
      );

      root_element = $elements.children('div.element').last();
      
      if (self.display.edit) {
        view_class = model.editViewClass();
        view = new view_class({el: root_element.find("div.edit_container:first"), model: model, position: (index+1) });
        view.render();
      };
    
      if (self.display.show) {
        view_class = model.viewClass();
        view = new view_class({el: root_element.find("div.show_container:first"), model: model, position: (index+1) });
        view.render();
      };

    });

    return this;
  }

});



// ************************************************
// 
// View Helper Vars and Functions
// 
// ************************************************
// 


// Select the appropriate view class for a for a particular type of form input
function viewClassForInputType(input_type) {
  var self = this
  switch( input_type ) {
    case "text": case "textarea":
      return Dynamo.TextInputView;
      break;
    case "radio": case "select": case "checkbox":
      return Dynamo.InputGroupView;
      break;
    case "slide": case "slider":
      return Dynamo.InputSliderView;
      break;
    default:
      throw "viewClassForInputType: No view class defined for input_type '"+input_type+"'";
      break;
  };
}; 