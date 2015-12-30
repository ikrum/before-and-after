"user strict";

var contentType = require('content-type');

// clone function
Function.prototype.rt_clone=function(){
	return eval( '('+this.toString()+')' );
}


// no operation
var noop = function(){}

module.exports = function(req,res,next){

	//****************** copying res functions ******************
	res.rt_send_ 		= res.send.rt_clone();
	res.rt_json_ 		= res.json.rt_clone();
	res.rt_jsonp_ 		= res.jsonp.rt_clone();
	res.rt_sendFile_ 	= res.sendFile.rt_clone();
	res.rt_render_ 		= res.render.rt_clone();
	res.rt_sendStatus_ 	= res.sendStatus.rt_clone();

	res.rt_before_func_ = noop;
	res.rt_after_func_ = noop;
	

	//****************** Override Functions **********************
	res.send = function(){
		res.rt_before_func_();
		res.rt_send_.apply(this, arguments);
		res.rt_after_func_();
	}

	/*
	 * before and after function should not be called for certain res calls
	 * res.json, res.jsonp and res.sendStatus calls res.send
	 * res.send calls to res.end
	 */
	res.json = function(){
		res.rt_json_.apply(this, arguments);
	}
	res.jsonp = function(){

		res._jsonp.apply(this, arguments);
	}
	res.sendStatus = function(){
		res._sendStatus.apply(this, arguments);
	}


	// individual response function
	res.sendFile = function(){
		res.rt_before_func_();
		res._sendFile.apply(this, arguments);
		res.rt_after_func_();
	}
	res.render = function(){
		res.rt_before_func_();
		res._render.apply(this, arguments);
		res.rt_after_func_();
	}
	

	// add new functions

	res.before = function(callback){
		if(callback =="undefined" || !isFunction(callback)) return console.error("before callback is not a function");
		res.rt_before_func_ = callback;
	}

	res.after = function(callback){
		if(callback =="undefined" || !isFunction(callback)) return console.error("after callback is not a function");
		res.rt_after_func_ = callback;
	}

	next();
	
}

function isFunction(functionToCheck) {
 var getType = {};
 return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

/*
	res.send dependendency: debug, setCharset

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