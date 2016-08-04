'use strict'

import {LineReader} from "../line.js";
import fs from "fs";
import path from "path";
import stream from "stream";
import assert from "assert";

class MockDest extends stream.Writable {
  constructor() {
    super({objectMode: true});
    this.lineCount = 0;
  }

  _write(chunk, encoding, next) {
    ++this.lineCount;
    next();
  }

  GetLineCount() {
    return this.lineCount;
  }
}

describe("test parse line", function() {
	it("should return the correct line number", function(done) {
    //disable timeout becuase the test file is so big
    this.timeout(0);

    let line_num = 0;
		let line_reader = new LineReader();
    let src_stream = fs.createReadStream(path.join(__dirname, "total_diff.patch"));
    let des_stream = new MockDest();

    console.log("read file: " + path.join(__dirname, "total_diff.patch"));

    src_stream.pipe(line_reader).pipe(des_stream);
    des_stream.on('finish', function() {
      assert.equal(des_stream.GetLineCount(), 6641765);
      assert.equal(line_reader.GetTotalLen(), 411624381);
      done();
    })
	})
});
