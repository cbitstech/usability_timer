// Dynamo.Collections.js

Dynamo.Collection = Backbone.Collection.extend({
  initialize: function() {
    _.bindAll(this)
  },
  storeName: function() { return this.codeModelName() + "_store" },
  codeCollectionName: "dynamo_collection",
  codeModelName: function() { var m = new this.model(); return m.codeName },
  prettyModelName: function() { var m = new this.model(); return m.prettyName }
});

UserCollection = Dynamo.Collection.extend({ 

	model: Dynamo.User,
  codeCollectionName: "users",
  url: function() { return Dynamo.TriremeURL+'/users' }

});

DataCollection = Dynamo.Collection.extend({ 

  codeCollectionName: "data_collection",
	model: Dynamo.Data 

});

TempDataCollection = Dynamo.Collection.extend({
  
  codeCollectionName: "temp_data_collection",
	model: Dynamo.TempData 

});