
export class Property {
	constructor() {
		this.Action = "";
		this.Type = "";
		this.Target = [];
	}
}

export class Content {
	constructor() {
		this.Original = "";
		this.Target = "";
		this.Content = [];
	}
}

export class DiffChunk {
	constructor() {
		this.Index = "";
		this.Contents = [];
		this.Properties = [];
	}
}

export {
	Property,
	Content,
	DiffChunk,
}