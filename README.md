# before-and-after
Express package for response preprocessing, postprocessing. Include, exclude, filter, update fields & dump before and after job

# Install
```npm install before-and-after```

# Usage

By adding the middleware into your app you will get four  functions [` before, after, exclude, update` ] attached with res object.
```
var bafMiddleware = require('before-and-after');
app.use(bafMiddleware);
```

## Before tasks

Before tasks will be executed before the response is delivered. Using before tasks you can dump your common tasks, pre-process and filter express response. 

#### 1) before

Write your own preprocessing tasks by passing a callback into `res.before()`
```
res.before(function(){
  console.log("Before response is sent");
});
```
#### 2) exclude

To exclude fileds from your response this function can be very useful. Filter your response by removing sensitive or unnecessary fields any time. All you need to pass the array of field or object path to the `exclue()` function like following example.
```
// Consider the example json response
var json = {
	__id: "random_id",
	password: "9t3n49tvo9tu",
	__V: 0,
	name: "ikrum",
	email: "admin@ikrum.net",
	file: {
		__id: "87hryhyr983y39",
		fileName : "input.mp4",
        token: "Random token"
		secretField: "secret value",
		info: {
			title: "my title"
        }
    },
	links : [
		{
			id: 34,
			source: "facebook",
			url: "a link here"
		},
		{
			id: 36,
			source: "google",
			url: "a link here here"
		},
	]
}


res.exclude(['__id','__V', 'password', 'file.__id', 'file.secretField', 'links.$.source']);

// call again whenever you need.
res.exclude(['token']);

```
To delete from array use `$` sign for iterator. The iterator will be replaced by the array index like:
```
// links.$.source
links[0].source
links[1].source
....
links[i].source
```
NOTE: For now only one iterator sign `$` is supported by this module. so ``'links.$.sources.$.type'`` won't work

#### 3) update
To add new fields on the response or update existing fields you need to pass the object path and value to the update function.

```
// add new field or update existing field
res.update("token", getToken());
res.update("data", {foo: "bar"});

// add or update field at all array elements
res.update("links.$.newField", "new value");
```
NOTE: Like `exclude()` function, only one iterator sign `$` is supported by update

###### It's recommended to avoid nested before tasks. Before tasks should be defined before the request is already sent.

```
// don not use like this, bcoz by default all those three functions will be 
// executed explicitly before the response is sent.

res.before(function(){
   res.update("foo", "bar");
   res.exclude(["a","b","c"]);
})

// The follwoing example won't work
res.send("response already sent");
res.exclude(['foo']);
```

## After tasks
If you need to do some tasks that need to be done after response is sent you can use the `after()` function like the following example

```
res.after(function(){
  console.log("After response is already sent");
  cleanTrace(); // do some tasks
});
```

### Multiple before-after tasks

You can use before and after tasks multiple time. Each task you are adding will be executed explicitly in order.
```
res.before(function(){}); 
res.exclude['foo','bar'];
//...... your code here ...

// use this again
res.before(function(){ /* Another task here*/ })
res.exclude['foo','bar'];.
```

### A complete example

For upload file request the example will accomplish the following tasks

*) Add before and after tasks

*) For upload failed or success, in every case we have to delete the temp file.

*) Add or Filter some response fields

```
exports.uploadFile = function(req,res,next){

    // define your tasks
    res.before(function(){
		res.locals.variable = "some content"
    });
    
    // remove the temp file after everything is done
    res.after(function(){
        fs.unlink(req.files.file.path, function(err){});
        // add more task you want
    });

    // add an example documentation field for error
    res.update("documentation", "http://api.com/docs/1234");

    // On each error you don't have to remove the temp file
    // File will be remove by the after task
    if(!req.files) return next("File payload required"); 
    if(!isImage(req.files.file)) return next("Invalid image file");
    
    
    upload(req.files.file, function(error, result)){
    
    	// File will be remove by the after task
        if(error) return next(error);

        // error not happened, so delete the documentation field from response
        res.exclude(['documentation']);

        // insert response time
        res.update('time', Date.now());

        // remove some fields from file info for the given json
        // {status:200, message: "string message", data: {resultOject}, time: time}
        res.exclude(['data.__id', 'data.user.password', 'data.user.roles.$.accessKey']);


        // File will be remove by the after task
        res.status(200).json({status:200, message: "File upload successful", data: result});
    }
}
```

## Limitations

You can use `.before()` and `.after()` function for the following response methods

* res.send(body)
* res.json(body)
* res.jsonp(body)
* res.sendStatus(body)
* res.sendFile(body)
* res.render(body)

`.update()` and `.exclude()` is only for json response using:

* res.json(jsonObj)
* res.jsonp(jsonObj)


Feel free to contact me at: ikrum.bd@gmail.com
