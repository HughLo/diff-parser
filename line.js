'use strict'

const LF_CODE = 0x0A, CR_CODE = 0x0D;
const END_WITH_LF = 0, END_WITH_CR = 1, END_WITH_CR_LF = 2;
class LineEnd {
	constructor(lind_end_type) {
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

export class Line {
	constructor(data, end_token) {
		this.Data = data;
		this.EndToken = end_token;
	}
}

const LF = new LineEnd(END_WITH_LF);
const CR = new LineEnd(END_WITH_CR);
const CRLF = new LineEnd(END_WITH_CRLF);

let LINE_END = {LF, CR, CRLF};

export {
	LINE_END,
	Line,
}
