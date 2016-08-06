'use strict'

import {LineReader} from "../line.js";
import fs from "fs";
import path from "path";
import stream from "stream";
import assert from "assert";
import readline from "linebyline";

class MockDest extends stream.Writable {
  constructor(name) {
    super({objectMode: true});
    this.lineCount = 0;
    //this.dest_file = fs.openSync(name, 'w');
  }

  _write(chunk, encoding, next) {
    ++this.lineCount;
    //this.writeLine(chunk);
    next();
  }

  writeLine(line) {
    fs.writeSync(this.dest_file, line.Data, 0, line.Data.length);
    let end_token = line.EndToken.GetBuffer();
    fs.writeSync(this.dest_file, end_token, 0, end_token.length);
  }

  GetLineCount() {
    return this.lineCount;
  }

  Flush() {
    //fs.close(this.dest_file);
  }
}

describe("test parse line", function() {
	it("should return the correct line number", function(done) {
    //disable timeout becuase the test file is so big
    this.timeout(0);

    const test_data = ["testDiff.diff", "total_diff.patch"];

    let exec_count = 0;

    for(let v of test_data) {
      let line_num = 0;
      let file_name = path.join(__dirname, v);
      let dest_name = path.join(__dirname, "dest"+v);
  		let line_reader = new LineReader({win_style: true, unix_style: true, mac_style: false});
      let src_stream = fs.createReadStream(file_name);
      let des_stream = new MockDest(dest_name);

      console.log(`read file: ${file_name}`);

      let stat = fs.statSync(file_name);
      let rl = readline(file_name);
      rl.on('line', function(line) {
        ++line_num;
      })
      rl.on('end', function() {
        src_stream.pipe(line_reader).pipe(des_stream);
        des_stream.on('finish', function() {
          console.log(`finished stream ${exec_count}`);
          assert.equal(line_reader.GetTotalLen(), stat.size, "file size dismatch");
          assert.equal(des_stream.GetLineCount(), line_num, "file lines dismatch");
          des_stream.Flush();
          ++exec_count;
          if(exec_count === test_data.length) {
            done();
          }
        })
      })
    }
	})
});
