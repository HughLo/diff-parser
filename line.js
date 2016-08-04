'use strict'

import "babel-polyfill";
import stream from "stream";

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

class LineReader extends stream.Transform {
	constructor() {
		super({readableObjectMode: true});
		this.unfinished = null;
		this.len = 0;

    //@followings are debug variables
    this.total_len = 0;
    this.line_couont = 0;
	}

	_transform(chunk, encoding, next) {
    if(chunk.length === 0) this.push(null);

    this.total_len += chunk.length;
		//concate the unhandled part of previous transform with the current chunk
		let target_chunk = null;
		if(this.unfinished !== null && this.len > 0) {
			target_chunk = new Buffer(this.len + chunk.length);
			let copyed_len = this.unfinished.copy(target_chunk, 0, 0, this.len);
			if(copyed_len != this.len) throw `buffer copy error 1 (copyed ${copyed_len} src ${this.len})`;
			copyed_len = chunk.copy(target_chunk, this.len);
			if(copyed_len != chunk.length) throw `buffer copy error 2 (copyed ${copyed_len} src ${chunk.length})`;
		}
		else {
			target_chunk = chunk;
		}

		for(let v of this._split_lines(chunk)) {
      ++this.line_count;
			this.push(v);
		}

		if(this.len > 0) {
			console.log(`still left ${this.len} bytes in the stream`);
		}

    next();
	}

	//split chunks into lines
	*_split_lines(chunk) {
		let start_pos = 0;
	  for(let i = 0; i < chunk.length; ++i) {
	    let end_pos = -1;
	    let end_token = null;
	    if(chunk[i] === LF_CODE) {
	      if(chunk[i-1] === CR_CODE) {
	        end_pos = i - 1;
	        end_token = LINE_END.CRLF;
	      }
	      else {
	        end_pos = i;
	        end_token = LINE_END.LF;
	      }
	    }
	    else if(chunk[i] === CR_CODE) {
	      //next byte is not LF or this is the last byte
	      if((i+1 < chunk.length && chunk[i+1] !== LF) || i+1 === chunk.length) {
	        end_pos = i;
	        end_token = LINE_END.CR;
	      }
	    }

	    //find a new line
	    if(end_pos !== -1) {
	      let app_buf = end_pos > start_pos ? chunk.slice(start_pos, end_pos) : null;
				yield new Line(app_buf, end_token);
	      start_pos = i+1;
	    }
	  }

		//cache the unhandled part of chunk
	  if(start_pos < chunk.length) {
			let left_over = chunk.slice(start_pos);
			if(this.unfinished === null || this.unfinished.length < left_over.length) {
				this.unfinished = new Buffer(left_over.length);
			}

      left_over.copy(this.unfinished);
			this.len = left_over.length;
	  }
	}

	//return the unhandled content
	GetUnfinished() {
		return {
			Unfinished: this.unfinished,
			Len: this.len
		}
	}

  GetTotalLen() {
    return this.total_len;
  }
}

export {
	LINE_END,
	Line,
	LineReader
}
