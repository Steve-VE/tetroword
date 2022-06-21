class Timer {
    constructor(count, params={}) {
        if (typeof count === 'object') {
            params = count;
            count = undefined;
        }
        this._onIsOverCallback = params.whenIsOver;
        this.initialDelay = params.count || count;
        this.currentDelay = 0;
        this.count = 0;
        this.minimunCount = params.minimunCount || 1;
    }

    addTime(percent) {
        this.count += this.currentDelay * percent;
        this.count = Math.min(this.count, this.currentDelay);
    }

    decrease(gap=1) {
        this.count = Math.max(this.count - gap, 0);
    }

    lowerDelay(delta=0.5) {
        this.currentDelay *= delta;
        this.count = Math.max(this.minimunCount, this.currentDelay);
    }

    process() {
        if (this.finished) {
            if (this._onIsOverCallback) {
                this._onIsOverCallback();
            }
            this.reset();
        } else {
            this.decrease();
        }
    }

    reset() {
        this.currentDelay = this.initialDelay;
        this.count = this.currentDelay;
    }

    set(newDelay) {
        this.initialDelay = newDelay;
    }

    get completion() {
        return this.count / this.currentDelay;
    }

    get finished() {
        return this.count === 0;
    }
}
