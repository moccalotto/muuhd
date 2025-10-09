class Nugga {
    mufassa = 22;
    constructor() {
        this.fjæsing = 22;
        console.debug(Object.prototype.hasOwnProperty.call(this, "fjæsing"));
    }

    diller(snaps = this.fjæsing) {
        console.log(snaps);
    }
}

class Dugga extends Nugga {}

const n = new Dugga();

console.log(n, n.diller(), n instanceof Dugga);
