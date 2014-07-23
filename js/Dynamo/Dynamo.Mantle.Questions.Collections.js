//Before this Dynamo Mantle File can be used, the following must be defined:
//
// Dynamo.Mantle.Questions

// Dynamo.Collections.js

  QuestionGroupCollection = Dynamo.Collection.extend({
    
    model: QuestionGroupModel,
    codeCollectionName: "question_groups",
    prettyCollectionName: "Question Groups",
    
    comparator: function(qgroup) {
      return qgroup.get_field_value("title");
    },

    url: function() { return Dynamo.TriremeURL+'/xelements?filter={"latest.xelement_type":"question_group"}' }
    
  });

  QuestionCollection = Dynamo.Collection.extend({
    
    model: QuestionModel,
    codeCollectionName: "questions",
    prettyCollectionName: "Questions",

    url: function() { return Dynamo.TriremeURL+'/xelements?filter={"latest.xelement_type":"question"}' }
    
  });

  ResponseCollection = Dynamo.Collection.extend({

    model: ResponseModel,
    codeCollectionName: "responses",
    prettyCollectionName: "Responses"

  });

  ResponseValueCollection = Dynamo.Collection.extend({

    model: ResponseValueModel,
    codeCollectionName: "response_values",
    prettyCollectionName: "Response Values"

  });

  //Declares that Question Collections Have Been defined.
  Dynamo.mantleDefinitions.QuestionCollections = true;