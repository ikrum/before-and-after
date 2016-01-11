"user strict";

// express dependency 
var contentType = require('content-type');
var send = require('send');
var etag = require('etag')

// module dependecy
var objectPath = require("object-path");


// clone function
Function.prototype.baf_clone_=function(){
	return eval( '('+this.toString()+')' );
}


// middleware
module.exports = function(req,res,next){

	//****************** copying res functions ******************
	res.baf_send_ 		= res.send.baf_clone_();
	res.baf_json_ 		= res.json.baf_clone_();
	res.baf_jsonp_ 		= res.jsonp.baf_clone_();
	res.baf_render_ 	= res.render.baf_clone_();

	// sendFile is supported by Express v4.8.0
	if(isFunction(res.sendFile))
		res.baf_sendFile_ 	= res.sendFile.baf_clone_();

	// sendfile is deprecated, could be removed at next express version
	if(isFunction(res.sendfile))
		res.baf_sendfile_ 	= res.sendfile.baf_clone_();		

	// sendStatus is introduced in v4.x
	if(isFunction(res.sendStatus))
		res.baf_sendStatus_ 	= res.sendStatus.baf_clone_();

//  ***************** Before tasks *******************
	var baf_before_func_ = [];
	var baf_exclude_paths_ = []; // array of exclude fields, from json and jsonp
	var baf_update_fileds_ = [];

	function exec_before_functions(){
		for(index in baf_before_func_)
			baf_before_func_[index]();

		// empty the array after one execution
		baf_before_func_ = [];
	}
	

	function exec_update_fields(jsonObj){
		
		jsonObj = JSON.parse(JSON.stringify(jsonObj));

		for(var index in baf_update_fileds_){

			// if the key has iterator $ sign 
			if(baf_update_fileds_[index].path.indexOf(".$.") != -1){

				var fields = baf_update_fileds_[index].path.split(".$.");
				// invalid iterator path
				if(fields[1]==''){
					return next(new Error("Invalid iterator path: "+baf_update_fileds_[index].path));
				}

				// skip if the root object is not an array
				var firstObject = objectPath.get(jsonObj, fields[0]);
				if(!Array.isArray(firstObject)) continue;
				
				// delete all fields from array
				for(var n in firstObject){
					// users.0.password, users.1.password
					objectPath.set(jsonObj, fields[0]+"."+n+"."+fields[1], baf_update_fileds_[index].value)
				}
			}else{
				// try to delete the field itself
				objectPath.set(jsonObj, baf_update_fileds_[index].path, baf_update_fileds_[index].value);
			}
		}
		baf_update_fileds_ = [];
		return jsonObj;
	}

	function exec_exclude_paths(jsonObj){

		jsonObj = JSON.parse(JSON.stringify(jsonObj));

		for(var index in baf_exclude_paths_){

			// if the key has iterator $ sign 
			if(baf_exclude_paths_[index].indexOf(".$.") != -1){

				var fields = baf_exclude_paths_[index].split(".$.");
				// invalid iterator path
				if(fields[1]==''){
					return next(new Error("Invalid iterator path: "+baf_exclude_paths_[index]));
				}

				// skip if the root object is not an array
				var firstObject = objectPath.get(jsonObj, fields[0]);
				if(!Array.isArray(firstObject)) continue;
				
				// delete all fields from array
				for(var n in firstObject){
					// users.0.password, users.1.password
					objectPath.del(jsonObj, fields[0]+"."+n+"."+fields[1]);
				}
			}else{
				// try to delete the field itself
				objectPath.del(jsonObj, baf_exclude_paths_[ index ]);
			}
		}

		baf_exclude_paths_ = [];
		return jsonObj;
	}

	function transformJSON(obj, funcArgs){
		var jsonObj = obj;

		if (funcArgs.length === 2) {
			// res.json(body, status) backwards compat
			if (typeof funcArgs[1] === 'number') {
				res.statusCode = funcArgs[1];
			} else {
				res.statusCode = funcArgs[0];
				jsonObj = funcArgs[1];
			}
		}

		return exec_exclude_paths( exec_update_fields(jsonObj) );
	}


//  ***************** After tasks *******************
	var baf_after_func_ = [];

	function exec_after_functions(){
		for(index in baf_after_func_)
			baf_after_func_[index]();

		// empty the array after one execution
		baf_after_func_ = [];
	}

// ****************** Override Functions *************
	res.send = function(obj){
		exec_before_functions();
		res.baf_send_.apply(res, arguments);
		exec_after_functions();
	}

	/*
	 * res.json, res.jsonp and res.sendStatus calls res.send
	 */
	res.json = function(obj){

		// before should be called to activate jsno exclude, 
		exec_before_functions();
		res.baf_json_(transformJSON(obj, arguments) );
		exec_after_functions();
	}
	res.jsonp = function(){
		// before should be called to activate jsno exclude, 
		exec_before_functions();
		res.baf_jsonp_.apply(this, arguments);
		exec_after_functions();
	}
	res.sendStatus = function(){
		if(!isFunction(res.baf_sendStatus_))
			return next(new Error("sendStatus is not a function"));

		res.baf_sendStatus_.apply(this, arguments);
	}


	// individual response function
	res.sendFile = function(){
		if(!isFunction(res.baf_sendFile_))
			return next(new Error("sendFile is not a function"));

		exec_before_functions();
		res.baf_sendFile_.apply(this, arguments);
		exec_after_functions();
	}

	res.sendfile = function(){

		if(!isFunction(res.baf_sendfile_))
			return next(new Error("sendfile is not a function"));

		exec_before_functions();
		res.baf_sendfile_.apply(this, arguments);
		exec_after_functions();
	}

	res.render = function(){
		exec_before_functions();
		res.baf_render_.apply(this, arguments);
		exec_after_functions();
	}
	

//	******************  New _functions for developers ****************

	res.before = function(callback){
		if(callback =="undefined") return;
		if(!isFunction(callback)) return console.error("before callback is not a function");
		baf_before_func_.push(callback);
	}

	res.after = function(callback){
		if(callback =="undefined") return;
		if(!isFunction(callback)) return console.error("after callback is not a function");
		baf_after_func_.push(callback);
	}

	res.exclude = function(pathArray){
		if(!Array.isArray(pathArray)) return;

		for(index in pathArray){
			baf_exclude_paths_.push(pathArray[index]);
		}
	}

	// @param value could be any type: int, string, object etc
	res.update = function(path, value){
		if(typeof path != "string" || typeof value == "undefined")
			return next(new Error("Invalid function parameter : _update(objectPath, objectValue)"));

		baf_update_fileds_.push({path: path, value: value});
	}


	next();
	
}

//	******************* Utitlity functions *****************

function isFunction(functionToCheck) {
	var getType = {};
	return getType.toString.call(functionToCheck) === '[object Function]';
}

/*
	res.send() dependendent on: debug, setCharset
*/

function debug(){}
function setCharset(type, charset) {
	  if (!type || !charset) {
	    return type;
	  }

	  // parse type
	  var parsed = contentType.parse(type);

	  // set charset
	  parsed.parameters.charset = charset;

	  // format type
	  return contentType.format(parsed);
};