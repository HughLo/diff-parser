'use strict'

import * as ReadLine from "linebyline";
import {Writable, Transform} from "stream";
import {LINE_END, Line} from "./line.js";
import {Property, Content, DiffChunk} from "./chunk.js";

class DiffParser extends Transform {
	constructor() {
		super();
	}

	_transform(chunk, encoding, callback) {

	}

	parseLine(line) {
		if(lc.Data !== null) {
	    let string_to_parse = lc.Data.toString();
	    if(string_to_parse.search(/^Index\:/) != -1) {
	      if(parse_object !== null) {
	        po_array.push(parse_object);
	        parse_object = null;
	      }

	      if(parse_object === null) {
	        parse_object = new ParseObject();
	      }

	      parse_object.Index = string_to_parse.substr(7);
	    }
	    else if(string_to_parse.search(/^===/) != -1) {
	      //skip
	    }
	    else if(string_to_parse.search(/^--- /) != -1) {
	      parse_object.Original = string_to_parse.substr(5);
	    }
	    else if(string_to_parse.search(/^\+\+\+ /) != -1) {
	      parse_object.Target = string_to_parse.substr(5);
	    }
	    else if(string_to_parse.search(/^@@/) != -1) {
	      //skip
	    }
	    else if(string_to_parse[0] === '+') {
	      //skip
	    }
	    else if(string_to_parse[0] === '-') {
	      //skip
	    }
	    else if(string_to_parse[0] === '\\') {
	      //skip
	    }
	    else if(string_to_parse.search(/^___/) != -1) {
	      //skip
	    }
	    else if(string_to_parse.search(/^Cannot display\:/) != -1) {
	      //skip
	    }
	    else if(string_to_parse.search(/^Property changes on\:/) != -1) {
	      parse_object.Properties["PropertyChangesOn"] = string_to_parse.substr(22);
	    }
	    else if(string_to_parse.search(/^svn\:/) != -1) {
	      parse_object.Properties["ChangedProperties"]=string_to_parse.substr(4)
	    }
	    else if(string_to_parse.search(/^Cannot display/) != -1) {
	      //skip
	    }
	    else if(string_to_parse.search(/^##/) != -1) {
	      //skip
	    }
	    else if(string_to_parse.search(/^Added\:/) != -1) {
	      parse_object.Properties["Added"] = string_to_parse.substr(7);
	    }
	  };

	  if(parse_object !== null) {
	      parse_object.Content.push(lc);
	  }
	}
};
