# before-and-after
do some task before and after express response is sent

## Install
npm install before-and-after

## Usage

var bafMiddleware = require('before-and-after');
app.use(bafMiddleware);

res.before(function(){
  console.log("Before response is sent");
});

res.after(function(){
  console.log("After response is sent");
  cleanTrace(); // do some tasks
});
