let {PythonShell} = require('python-shell');
let pyshell = new PythonShell('generate_training_set.py');
 
pyshell.send(paragraph1);
pyshell.send(paragraph2);

pyshell.on('message', function (message) {
  // received a message sent from the Python script (a simple "print" statement)
  console.log(message);
});
 
// end the input stream and allow the process to exit
pyshell.end(function (err,code,signal) {
  if (err) throw err;
});
