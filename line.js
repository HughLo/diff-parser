'use strict'

import "babel-polyfill";
import Transform from "stream";

const LF_CODE = 0x0A, CR_CODE = 0x0D;
const END_WITH_LF = 0, END_WITH_CR = 1, END_WITH_CR_LF = 2;

//Wrapper for newline tokens.
//Newline tokens shall be one of '\n', '\r' or '\r\n'.
class LineEnd {
	constructor(line_end_type) {
		this.LineEndType = line_end_type;
		let end_maps = new Map();
  		end_maps.set(END_WITH_CR, new Buffer([CR_CODE]));
  		end_maps.set(END_WITH_LF, new Buffer([LF_CODE]));
  		end_maps.set(END_WITH_CR_LF, new Buffer([CR_CODE, LF_CODE]));
  		this.endMaps = end_maps;
	}

	GetBuffer() {
		return this.endMaps.get(this.LineEndType);
	}

	EqualType(type) {
		return type === this.LineEndType;
	}
};

class Line {
	constructor(data, end_token) {
		this.Data = data;
		this.EndToken = end_token;
	}
}

const LF = new LineEnd(END_WITH_LF);
const CR = new LineEnd(END_WITH_CR);
const CRLF = new LineEnd(END_WITH_CR_LF);

let LINE_END = {LF, CR, CRLF};

class LineReader extends Transform {
	constructor() {
		super();
		this.unfinised = null;
		this.len = 0;
	}

	_transform(chunk, encoding, next) {

		//concate the unhandled part of previous transform with the current chunk
		let target_chunk = null;
		if(this.unfinished !== null && this.len > 0) {
			target_chunk = new Buffer(this.len + chunk.length);
			let copyed_len = target_chunk.copy(this.unfinished, 0, 0, this.len);
			if(copyed_len != this.len) throw "buffer copy error";
			copyed_len = target_chunk.copy(chunk, copyed_len);
			if(copyed_len != chunk.length) throw "buffer copy error";
		}
		else {
			target_chunk = chunk;
		}

		for(let v of this._split_lines(chunk)) {
			this.push(v);
		}

		this.push(null);

		if(this.len > 0) {
			console.debug(`still left {this.len} bytes in the stream`);
		}
	}

	//split chunks into lines
	*_split_lines(chunk) {
		let start_pos = 0;
	  for(let i = 0; i < chunk.len; ++i) {
	    let end_pos = -1;
	    let end_token = null;
	    if(data[i] === LF_CODE) {
	      if(data[i-1] === CR_CODE) {
	        end_pos = i - 1;
	        end_token = LIEN_END.CRLF;
	      }
	      else {
	        end_pos = i;
	        end_token = LINE_END.LF;
	      }
	    }
	    else if(data[i] === CR_CODE) {
	      //next byte is not LF or this is the last byte
	      if((i+1 < len && data[i+1] !== LF) || i+1 === len) {
	        end_pos = i;
	        end_token = LINE_END.CR;
	      }
	    }

	    //find a new line
	    if(end_pos !== -1) {
	      let app_buf = end_pos > start_pos ? chunk.slice(start_pos, end_pos) : null;
				yield new Line(app_buf, end_token);
	      start_pos = ++i;
	    }
	  }

		//cache the unhandled part of chunk
	  if(start_pos < len) {
			let left_over = chunk.slick(start_pos);
			if(this.unfinished === null || this.unfinished.length < left_over.length) {
				this.unfinished = new Buffer(left_over.length);
			}

			this.unfinished.copy(left_over);
			this.len = left_over.length;
	  }

	  return result;
	}

	GetUnfinished() {
		return {
			Unfinished: this.unfinished,
			Len: this.len
		}
	}
}

export {
	LINE_END,
	Line,
	LineReader
}
