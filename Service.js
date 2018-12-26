class Service {
    constructor({ serviceUrl }) {
        this.serviceUrl = serviceUrl;
    }

    async init() {
        this.metadata = await (await fetch(this.serviceUrl)).json();
    }

    async exec({ game, seats, bb, community }) {
        const ret = await fetch(this.serviceUrl, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json; charset=utf-8', },
            body: JSON.stringify({ game, seats, bb, community })
        });

        const json = await ret.json();
        return json;
    }
}
