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

    const test_data = [
      {
        path: "testDiff.diff",
        length: 12781,
        lines: 222
      },
      {
        path: "total_diff.patch",
        length: 411624381,
        lines: 6641765,
      }
    ];

    let exec_count = 0;

    for(let v of test_data) {
      let line_num = 0;
      let file_name = path.join(__dirname, v.path);
  		let line_reader = new LineReader();
      let src_stream = fs.createReadStream(file_name);
      let des_stream = new MockDest();

      console.log(`read file: ${file_name}`);

      src_stream.pipe(line_reader).pipe(des_stream);
      des_stream.on('finish', function() {
        assert.equal(line_reader.GetTotalLen(), v.length);
        assert.equal(line_reader.GetLineCount(), v.lines);
        ++exec_count;
        if(exec_count === test_data.length) {
          done();
        }
      })
    }
	})
});
