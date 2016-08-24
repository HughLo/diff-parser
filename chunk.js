import stream from "stream"
import events from "events"
import {Line} from "./line.js"

class MetaLine {
  constructor() {
    this.Action = ""; //Action includes "+", "-", "Merged" .etc.
    this.Data = null; //this must be a buffer object to record the actual content
  }
}

class Property {
	constructor() {
		this.Action = "";
		this.Type = "";
		this.Target = [];
	}
}

class Content {
	constructor() {
		this.Original = "";
		this.Target = "";
		this.Content = [];
	}
}

class DiffChunk {
	constructor() {
		this.Clear();
	}

  Clear() {
    this.Index = "";
    this.Contents = [];
    this.Properties = [];
  }
}

const UNKNOWN_STAGE = 0, INDEX_STAGE = 1, PROP_STAGE = 2, CONTENT_STAGE = 3;

//common actions across all stages
class CommonStage {
  constructor(emitter) {
    this.emitter = emitter;
    this._construct_handler_map();
  }

  _construct_handler_map() {
    let handler_map = new Map();
    handler_map.set("Index:", () => {
      this.emitter.emit("end");
      this.emitter.emit("start", ps.substr(7));
    });
    handler_map.set("Property change on:", () => {
      this.emitter.emit('props.start', ps.substr(21));
    })

    this.handler_map = handler_map;
  }

  //`data` is the content of line
  //`next` will be called if the `data` is not handled
  Handle(data, next) {
    let ps = data.toString().trimLeft();
    let handled = false;
    for(let [k, v] of this.handler_map) {
      if(ps.startWith(k)) {
        handled = true;
        v(); break;
      }
    }

    if(!handled) {
      next(data);
    }
  }

  Flush() {
    this.emitter.emit("end");
  }
}

class UnknownStage extends CommonStage {
  constructor(emitter) {
    super(emitter);
  }

  Handle(data, next) {
    super.Handle(data, (data) => {
      super.emitter.emit("error", "Unknonw Stage can only handle `Index` trigger");
    });
  }
}

class PropStage extends CommonStage {
  constructor(emitter) {
    super(emitter)
    _construct_handler_map();
  }

  _construct_handler_map() {
    let handler_map = new Map();
    let skip_line_handler = () => {};
    let generic_handler = (evt_name, data) => {
      return () => super.emitter.emit(evt_name, data);
    }

    handler_map.set("___", skip_line_handler);
    handler_map.set("Added", generic_handler("props.start", ps.substr(7)));
    handler_map.set("##", generic_handler("props.range", ps.substr(3)));
    handler_map.set("+", generic_handler("props.start", ps.substr(1)));
    handler_map.set("-", generic_handler("props.sub", ps.substr(1)));

    this.handler_map = handler_map;
  }

  Handle(data, next) {
    super.Handle(data, (data) => {
      let ps = data.toString();
      let handled = false;
      for(let [k, v] of this.handler_map) {
        if(ps.startWith(k)) {
          handled = true;
          v(); break; //??? Need bind here ???
        }
      }

      if(!handled) {
        super.emitter.emit("error", "unknown trigger for 'Prop' stage");
      }
    });
  }
}

class ContentStage extends CommonStage {
  constructor(emitter) {
    super(emitter)
  }

  _construct_handler_map() {
    let handler_map = new Map();
    let generic_handler = (evt_name, data) => {
      return () => super.emitter.emit(evt_name, data);
    }

    handler_map.set("===", generic_handler("content.start", ""));
    handler_map.set("---", generic_handler("content.original", ps.substr(5)));
    handler_map.set("@@", generic_handler("content.range", ps.substr(4, ps.length-5)));
    handler_map.set("+", generic_handler("content.add", ps.substr(1)));
    handler_map.set("-", generic_handler("content.sub", ps.substr(1)));
    handler_map.set(" ", generic_handler("content.env", ps.substr(1)));

    this.handler_map = handler_map;
  }

  Handle(data, next) {
    super.Handle(data, (data) => {
      let ps = data.toString();
      let handled = false;
      for(let [k, v] of this.handler_map) {
        if(ps.startWith(k)) {
          handled = true;
          v(); break; //??? Need bind here ???
        }
      }

      if(!handled) {
        super.emitter.emit("error", "unknown trigger for 'Content' stage");
      }
    });
  }
}

class StageMgr {
  constructor() {
    this.emitter = new events.EventEmitter();
    _construct_stage_map();
    this.cur_stage = this.stage_map.get(UNKNOWN_STAGE);
    this.diff_chunk = null;
    this.content = null;
    _consturct_listeners();
  }

  _construct_stage_map() {
    let stage_map = new Map();
    stage_map.set(UNKNOWN_STAGE, new UnknownStage(this.emitter));
    //stage_map.set(INDEX_STAGE, new IndexStage(this.emitter));
    stage_map.set(PROP_STAGE, new PropStage(this.emitter));
    stage_map.set(CONTENT_STAGE, new ContentStage(this.emitter));
    this.stage_map = stage_map;
  }

  _consturct_listeners() {
    this.emitter.on('start', (index_name) => {
      this.diff_chunk = new DiffChunk();
      this.diff_chunk.Index = index_name;
      //this.cur_stage = this.stage_map.get("INDEX_STAGE");
    });

    this.emitter.on('end', () => {
      super.emit('data', this.diff_chunk);
    });

    this.emitter.on('content.original', () => {
      
    });

    this.emitter.on('error', (e) => {

    })
  }

  Handle(data) {
    this.cur_stage.Handle(data);
  }

  MoveTo(s) {

  }

  Flush() {

  }
}

class ChunkReader extends stream.Transfrom {
  constructor() {
    super({objectMode: true});
    this.svn_chunk = new DiffChunk();
    this.stage_mgr = new StageMgr();
  }

  _transform(line, encoding, next) {
    this._parse_line(line.Data);
    next();
  }

  _flush(next) {
    this.stage_mgr.Flush();
    next();
  }

  _parse_line(data) {
    if(data.length === 0) return;
    let d = data.toString();
    d = d.trimeLeft();

  }
}

export {
	Property,
	Content,
	DiffChunk,
  ChunkReader,
}