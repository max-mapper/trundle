var fs = require('fs'),
    path = require('path'),
    request = require('request'),
    forever = require('forever'),
    _ = require('underscore'),
    deferred = require('deferred'),
    couchapp = require('couchapp');

var trundle = exports,
    h = {"Content-type": "application/json", "Accept": "application/json"};

trundle.load = function(database) {
  trundle.get(database + "/_design/trundle/_view/processes").then(
    function(data) {
      if (data.rows) {
        var monitors = _.map(data.rows, function(dataset) {
          trundle.setEnv(dataset.value);
          return trundle.spawn(dataset.key);
        })
        forever.startServer(monitors);
      } else {
        trundle.pushCouchapp("../lib/trundle-couchapp.js", database).then(function() {
          trundle.load(database);
        });
      }
    }
  ).end(function(fail) {
    console.log('fail', fail);
  })
}

trundle.setEnv = function(env) {
  _.each(_.keys(env || {}), function(k) {
    process.env[k] = env[k];
  })
}

trundle.spawn = function(script) {
  var monitor = new (forever.Monitor)(script);
  monitor.start();
  return monitor;
}

trundle.absolutePath = function(pathname) {
  if (pathname[0] === '/') return pathname
  return path.join(process.env.PWD, path.normalize(pathname));
}

trundle.pushCouchapp = function(app, target) {
  var dfd = deferred();
  couchapp.createApp(require(trundle.absolutePath(app)), target, function (app) { app.push(function(resp) { dfd.resolve(resp) }) })
  return dfd.promise();}

trundle.get = function(uri) {
  var dfd = deferred();
  request({uri: uri, headers: h}, function (err, resp, body) {
    if(err) {
      dfd.resolve(new Error(body));
    } else {
      dfd.resolve(JSON.parse(body));      
    }
  })
  return dfd.promise();
}