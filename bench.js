function dataset() {
    return new Array(4000).fill().map(() => "fusse".repeat(5));
}

const simCount = 100_000;

const start = Date.now();

const target = "not found";

for (let sim = 0; sim < simCount; sim++) {
    const ds = dataset();

    // const len = ds.length;
    // for (let i = 0; i < len; i++) {
    //     // pretend to do work on the data elements
    //     const el = ds[i];
    //     if (el === target) {
    //         console.log("foo");
    //     }
    // }

    // ds.forEach((el) => {
    //     if (el === target) {
    //         console.log("foo");
    //     }
    // });

    while (ds.length > 0) {
        let el = ds.pop();
        if (el === target) {
            console.log("foo");
        }
    }
}

console.log("time: %f msec", Date.now() - start);

// for-loop  : 8568 msec
// .forEach  : 8551 msec
// pop()     : 8765 msec
