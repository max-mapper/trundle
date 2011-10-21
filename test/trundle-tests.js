var it = require('it-is')
  , trundle = require('../lib/trundle')
  , fs = require('fs')
  , pwd = fs.realpathSync()
  ;

trundle.startScriptPath(pwd + '/awesometown', function(err, script) {
  it(err).equal(false)
  it(script).equal(pwd + '/awesometown/pizza.js')
})

trundle.startScriptPath(pwd + '/awesometown/', function(err, script) {
  it(err).equal(false)
  it(script).equal(pwd + '/awesometown/pizza.js')
})

trundle.startScriptPath(pwd + '/nonexistanttown', function(err, script) {
  it( !!(err.message.match(/No such file/)) ).equal(true)
})

trundle.startScriptPath(pwd + '/dumbtown', function(err, script) {
  it( !!(err.message.match(/No start script defined/)) ).equal(true)
})