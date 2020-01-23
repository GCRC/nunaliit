/**
 * @module n2es6/n2mapModule/N2LRU
 */

/**
 * @classdesc
 * The N2LRU creates a LRU cache 
 * https://chrisrng.svbtle.com/lru-cache-in-javascript
 * @api
 */


class lrunode {
	constructor(key, value) {

		if (typeof key != "undefined" && key !== null) {
			this.key = key;
		}
		if (typeof value != "undefined" && value !== null) {
			this.value = value;
		}
		this.prev = null;
		this.next = null;
	}
}
class N2LRU{

	constructor(limit) {
		this.size = 0;
		if(limit && typeof limit === 'number'){
			this.limit = limit ;
		} else {
			this.limit = 10;
		}
		this.map = {};
		this.head = null;
		this.tail = null;
	}
	setHead (node) {
		node.next = this.head;
		node.prev = null;
		if (this.head !== null) {
			this.head.prev = node;
		}
		this.head = node;
		if (this.tail === null) {
			this.tail = node;
		}
		this.size++;
		this.map[node.key] = node;
	}

	/* Change or add a new value in the cache
	 * We overwrite the entry if it already exists
	 */
	set(key, value) {
		var node = new lrunode(key, value);
		if (this.map[key]) {
			this.map[key].value = node.value;
			this.remove(node.key);
		} else {
			if (this.size >= this.limit) {
				delete this.map[this.tail.key];
				this.size--;
				this.tail = this.tail.prev;
				this.tail.next = null;
			}
		}
		this.setHead(node);
	};

	/* Retrieve a single entry from the cache */
	get (key) {
		if (this.map[key]) {
			var value = this.map[key].value;
			var node = new lrunode(key, value);
			this.remove(key);
			this.setHead(node);
			return value;
		} else {
			return null;
		}
	};

	/* Remove a single entry from the cache */
	remove (key) {
		var node = this.map[key];
		if (node.prev !== null) {
			node.prev.next = node.next;
		} else {
			this.head = node.next;
		}
		if (node.next !== null) {
			node.next.prev = node.prev;
		} else {
			this.tail = node.prev;
		}
		delete this.map[key];
		this.size--;
	};

	/* Resets the entire cache - Argument limit is optional to be reset */
	removeAll (limit) {
		this.size = 0;
		this.map = {};
		this.head = null;
		this.tail = null;
		if (typeof limit == "number") {
			this.limit = limit;
		}
	};

	/* Traverse through the cache elements using a callback function
	 * Returns args [node element, element number, cache instance] for the callback function to use
	 */
	forEach (callback) {
		var node = this.head;
		var i = 0;
		while (node) {
			callback.apply(this, [node, i, this]);
			i++;
			node = node.next;
		}
	}

	/* Returns a JSON representation of the cache */
	toJSON () {
		var json = []
		var node = this.head;
		while (node) {
			json.push({
				key : node.key, 
				value : node.value
			});
			node = node.next;
		}
		return json;
	}

	/* Returns a String representation of the cache */
	toString () {
		var s = '';
		var node = this.head;
		while (node) {
			s += String(node.key)+':'+node.value;
			node = node.next;
			if (node) {
				s += '\n';
			}
		}
		return s;
	}
}
export default N2LRU