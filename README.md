# before-and-after
do some task before and after express response is sent

## Install
npm install before-and-after

## Usage

Add the middleware
```
var bafMiddleware = require('before-and-after');
app.use(bafMiddleware);
```

Use from anywhere
```
res.before(function(){
  console.log("Before response is sent");
});

res.after(function(){
  console.log("After response is sent");
  cleanTrace(); // do some tasks
});
```

### Example






For upload file request, you need to remove the temporary file from temp. 

```
exports.uploadFile = function(req,res,next){

	if(!req.files) return next("File payload required"); // you need to unlink file
	if(!isImage(req.files.file)) return next("Invalid image file"); // // you need to unlink file

	upload(req.files.file, function(error, result)){
		if(error) return next(error); // // you need to unlink file

		res.status(200).json({status:200, message: "File upload successfull"});
	}
}
```

You may consider to write unlink code for each error condition.


```
if(!req.files){
	fs.unlink(req.files.file.path, function(err){});
	next("File payload required");
};

if(!isImage(req.files.file)){
	fs.unlink(req.files.file.path, function(err){});
	next("Invalid image file");
};

```

Situation like this you find this module is useful. You can define what will happen before and after the response is sent. At the example I want to unlink temp file after the response is sent, doesn't matter if the response is 200, 400 or whatever.

```
exports.uploadFile = function(req,res,next){

	// define your task before response is returned.
	res.after(function(){
		fs.unlink(req.files.file.path, function(err){});
		// add more task you want
	});


	// now forget about the file unlink

	if(!req.files) return next("File payload required"); 
	if(!isImage(req.files.file)) return next("Invalid image file"); 

	upload(req.files.file, function(error, result)){
		if(error) return next(error);

		res.status(200).json({status:200, message: "File upload successfull"});
	}
}
```

## Limitation

You can use `.before` and `.after` function for the following response methods

* res.send(responseBody)
* res.json(responseBody)
* res.jsonp(responseBody)
* res.sendStatus(responseBody)
* res.end(responseBody)
* res.sendFile(responseBody)
* res.render(responseBody)
