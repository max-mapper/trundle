work in progress. use couch documents to represent processes that you want to monitor and deploy on remote servers. more docs soon

    rough synposis:
    you make couch docs like {'type': 'node', 'path': '/usr/awesome_server.js'}
    and put them in a password protected couch db called, for instance, mycouch/processes
    then you run npm install trundle && trundle load http://user:pass@mycouch/processes
    then it spawns all of the things with forever (https://github.com/indexzero/forever)
    then you just have to write an upstart script (example coming soon) to run that trundle load command
    and then you can use futon to deploy things!
    eventually this will be hooked up to the changes feed so you can start and stop processes