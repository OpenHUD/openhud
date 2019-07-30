const INITIAL_SERVICES = [
    'https://us-central1-my-random-scripts.cloudfunctions.net/openhud-nuts/',
    'https://us-central1-my-random-scripts.cloudfunctions.net/openhud-aof/',
    'https://us-central1-my-random-scripts.cloudfunctions.net/openhud-rfi/',
    'https://us-central1-my-random-scripts.cloudfunctions.net/openhud-rcp/',
    'https://us-central1-my-random-scripts.cloudfunctions.net/openhud-erh/',
    'https://us-central1-my-random-scripts.cloudfunctions.net/openhud-propokertools/'
];

class ServicesManager {
    constructor() {
        this.services = {};
    }

    async getStoredServices() {
        const storage = await new Promise(res => chrome.storage.sync.get(['services'], res));
        const services = storage.services || [];

        INITIAL_SERVICES.forEach(service => {
            if (services.indexOf(service) === -1) services.push(service);
        });

        return services || [];
    }

    async getAllServices() {
        const services = await this.getStoredServices();

        await Promise.all(services.map(async serviceUrl => {
            if (this.services[serviceUrl]) return Promise.resolve(null);
            this.services[serviceUrl] = new Service({ serviceUrl });
            await this.services[serviceUrl].init();
        }));

        return Object.values(this.services);
    }

    async getActiveServices() {
        let services = await this.getStoredServices();
        const storage = await new Promise(res => chrome.storage.sync.get(['disabled'], res));
        services = services.filter(s => (storage.disabled || []).indexOf(s) === -1);

        const p = await Promise.all(services.map(async serviceUrl => {
            if (this.services[serviceUrl]) return this.services[serviceUrl];
            this.services[serviceUrl] = new Service({ serviceUrl });
            await this.services[serviceUrl].init();
            return this.services[serviceUrl];
        }));

        return p;
    }

    async addService(url) {
        const service = new Service({ serviceUrl: url });

        await service.init();
        this.services[url] = service;
        await new Promise(res => chrome.storage.sync.set({services: Object.keys(this.services)}, res));
        return service;
    }

}
