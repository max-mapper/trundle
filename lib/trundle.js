var fs = require('fs'),
    path = require('path'),
    request = require('request').defaults({json: true}),
    forever = require('forever'),
    async = require('async'),
    _ = require('underscore'),
    couchapp = require('couchapp');

var trundle = exports
  , ddoc = { 
    _id: '_design/trundle'
  , views: {
      processes: {
          map: "function(doc) { if(doc.type === 'node') emit(doc.path, doc.env) }"
      }
    }
  }
  ;

// take a folder and return the start script from package.json
trundle.startScriptPath = function(modulePath, callback) {
  if (_.last(modulePath) === "/") modulePath = modulePath.substr(0, modulePath.length - 1);
  fs.stat(modulePath + '/package.json', function (err, stats) {
    if (err) {
      callback(err);
    } else if ( stats.isFile() ) {
      var packageJSON = JSON.parse(fs.readFileSync(modulePath + '/package.json'))
      if ( packageJSON.scripts && packageJSON.scripts.start ) {
        var script = packageJSON.scripts.start
        if ( script.substr(script.length - 3, script.length) !== ".js") script += ".js";
        callback(false, modulePath + '/' + script);
      } else {
        callback({message: "No start script defined in package.json.scripts.start"});
      }
    } else {
      callback({message: "Couldn't read " + modulePath + '/package.json'});
    }
  });
}

trundle.load = function(database, callback) {
  trundle.ensureResourceExists(database + '/_design/trundle', ddoc
    , function(err, ok) {
      if(err) throw new Error(err);
      request({url: database + '/_design/trundle/_view/processes'},
        function(err, resp, data) {
          async.parallel(
            _.map(data.rows, function(dataset) {
              return function(done) {
                trundle.setEnv(dataset.value);
                trundle.startScriptPath(dataset.key, function(error, script) {
                  if (err) done(err);
                  // non-daemonized version for debugging:
                  // var monitor = forever.startDaemon(script);
                  var monitor = new (forever.Monitor)(script);
                  monitor.start()
                  monitor.on('start', function () {
                    done(null, monitor)
                  });
                });
              }
            }),
            function(err, monitors) {
              forever.startServer(monitors)
              _(monitors).each(function(monitor) { console.log('started ' + monitor.childData.file) })
            }
          )
        }
      )
    })
}

trundle.setEnv = function(env) {
  _.each(_.keys(env || {}), function(k) {
    process.env[k] = env[k];
  })
}

trundle.ensureResourceExists = function(url, data, callback) {
  request({url: url, method: "HEAD"}, function(err, resp) {
    if (resp.statusCode === 404) {
      request.put({url: url, json: true, body: data}, function(err, resp, body) {
        if (body.ok) callback(false, body.ok)
        else callback("CouchDB error: " + JSON.stringify(body))
      })
    } else {
      callback(false, resp.statusCode);
    }
  });
}