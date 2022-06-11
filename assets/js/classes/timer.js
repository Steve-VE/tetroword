class Timer {
    constructor(count, params={}) {
        if (typeof count === 'object') {
            params = count;
            count = undefined;
        }
        this.initialDelay = params.count || count;
        this.currentDelay = 0;
        this.count = 0;
        this.minimunCount = params.minimunCount || 1;
    }

    decrease(gap=1) {
        this.count = Math.max(this.count - gap, 0);
    }

    lowerDelay(delta=0.5) {
        this.currentDelay *= delta;
        this.count = Math.max(this.minimunCount, this.currentDelay);
    }

    reset() {
        this.currentDelay = this.initialDelay;
        this.count = this.currentDelay;
    }

    get finished() {
        return this.count === 0;
    }
}
