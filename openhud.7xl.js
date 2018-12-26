const Timeouts = {
    mainLoop: 1000,
};

lastHandTime = new Date().getTime();
const SESSION_ID = new Date().getTime();
let handNum = 0;
let removeChipsNewHand = false;

nodeInsertedCallback = (event) => {
    if (event.relatedNode.classList.contains('dealingCard')) {
        if (lastHandTime + 3000 > new Date().getTime()) return;
        lastHandTime = new Date().getTime();

        handNum++;
        console.log('New hand');
        removeChipsNewHand = true;
    }
};

document.addEventListener('DOMNodeInserted', nodeInsertedCallback);

function getTableName() {
    return jQuery('.brandIcon').text().split('-')[0].replace(/\s/g, '');
}

function getBB() {
    const text = jQuery('.brandIcon').text();
    if (text.indexOf('$') > -1) {
        return parseFloat(text.split('$').pop());
    } else if (text.indexOf('¥') > -1) {
        return parseFloat(text.split('¥').pop());
    }
    return null;
}

function getGame() {
    const text = jQuery('.threeBlindsInfomation').text();
    if (text.indexOf('Omaha') > -1) return 'plo';
    if (text.indexOf('Hold\'em') > -1) return 'nlh';
    if (text.indexOf('Chinese Rush') > -1) return 'nlh';
    return 'Unknown';
}

function isRiver() {
    return !!(jQuery('.card.river')[0])
}

function getFlopCards() {
    try {
        s= ''; 
        for (v = 0 ; v < 3 ; v++) {
            s = s + jQuery(`.card.flop:nth-child(${v+1}) .open`)[0].classList[2]; 
        }
        s = s.toUpperCase().replace(/DIAMOND/g, 'd').replace(/CLUB/g, 'c').replace(/HEART/g, 'h').replace(/SPADE/g, 's').replace(/10/g, 'T'); 
        return s.split('').reverse().join('').match(/(..?)/g);
    } catch(e) {
        return null;
    }
}

function getTurnCard() {
    try {
        s= jQuery('.card.turn .open')[0].classList[2]; 
        s = s.toUpperCase().replace(/DIAMOND/g, 'd').replace(/CLUB/g, 'c').replace(/HEART/g, 'h').replace(/SPADE/g, 's').replace(/10/g, 'T'); 
        return s.split('').reverse().join('').match(/(..?)/g);
    } catch(e) {
        return null;
    }
}

function getRiverCard() {
    try {
        s= jQuery('.card.river .open')[0].classList[2]; 
        s = s.toUpperCase().replace(/DIAMOND/g, 'd').replace(/CLUB/g, 'c').replace(/HEART/g, 'h').replace(/SPADE/g, 's').replace(/10/g, 'T'); 
        return s.split('').reverse().join('').match(/(..?)/g);
    } catch(e) {
        return null;
    }
}

function getSeatCards(seatNum) {
    const xpath = `//ul[contains(@class,"seatListWrap")]//li[contains(@class, "seatList")][${seatNum}]//figure[contains(@class, "open")]`;
    const elms = xPath(xpath);

    if (elms.length === 0) {
        return null;
    }

    s= ''; 
    for (v = 0 ; v < elms.length ; v++) {
        s = s + elms[v].classList[2]; 
    }
    s = s.toUpperCase().replace(/DIAMOND/g, 'd').replace(/CLUB/g, 'c').replace(/HEART/g, 'h').replace(/SPADE/g, 's').replace(/10/g, 'T'); 
    return s.split('').reverse().join('').match(/(..?)/g);
}

function getSeatInformation() {
    const BASE_XPATH = '//ul[contains(@class,"seatListWrap")]//li[contains(@class, "seatList")]';
    const numSeats = xPath(BASE_XPATH).length;
    let seats = [];
    let dealer = 0;
    for (let i = 0 ; i < numSeats ; i++) {

        const elm = xPath(`${BASE_XPATH}[${i+1}]`)[0];
        const openSeat = !!xPath(`${BASE_XPATH}[${i+1}]//dl[contains(@class,"seatOpen")]`)[0];
        if (elm.classList.contains('dealer')) {
            dealer = i;
        }

        if (!openSeat) {
            const isSittingOut = !!xPath(`${BASE_XPATH}[${i+1}]//dl[contains(@class,"sittingOut")]`)[0];
            const playerName = xPath(`${BASE_XPATH}[${i+1}]//span[contains(@class,"nickname")]`)[0].innerText;

            if (!isSittingOut) {
                const stack = parseFloat(xPath(`${BASE_XPATH}[${i+1}]//strong[contains(@class,"money")]`)[0].innerText.substr(1)) || 0;

                const pot = (() => {
                    const elm = xPath(`${BASE_XPATH}[${i+1}]//span[contains(@class,"pot")]`)[0];
                    return elm ? parseFloat(elm.innerText.substr(1)) || 0 : 0;
                })();

                const isMe = elm.classList.contains('myPlaySeat');
                const isFolded = !!xPath(`${BASE_XPATH}[${i+1}]//dl[contains(@class,"folded")]`)[0];

                const cards = getSeatCards(i + 1);

                if (((cards || []).length == 0) && isMe && !isFolded) {
                    // Just sat down
                    seats.push(null);
                } else {
                    seats.push({
                        playerName,
                        isMe,
                        isFolded,
                        stack,
                        pot,
                        cards: cards || []
                    });
                }
            }
        } else {
            seats.push(null);
        }
    }

    let i = 0;
    while ((seats[(seats.length + dealer - i) % seats.length] === null) && (i < seats.length)) {
        i++;
    }

    if (seats[(seats.length + dealer - i) % seats.length]) {
        seats[(seats.length + dealer - i) % seats.length].isButton = true;
    }

    return seats.filter(s => !!s);
}

const servicesManager = new ServicesManager();

async function start() {

    // TODO: Check for changes
    const flop = getFlopCards() || [];
    const turn = getTurnCard() || [];
    const river = getRiverCard() || [];
    const seats = getSeatInformation();
    const bb = getBB();

    if ((seats.length > 0) && (handNum > 0)) {
        try {

            const services = await servicesManager.getActiveServices();

            const servicesResult = await Promise.all(services.map(async service => {
                const result = await service.exec({
                    game: getGame(),
                    seats,
                    bb,
                    community: [...flop, ...turn, ...river]
                });

                return Promise.resolve({
                    title: service.metadata.title,
                    result
                });
            }));

            const tooltips = jQuery('.playerTooltip') || [];
            for (let i = 0 ; i < tooltips.length ; i++) {
                tooltips[i].style.visibility = 'hidden';
            }

            const htmls = {};

            servicesResult.forEach(({title, result}) => Object.keys(result.players).forEach(playerName => {
                htmls[playerName] = (htmls[playerName] || '') + '<div><b>' + title + '</b><div>' + result.players[playerName] + '</div></div>';
            }));
        
            Object.keys(htmls).forEach(playerName => {
                try {
                    const html = htmls[playerName];
                    let elm = xPath(`//span[contains(@class, "nickname") and contains(text(), "${playerName}")]/parent::*/parent::*/dd[contains(@class, "playerTooltip")]`)[0];
                    if (!elm) {
                        const _parent = xPath(`//span[contains(@class, "nickname") and contains(text(), "${playerName}")]/parent::*/parent::*`)[0];
                        if (!_parent) return;
                        elm = (jQuery('<dd class="playerTooltip" style="visibility: hidden;"></dd>').appendTo(_parent))[0];
                    }

                    elm.style.visibility = 'inherit';
                    elm.style.fontSize = '12px';
                    elm.style.padding = '12px';
                    elm.style.opacity = '0.6';
                    elm.innerHTML = html;
                } catch(e) {
                    console.error('No playerTooltip', playerName, e);
                }
            });
        } catch (e) {
            console.error('Error', e);
        }
    }

    AoFGoTimer = setTimeout(() => start(), Timeouts.mainLoop);
}

setTimeout(() => start(), 3000);
