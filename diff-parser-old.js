'use strict'

import fs from "fs";
import {LINE_END_LF, LINE_END_CR, LINE_END_CRLF, Line} from "./line.js";

let last_data = null;
let lines_count = 0;

function ParseObject() {
  this.Target = "";
  this.Original = "";
  this.Index = "";
  this.Content = [];
  this.Properties = {};
};

let parse_object = null;
let po_array = [];

function is_ripped_off(v) {
  if(v.Index.search(/\.pdf|\.bin|target\/firmware/) != -1) {
    return true;
  }

  for(let l of v.Content) {
    if(l.Data !== null) {
      if(l.Data.toString().search(/application\/octet-stream/) != -1) {
        return true;
      }
    }
  }

  return false;
}

fs.readFile('./total_diff.patch', (err, data) => {
  if(err) throw err;
  let result = split_lines(data, last_data);
  last_data = result.unfinished;
  lines_count += result.arr.length;
  console.log("lines count: " + lines_count);
  console.log("content size: " + data.length);
  console.log("content of first line: " + result.arr[0].Data.toString());
  console.log("content of last line: " + result.arr[result.arr.length-1].Data.toString());
  for(let v of result.arr) {
    parse_line(v)
  }

  po_array.push(parse_object);

  console.log("totally have " + po_array.length + " diff chunks");

  let new_target = fs.openSync('./newTarget.diff', 'w');
  let ripped_off = fs.openSync('./rippedOff.diff', 'w');

  for(let v of po_array) {
    let write_file = new_target;
    if(is_ripped_off(v))
    {
      write_file = ripped_off;
    }

    for(let l of v.Content) {
      if(l.Data != null) {
        fs.writeSync(write_file, l.Data, 0, l.Data.length);
      }

      let end_tok_buf = l.EndToken.GetBuffer();
      fs.writeSync(write_file, end_tok_buf, 0, end_tok_buf.length);
    }
  }

  fs.close(new_target);
  fs.close(ripped_off);
});

//split buffer to lines
function split_lines(data, left_over) {
  var result = {
    arr: [],
    unfinished: null
  };
  let new_buff = null;
  if(left_over === null) new_buff = data;
  else new_buff = Buffer.concat([left_over, data]);

  const len = new_buff.length;

  console.log("new buffer length: " + len);

  let start_pos = 0;
  for(let i = 0; i < len; ++i) {
    let end_pos = -1;
    let end_token = null;
    if(data[i] === LF) {
      if(data[i-1] === CR) {
        end_pos = i - 1;
        end_token = LINE_END_CRLF;
      }
      else {
        end_pos = i;
        end_token = LINE_END_LF;
      }
    }
    else if(data[i] === CR) {
      //next byte is not LF or this is the last byte
      if((i+1 < len && data[i+1] !== LF) || i+1 === len) {
        end_pos = i;
        end_token = LINE_END_CR;
      }
    }

    //find a new line
    if(end_pos !== -1) {
      let app_buf = end_pos > start_pos ? new_buff.slice(start_pos, end_pos) : null;
      result.arr.push(new Line(app_buf, end_token));
      start_pos = ++i;
    }
  }

  if(start_pos < len) {
    result.unfinished = new_buff.slice(start_pos);
  }

  return result;
}

//parse the text line
function parse_line(lc) {
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
