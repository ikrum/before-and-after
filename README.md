# before-and-after
Express package for response preprocessing, postprocessing. Include, exclude, filter, update fields & dump before and after job

# Install
```npm install before-and-after```

# Usage

By adding the middleware into your app you will get four underscore functions [ _before, _after, _exclude, _update] attached with res object.
```
var bafMiddleware = require('before-and-after');
app.use(bafMiddleware);
```

##Before tasks

Before tasks will be executed before the response is delivered. Using before tasks you can dump your common tasks, pre-process and filter express response. 
#### 1) _before

Write your own preprocessing tasks by passing a call back into res._before()
```
res._before(function(){
  console.log("Before response is sent");
});
```
#### 2) _exclude

You may find difficulty with excluding mongoose fields. Filter your response by removing sensitive or unnecessary fields from response. All you need to pass the array of field or object path to the _exclue() function like following example.
```
res._exclude(['__id','__V', 'password', 'user.secretField', 'file.__id', 'links.$.source']);
```
To delete from array use $ sign for iterator. The iterator will be replaced by the array index like:
```
// links.$.source
links[0].source
links[1].source
....
links[i].source
```
NOTE: For now only one iterator sign ($) is supported by this module. so ``'links.$.sources.$.type'`` won't work

#### 3) _update
To add new fields on the response or update existing fields you need to pass the object path and value to the _update function.

```
// add new field or update existing field
res._update("token", getToken());
res._update("data", {foo: "bar"});

// add or update field at all array elements
res._update("links.$.newField", "new value");
```
NOTE: Like _exclude function, only one iterator sign ($) is supported by _update

###### Recommendation about using before tasks
It's recommended to avoid nested before functions

```
// don not use like this, bcoz by default all those three functions will be 
// executed explicitly before the response is sent.

res._before(function(){
   res._update("foo", "bar");
   res._exclude(["a","b","c"]);
})
```

## After tasks
If you need to do some tasks that need to be done after response is sent you can use the _after() function like the following example

```
res._after(function(){
  console.log("After response is already sent");
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

		res.status(200).json({status:200, message: "File upload successful"});
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

		res.status(200).json({status:200, message: "File upload successful"});
	}
}
```

## Limitations

You can use `.before` and `.after` function for the following response methods

* res.send(responseBody)
* res.json(responseBody)
* res.jsonp(responseBody)
* res.sendStatus(responseBody)
* res.sendFile(responseBody)
* res.render(responseBody)


Feel free to contact me at: ikrum.bd@gmail.com
