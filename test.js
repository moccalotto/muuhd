class TestParent {
    someString = "foo";

    constructor() {
        console.log(this.someString);
    }
}

class TestChild extends TestParent {
    get someString() {
        return "bar";
    }

    set someString(_val) {
        console.log("was I called?");
    }

    constructor() {
        super();
        this.someString = "baz";
        console.log(this.someString);
    }
}

console.log(Function.prototype.toString.call(TestChild));
