// Dynamo.Mantle.Questions.Views.js
// Before this Dynamo Mantle File can be used, the following must be defined:
// Nothing?
// --implicitly depends on Dynamo.Mantle.Questions


QuestionGroupView = Dynamo.BaseUnitaryXelementView.extend({
  initialize: function (argument) {
    
    _.bindAll(this);
    this.initializeAsUnitaryXelement();
    this.displayShow = !!this.options.displayShow;
    this.displayEdit = !!this.options.displayEdit;
    this.model.on('change', this.render);
    this.model.on('sync', this.completeRender);
    this.initializeAsSaveable(this.model);

    // Set the Question Group as having unsaved changes 
    // when a question changes.
    // Currently, this makes sense b/c the view provides 1
    // save button to the user for saving the entire question group.
    // If any question is altered, then it qualifies as a save status
    // change event on the questionGroup even though 
    // no data at the question-group level.
    // Perhaps something to optimize later.
    this.model.questions.on('change', this.setUnsavedChanges);

  },

  attributes: function() {
    return {
      id: "question_group-"+this.model.cid,
      class: "question_group"
    }
  },

  chooseQuestionPopup: function(element_index) {

    var self = this, $popup;
    
    // Initialize what is to be a popup.
    if ( $('div#popup_container').length == 0 ) { $('body').append('<div id="popup_container"><div>') };
    $popup = $('div#popup_container');

    // Allow the user to choose a Question Group view
    self.chooseQuestionGroupView = new Dynamo.ChooseOneXelementFromCollectionView({

      canCreateNew: false,
      xelement_type: null,
      element_pretty_name: null,
      
      collection_name: "Assessments",
      collection: QUESTION_GROUPS

    });
    
    //Show the dialog
    $popup.empty();

    $popup.wijdialog({
      autoOpen: true,
      modal: true,
      width: ($(window).width()*.8),
      height: ($(window).height()*.8),

      title: "Add a Question (in position " + (element_index+1)+")",

      captionButtons: {
              pin:      { visible: false },
              refresh:  { visible: false },
              toggle:   { visible: false },
              minimize: { visible: false },
              maximize: { visible: false },
              close:    { visible: true }
      },

      close: function (beforeCloseEvent) { 
        //Attempt to cleanup / avoid mem leaks.
        if (self.chooseQuestionView)      { self.chooseQuestionView.remove()      };
        if (self.chooseQuestionGroupView) { self.chooseQuestionGroupView.remove() };
        self.chooseQuestionView = null;
        self.chooseQuestionGroupView = null;
        $chooseQcontainer = null;
        $popup = null;
      }

    });

    $popup.append( self.chooseQuestionGroupView.$el );
    self.chooseQuestionGroupView.render();

    // Once the user picks a Question Group, 
    // show the questions in that Question Group, 
    // so that the user can pick a question.
    var $chooseQcontainer;
    self.chooseQuestionGroupView.on('element:chosen', function() {
      
      self.chooseQuestionView = new Dynamo.ChooseOneXelementFromCollectionView({

        canCreateNew: false,
        xelement_type: null,
        element_pretty_name: null,
        
        collection_name: (self.chooseQuestionGroupView.chosen_element.get_field_value('title') + " Questions"),
        collection: self.chooseQuestionGroupView.chosen_element.questions

      });

      if ( $popup.find('div#choose_question').length == 0 ) { //jQuery version of false

        $popup.append('<div id="choose_question"><div>');

      };

      $chooseQcontainer = $popup.find('div#choose_question');

      $chooseQcontainer.empty();
      $chooseQcontainer.append( self.chooseQuestionView.$el );
      self.chooseQuestionView.render();
      
      self.chooseQuestionView.on('element:chosen', function() {

        // Once the user picks a question, add it to this question group :)
        console.log('Inserting Question at location: '+ element_index);
        self.model.questions.add(self.chooseQuestionView.chosen_element, {at: element_index});
        $popup.wijdialog('close');

      });
      
    });      

  },

  addAtIndexDialog: function(clickEvent) {
    //  When someone clicks 'New Question' on the instantiation of the
    //  ManageCollectionView that applies for questions w/in a QuestionGroup,
    //  They need the choice to create an entirely new question, 
    //  or to select an existing question.
    //  This is the popup dialog that handles that selection of first an existing question group,
    //  and then an existing question.

    var self = this, 
        $btn_clicked = $(clickEvent.currentTarget), 
        // Fetch the current index at which we want to insert a question.
        element_index = parseInt($btn_clicked.attr("data-collection_index"));

    $btn_clicked.after(""+
      "<div class='add_dialog'>"+
        "<button class='add_new'>New</button>" +
        "<button class='add_existing'>Existing</button>"
      +"</div>");

    $add_dlg = $btn_clicked.parent().find("div.add_dialog");

    $add_dlg.find("button.add_new").click(function() {
      // Once the user picks a question, add it to this question group :)
      console.log('Inserting Question at location: '+ element_index);
      self.model.questions.add({}, {at: element_index});
      //cleanup
      $add_dlg.remove();
      $add_dlg = null;
    });

    $add_dlg.find("button.add_existing").click(function() {
      self.chooseQuestionPopup(element_index);
      //cleanup
      $add_dlg.remove();
      $add_dlg = null;
    });      

  },

  editTitleInPopup: function(click_event) {
    this.editTextFieldInPopup('title', click_event);
  },

  events: function() {
    switch(this.displayEdit) {
      case true:
        return {
          'click h1 > span.title.editable': "editTitleInPopup",
          'click button.btn.save': "saveSaveableModel"       
        };
        break;
      default:
        return {}
    };
  },

  template: function(data, settings) {
    if (!this._template) {
      if (this.displayEdit) {
        this._template = templates.edit_question_group;
      }
      else {
        this._template = templates.show_question_group;
      };
    };
    return _.template(this._template, data, settings);
  },

  initialRender: function (argument) {
    var self = this, view;
    this.$el.html( this.template({
        title: this.model.get_field_value('title'),
        directions: this.model.metadata.toJSON().directions,
        current_save_state: this.model.currentSaveState(),
        current_save_text: this.model.currentSaveText(),
        metadata: this.model.metadata.toJSON()
      }) 
    );

    view = new Dynamo.ManageCollectionView({ 
      collection: this.model.questions, 
      display:{ show: (this.displayShow), edit: (this.displayEdit), del: (this.displayEdit) },
      insertAtIndex: this.addAtIndexDialog 
    });
    this.$el.find('div#questions').append(view.$el);
    
    view.render();
    // this.startPeriodicModelSaving(10);
  },

  render: function (argument) {
    if (!this.initiallyRendered()) {
      console.log('INITIAL QUESTION_GROUP SHOW RENDER');  
      this.initialRender();
      this.setInitialRender();
    } else {
      console.log('QUESTION_GROUP RE-RENDER'); 
      this.renderSaveStatus();
      this.$el.children('h1:first').find('span.title').html(this.model.get_field_value('title'));
      this.$el.find('.metadata').html(this.model.metadata.toJSON());
    };
    return this; 
  }

});

editQuestionView = Dynamo.BaseUnitaryXelementView.extend({
  initialize: function() {
    _.bindAll(this);
    this.cid = _.uniqueId('editQuestionView-');
    this.position = this.options.position;
    this.model.on('change', this.renderSaveStatus);
    this.model.on('change', this.renderTitle);
    this.initializeAsSaveable(this.model);
  },
  editTitleInPopup: function(click_event) {
    this.editTextFieldInPopup('title', click_event);
  },
  events: {
    'click h3 > span.title.editable': "editTitleInPopup"
  },
  template: function(data, settings) {
    if (!this._template) {
      this._template = templates.edit_question;
    }
    return _.template(this._template, data, settings);
  },
  render: function() {
    var self = this,
        element,
        view_class, 
        view;
        
    this.$el.html( this.template({ 
      position: this.position,
      title: this.model.get_field_value('title'),
      current_save_state: this.model.currentSaveState(),
      current_save_text: this.model.currentSaveText()
    }));
    
    element = this.$el.find('div.instructions:first');
    view = new Dynamo.TextInputView({
      el: element,
      form_id: self.cid,
      responseType: 'area',
      updateOn: 'keypress',
      label: 'Instructions',
      getValue: function() {
        return self.model.metaContent.get('instructions');
      },
      setValue: function(new_value) {
        return self.model.metaContent.set('instructions', new_value);
      }
    });
    view.render();

    element = this.$el.find('div.content:first');
    view = new Dynamo.TextInputView({
      el: element,
      form_id: self.cid,
      responseType: 'area',
      updateOn: 'keypress',
      label: 'Content',
      getValue: function() {
        return self.model.get_field_value('content');
      },
      setValue: function(new_value) {
        return self.model.set_field_value('content', new_value);
      }
    });
    view.render();

    view = new Dynamo.ManageCollectionView({
      collection: self.model.responses, 
      display:{ edit: true, del: true },
    });
    self.$el.find('div.responseGroup:first').append(view.$el);
    view.render();
    // this.startPeriodicModelSaving(10);

    return this;
  },
  renderTitle: function() {
    this.$el.children("h3:first").find('span.title').html(this.model.get_field_value('title'));
  }
});

editResponseView = Backbone.View.extend({
  initialize: function() {
    _.bindAll(this);
    this.cid = _.uniqueId('editResponseView-');
    this.form_id = this.options.form_id || this.cid;
    this.model.on('change:responseType', this.render);
  },
  template: function(data, settings) {
    if (!this._template) {
      this._template = templates.edit_response;
    }
    return _.template(this._template, data, settings);
  },
  initialRender: function() {
    var self = this, view_class, view;
    this.$el.html( this.template(this.model.toJSON()) );

    view = new Dynamo.TextInputView({
      el: (this.$el.find('div.name.attribute span.name_value:first')),
      form_id: self.form_id,
      responseType: 'line',
      updateOn: 'keypress',
      label: 'Name of Field',
      getValue: function() {
        return self.model.get('name');
      },
      setValue: function(new_value) {
        return self.model.set('name', new_value);
      }   
    });
    view.render();      
    

    view = new Dynamo.InputGroupView({ 
      el: (this.$el.find('div.attribute.responseType')),
      form_id: self.form_id,
      label: 'responseType',
      getValue: function() {
        return self.model.get('responseType');
      },
      setValue: function(new_value) {
        return self.model.set('responseType', new_value);
      },
      responseType: 'select',
      responseValues: [
                      {label: 'text field',   value: 'text'     },
                      {label: 'text area',    value: 'textarea' },
                      {label: 'radio',        value: 'radio'    }, 
                      {label: 'dropdown box', value: 'select'   }, 
                      {label: 'checkboxes',   value: 'checkbox' }, 
                      {label: 'slider',       value: 'slider' }]
    });
    view.render();
  },
  render: function() {
    var self = this, view_class, view, viewOptionsKeys, 
        $viewClassAttsContainer, $responseValuesContainer;

    if ( !this._initialRender ) {
      self.initialRender();
      this._initialRender = true;
    };
    
    //Fetch the ViewClass for the current type of response:
    view_class = viewClassForInputType( self.model.get('responseType') );

    // Create a TextInputView for each of the
    // user-specifiable and view-specific attributes:
    $viewClassAttsContainer = self.$el.find('div.typeSpecificAttributesContainer:first');
    $viewClassAttsContainer.empty();
    _.each(view_class.editableOptionsAttributes, function(options_attribute) {

        "<div class='name attribute edit'><span class='name_value'></span></div>"

        view = new Dynamo.TextInputView({
          tagName: 'div',
          className: 'attribute edit '+options_attribute,
          form_id: self.cid,
          responseType: 'line',
          updateOn: 'keypress',
          label: options_attribute,
          getValue: function() {
            return self.model.get(options_attribute);
          },
          setValue: function(new_value) {
            return self.model.set(options_attribute, new_value);
          }        
        });
        $viewClassAttsContainer.append(view.$el);
        view.render();

    });

    $responseValuesContainer = self.$el.find('div.responseValuesContainer:first');
    $responseValuesContainer.empty();
    if (view_class.canHaveResponseValues) {

      $responseValuesContainer.append('<h3>Response Values</h3>');

      view = new Dynamo.ManageCollectionView({
        collection: this.model.responseValues, 
        display:{ edit: true, del: true} 
      });

      $responseValuesContainer.append(view.$el);
      view.render();

    };

    return this;
  }
});

editResponseValueView = Backbone.View.extend({
  initialize: function() {
    _.bindAll(this);
  },
  template: function(data, settings) {
    if (!this._template) {
      this._template = templates.edit_response_value;
    }
    return _.template(this._template, data, settings);
  },
  render: function() {
    var self = this, view;

    this.$el.html(this.template(this.model.toJSON()));
    
    view = new Dynamo.TextInputView({
      el: (this.$el.children('span.label:first')),
      form_id: self.options.form_id,
      responseType: 'line',
      updateOn: 'keypress',       
      label: 'Label',
      getValue: function() {
        return self.model.get('label');
      },
      setValue: function(new_value) {
        return self.model.set('label', new_value);
      }
    });
    view.render();

    view = new Dynamo.TextInputView({
      el: (this.$el.children('span.value:first')),
      form_id: self.options.form_id,
      responseType: 'line',
      updateOn: 'keypress',       
      label: 'Value when selected',
      getValue: function() {
        return self.model.get('value');
      },
      setValue: function(new_value) {
        return self.model.set('value', new_value);
      }
    });
    view.render();

    return this;
  }
});


// TakeAssessmentView
// 
// 1) Expects a QuestionGroup as its model.
// 2) Expects a User model to be passed in as the 'responder' option.
// 
// Allows the question group to be viewed and responded to by a user,
// actually storing the data if necessary options are passed in
//  
// lays the groundwork for a Computer Adaptive Testing (CAT) algorithm 
// to be defined in a Question Group's metacontent.
// 
// Defaults to a method which simply shows the next question based upon
// the order of the questions as they are in the Question Group's 'questions' collection.
TakeAssessmentView = Dynamo.SaveableModelView.extend({
  initialize: function() {
    _.bindAll(this);

    //the user taking the assessment:
    this.responder = this.options.responder;

    //Organize questions, laying groundwork for CAT:
    this.maximumNumberOfQuestions = this.model.questions.length
    this.unpresentedQuestions = new QuestionCollection(this.model.questions.models);
    this.presentedQuestions = new QuestionCollection();
    this.numResponsesSaved = null;

    // We will store data both at the whole assessment level
    // and at the individual question level.
    // yes, that means redundant and possibly prone to data inconsistency,
    // but the probability is small enough, and the risk outweighed by future Data Mining needs
    // 'this.userResponseData' model is set and stores the complete assessment's responses
    // and 
    // 'this.questionResponses' collection is set and stores invidiual questions' user responses:
    this.initializeResponseData();
    this.questionResponses.on('add',    this.updateUserResponseData );
    this.questionResponses.on('add',    this.saveSaveableModel);
    this.questionResponses.on('remove', this.updateUserResponseData );
    this.questionResponses.on('remove', this.saveSaveableModel);

    this.initializeAsSaveable(this.userResponseData);

    // Default Starting Values
    this.current_index = 0;
    this.current_question = null;

    //CAT groundwork related:
    //define the function by which we will decide the next question shown;
    //and choose an initial question to be presented.
    //defaults to a function which simply shows the next question.
    this.setSelectNextFunction(); 
    this.addToPresentedQuestions();

    $('select,input,textarea', this.el).live('change', this.saveSaveableModel);
    // setInterval(this.saveIfChanges, 2000);

  },

  initializeResponseData: function() {

    //you can pass in a data object,
    if (this.options.userResponseData) {
      this.userResponseData = this.options.userResponseData;

      this.questionResponses = new DataCollection();
      this.questionResponses.server_url = this.userResponseData.get('server_url');
      this.questionResponses.user_id    = this.responder.id;
      this.questionResponses.group_id   = this.userResponseData.get('group_id');

      return;

    }

    //or pass in sufficient options to define a new data object,
    if ( this.options.server_url && ( this.options.group_id ) ) {
      
      this.userResponseData = new Dynamo.Data ({
        server_url: this.options.server_url,
        xelement_id: this.model.id,
        user_id: this.responder.id,
        group_id: this.options.group_id
      });

      this.questionResponses = new DataCollection(null, { 
        server_url: this.options.server_url,
        user_id: this.responder.id,
        group_id: this.options.group_id
      });

      return;
    };

    //or do neither and not actually store data
    console.warn("TakeAssessmentView: Insufficient options passed to Data actually save data");
    alert("Warning: Entered data is not being saved!");
    
    this.userResponseData = new Dynamo.TempData();
    this.questionResponses = new TempDataCollection();
  },

  addToPresentedQuestions: function() {
    if (this.current_index > this.presentedQuestions.length) {
      throw new Error("current_index should be at equal to the length of presentedQuestions");
    };
    var q, next_q_id;
    if (this.current_index == this.presentedQuestions.length ) {
      next_q_id = this.selectNext(this.model, this.questionResponses.pluck("xelement_id"), this.userResponseData);
      q = this.unpresentedQuestions.get(next_q_id);
      this.unpresentedQuestions.remove(q);
      this.presentedQuestions.add(q);
      this.questionResponses.add({
        xelement_id: q.id
      });      
    };
  },

  attributes: { class: "Assessment" },

  events: {      
    "click div.assessment.navigation button.previous" : "showPrevious",
    "click div.assessment.navigation button.next"     : "showNext",
    "click div.assessment.navigation button.finish"   : "finishAssessment"
  },

  finishAssessment: function() {
    var self = this;
    this.saveSaveableModel(function() {
      self.$el.empty();
      self.trigger('finished');
      self = null; // avoid Mem leak?
    });
  },

  remove: function() {
    this.currentQuestionView.remove();
    this.currentQuestionView = null;
    this.$el.remove();
  },

  saveIfChanges: function() {
    if  ( this.userResponseData.hasUnsavedChanges() || 
          ( this.questionResponses.any(function(qr) { return qr.hasUnsavedChanges() }) ) 
        ) 
      { this.saveSaveableModel(); };
  },

  saveSaveableModel: function(callback) {
    var self = this;
    this.saveResponses(function() { 
      self.updateUserResponseData();
      // Required b/c sometimes callback will be the click event,
      // and in that case, it will cause an error.
      if ( _.isFunction(callback) ) { 
        self.userResponseData.save(null, { success: callback });
      }
      else {
        self.userResponseData.save();
      };
      self = null; // avoid Mem leak?
    });
  },

  onResponseSaved: function(onAllSavedCallback) {
    
    //Once the first response in a set is saved, 
    //must complete saving all responses w/in 10 seconds.
    var nullifyNumResponsesSaved;
    if (this.numResponsesSaved === 0) {
      console.log("AssesmentSaveCycle - onResponseSaved: this.numResponsesSaved === 0 ");
      nullifyNumResponsesSaved = setTimeout(function() { 
        console.log("AssesmentSaveCycle - END onResponseSaved CYCLE - nullifyNumResponsesSaved called ");
        self.numResponsesSaved = null }, 
        10*1000); 
    };
    if ( typeof(this.numResponsesSaved) == "number") {
      console.log("AssesmentSaveCycle - onResponseSaved: numResponsesSaved++ ");
      this.numResponsesSaved++;
    };
    console.log("numResponsesSaved: ", this.numResponsesSaved);
    if (this.numResponsesSaved === this.questionResponses.length) {
      console.log("AssesmentSaveCycle - onResponseSaved: this.numResponsesSaved === this.questionResponses.length ");
      //all responses have been saved, end the save cycle:
      this.numResponsesSaved = null;
      console.log("AssesmentSaveCycle - END onResponseSaved CYCLE - normal end");

      if (nullifyNumResponsesSaved) { 
      
        console.log("AssesmentSaveCycle - onResponseSaved: clearTimeout(nullifyNumResponsesSaved);");
        clearTimeout(nullifyNumResponsesSaved);
        nullifyNumResponsesSaved = null;

      };

      console.log("AssesmentSaveCycle - onResponseSaved: Attempting after-all callback...");
      
      if ( _.isFunction(onAllSavedCallback) ) { 
        try {
          onAllSavedCallback() 
        } catch (error) {
          console.warn("AssesmentSaveCycle - onResponseSaved - ERROR in after-all callback: ", error);
        };
      }
      else {
        console.log("AssesmentSaveCycle - onResponseSaved: after-all callback was not a function");
      };

    };

  },

  saveResponses: function(callback) {
    var self = this;

    //only begin saving all responses 
    //if we're not in the process of doing so already...
    if (self.numResponsesSaved === null) {
      console.log("AssesmentSaveCycle - saveResponses: BEGIN CYCLE ");
      self.numResponsesSaved = 0;
      this.questionResponses.invoke('save', null, { success: function() { self.onResponseSaved(callback); } });
    }
    else {
      console.log("AssesmentSaveCycle - saveResponses: numResponsesSaved !== null ");
    };

  },  

  // sets the value of the view's 'selectNext' attribute to 
  // a function which accepts  of the question to show the user next
  setSelectNextFunction: function() {
    if ( this.model.metadata.get("selectNextFunction") ) {
      this.selectNext = eval(this.model.metadata.get("selectNextFunction")); 
    } 
    else {
      this.selectNext = this.model.defaultSelectNext
    };
  },

  showNext: function() {
    this.current_index++;
    if ( this.current_index < this.maximumNumberOfQuestions ) {
      this.addToPresentedQuestions();
      if ( this.userResponseData.hasUnsavedChanges() ) { this.saveSaveableModel(); };
      return this.render();
    } else {
      this.current_index = this.maximumNumberOfQuestions
      if ( this.userResponseData.hasUnsavedChanges() ) { this.saveSaveableModel(); };
      return this.showFinishDialog();
    };
  },

  showPrevious: function() {
    if (this.current_index > 0) {
      this.current_index--;
      this.initialRender();
      return this.render();
    };
  },

  template: function(data, settings) {
    if (!this._template) {
      this._template = templates.take_assessment;
    }
    return _.template(this._template, data, settings);
  },

  updateUserResponseData: function() {
    var self = this;
    this.questionResponses.each(function (qUserResponse, index) {
      self.userResponseData.set_field( "Question-"+(index+1), "json", qUserResponse.get_fields() );
    });
    // if (_.isFunction(after_callback)) { after_callback() };
  },

  showFinishDialog: function() {
    this.$el.html("" +
      "<div><p>" +
        "This is the end of this Questionnaire." +
      "</p></div>" +
      "<div class='assessment navigation'>" +
        "<button class='previous'>Previous</button>" +
        "<button class='finish'>Finish</button>" +
      "</div>");
  },

  initialRender: function() {
    var self = this;
    this.$el.html(
      this.template({
        title: self.model.get_field_value('title'),
        start_content: null,
        no_navigation: false,
        next_button: { text : false },
        previous_button: { text : false },
        current_save_state: this.userResponseData.currentSaveState(), 
        current_save_text: this.userResponseData.currentSaveText(),
        end_content: null
      })
    );
    this._initialRender = true;
  },

  render: function() {
    var self = this;
    this.current_question = this.presentedQuestions.at(this.current_index);
    this.current_response = this.questionResponses.at(this.current_index);

    this.current_response.on('change', this.updateUserResponseData);
  
    if (!this._initialRender) { this.initialRender() };

    this.currentQuestionView = null; //BSTS: Avoid memory leak (i think) -gs;
    this.currentQuestionView = new showQuestionView({
      model: this.current_question,
      userResponseModel: this.current_response
    });

    this.$el.children('div.question:first').html(this.currentQuestionView.$el);
    this.currentQuestionView.render();

  }

});


//showQuestionView
//On instantiation, this view expects:
//1) a model of class Question from which it renders
//2) an optional key 'userResponseModel' whose value is
//   a model onto which it saves 
//   a user's response to this question's responses. 
//   if this key is ommitted, it will create it's own.
showQuestionView = Dynamo.BaseUnitaryXelementView.extend({

  initialize: function() {

    _.bindAll(this);
    this.cid = _.uniqueId('showQuestionView-');
    this.subViews = [];
    this.position = this.options.position
    this.model.responses.on("add", this.initialRender);
    this.model.responses.on("add", this.render);
    this.model.responses.on("remove", this.initialRender);
    this.model.responses.on("remove", this.render);
    this.model.on("change",   this.render);
    this.model.on("destroy",  this.removeSubViews);
    this.model.on("destroy",  this.remove);

    this.initializeAsSaveable( this.userResponseModel() );

  },

  addSubView: function(view) {
    this.subViews.push(view);
  },

  attributes: function() {
    return {
      id: "question-"+this.model.cid,
      class: "question" 
    }
  },

  remove: function() {
    this.$el.remove();
    this.removeSubViews();
  },

  removeSubViews: function() {
    _.each(this.subViews, function(sub_view) {
      sub_view.remove();
      sub_view = null;
    });
    this.subViews = [];
  },

  template: function(data, settings) {
    if (!this._template) {
      this._template = templates.show_question;
    };
    return _.template(this._template, data, settings);
  },

  userResponseModel: function () {

    if (this._userResponseModel) { return this._userResponseModel };

    if (this.options.userResponseModel) {
      this._userResponseModel = this.options.userResponseModel;
      return this._userResponseModel;
    }
    
    if (!this.options.server_url || !this.model.id || ! this.options.user_id || !this.options.group_id ) {
      this._userResponseModel = new Dynamo.TempData({});
    }
    else {
      this._userResponseModel = new Dynamo.Data({
        server_url: this.options.server_url,
        xelement_id: this.model.id,
        user_id: this.options.user_id,
        group_id: this.options.group_id
      });
    };

    return this._userResponseModel
  },  

  initialRender: function() {
    //render template
    var self, view_class, view;

    self = this;
    self.$el.html( self.template({ position: this.position }) );

    //Add response views as sub views of this one.
    this.removeSubViews(); //BSTS: Avoid memory leak (i think) -gs;
    self.model.responses.each(function(r) {
      view_class = r.viewClass();
      view = new view_class({ 
        model: r,
        userResponseModel: self.userResponseModel(),
        form_id: self.cid 
      });
      self.$el.find('div.responseGroup:first').append(view.$el);
      self.addSubView(view)
      view.render();
    });
    return this;
  },

  render: function() {
    if (!this.initiallyRendered()) {
      console.log('INITIAL QUESTION SHOW RENDER');  
      this.initialRender();
      this.setInitialRender();
    } else {
      console.log('RE-RENDERING QUESTION');       
    };
    this.$el.find('div.instructions:first').html(this.model.metaContent.get('instructions'));
    this.$el.find('div.content:first').html(this.model.get_field_value('content'));
    // Do not worry about subView rendering; they can re-render themselves as necessary. 
    return this;
  }
});




//showResponseView
//On instantiation, this view expects:
//1) a model of class Response from which it renders
//2) a userResponseModel key whose value is
//   expected to be a model onto which it will save
//   a user's response as the value of 
//   the-attribute-of-that-model-with-the-name-of-
//   the-name-of-this-response-object. 
//   (if not passed, it throws an error).
showResponseView = Backbone.View.extend({
  
  initialize: function() {
    _.bindAll(this);
    this.cid = _.uniqueId('showResponseView-');
    console.log(this);
    var self = this;
    this.model.on('change', this.render);
    this.setUserResponseModel()
  },

  setUserResponseModel: function() {
    if ( this.userResponseModel ) { return this.userResponseModel };
    if ( this.options.userResponseModel ) { 
      this.userResponseModel = this.options.userResponseModel;
      return this.userResponseModel;
    };
    throw new Error("no userResponseModel for showResponseView!");
  },

  remove: function() {
    this.internal_view = null; //BSTS: Avoid circ-ref memory leak (i think) -gs;
    this.$el.remove();
  },

  render: function() {
    var self, view_class, view_options;
    self = this;

    //Fetch the View Class for this type of response:
    view_class = viewClassForInputType( self.model.get('responseType') );

    //Build the appropriate options to pass into this view on instantiation:
    view_options = this.model.pick( view_class.optionsAttributes ) //pick method in Dynamo core.
    view_options.getValue = function() {
      return self.userResponseModel.get_field_value(self.model.get('name'));
    };
    view_options.setValue = function(new_value) {
      return self.userResponseModel.set_field(self.model.get('name'), "string", new_value);
    };
    view_options.form_id = this.cid;

    //Instantiate and render
    this.internal_view = null; //BSTS: Avoid circ-ref memory leak (i think) -gs;
    this.internal_view = new view_class(view_options);
    this.$el.html(this.internal_view.$el);
    this.internal_view.render();

    return this;
  }

});

//Declares that Question Views have been defined.
Dynamo.mantleDefinitions.QuestionViews = true;