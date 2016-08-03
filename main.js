import fs from "fs";
import read_line from "linebyline";

let rl = read_line('./total_diff', {retainBuffer: true});
rl.on("line", (data, lineCount) => {
	console.log("line: " + lineCount + data.toString());
});