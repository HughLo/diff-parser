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

	}
};