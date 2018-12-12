jQuery = typeof(jQuery) === 'undefined' ? $ : jQuery;

xPath = (xpath) => {
    try {
        const iter = document.evaluate(xpath, document);
        let elm = iter.iterateNext(); 
        const results = [];
        while (elm) {
            results.push(elm);
            elm = iter.iterateNext(); 
        }

        return results;
    } catch(e) {
        console.error(e);
        return [];
    }
}

async function sleep(timeout) {
    await new Promise(res => setTimeout(res, timeout));
}

async function waitFor(func, timeout = 30000, pollDuration = 100) {
    while (timeout >= 0) {
        if (func()) {
            break;
        }

        const waitDuration = Math.min(timeout, pollDuration);
        await sleep(waitDuration);
        timeout -= waitDuration;
    }
}
