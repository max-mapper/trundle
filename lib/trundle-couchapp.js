var couchapp = require('couchapp')
  , path = require('path')
  ;

ddoc = { _id: '_design/trundle' };

ddoc.views = {
  processes: {
    map: function(doc) { 
      if(doc.type === "node") emit(doc.path, doc.env);
    }
  }
}

module.exports = ddoc;