const $ = window.jQuery;

const INITIAL_SERVICES = [
    'https://us-central1-my-random-scripts.cloudfunctions.net/openhud-nuts/',
    'https://us-central1-my-random-scripts.cloudfunctions.net/openhud-aof/',
    'https://us-central1-my-random-scripts.cloudfunctions.net/openhud-rfi/',
    'https://us-central1-my-random-scripts.cloudfunctions.net/openhud-rcp/'
];

const games = {
    'plo': 'PLO',
    'nlh': 'NLH',
    'aof-holdem': 'AoF Holdem',
    'aof-omaha': 'AoF Omaha',
};

async function go() {
    let disabled = [];
    let services = [];
    try {
        const data = await new Promise(res => chrome.storage.sync.get(['disabled', 'services'], res));
        disabled = data.disabled || [];
        services = data.services || INITIAL_SERVICES;
        chrome.storage.sync.set({services});
    } catch(e) {}

    for (let i = 0 ; i < services.length ; i++) {
        const func = async () => {
            const comp = services[i];
            const index = i;
            const compMetadata = await (await fetch(comp)).json();
            console.log(compMetadata);
            const elm = $(
                '<div style="display:flex; align-items: center; padding: 6px 0px;">' +
                '   <div class="mdc-switch">' +
                '       <div class="mdc-switch__track"></div>' +
                '       <div class="mdc-switch__thumb-underlay">' + 
                '           <div class="mdc-switch__thumb">' +
                '               <input type="checkbox" id="switch-'+index+'" class="mdc-switch__native-control" role="switch" />' +
                '           </div>' +
                '       </div>' +
                '   </div>' +
                '   <div style="margin-left:12px; flex: 1">' +
                '       <div>' + compMetadata.title + '</div>' +
                '       <div style="font-size: 11px">' +
                (compMetadata.author.url ? 
                    '       By <a style="text-decoration: none;color: black;" href="' + compMetadata.author.url + '" target="_blank">' + compMetadata.author.name + '</a>' : 
                    '       By ' + compMetadata.author.name) + 
                (compMetadata.author.email ? 
                    '           (<a style="text-decoration: none;color: black;" href="mailto:' + compMetadata.author.email + '"><i class="far fa-envelope"></i></a>)' :
                    '') +
                '       </div>' +
                '   </div>' +
                '   <div>' + compMetadata.games.map(g => games[g]).join(',') + '</div>' +
                '</div>'
            );
            elm.appendTo($('#installed-services'));
            const a = mdc.switchControl.MDCSwitch.attachTo(elm.find('.mdc-switch')[0]);
            a.checked = disabled.indexOf(comp) === -1;
            elm.find('input').on('change', (e) => {
                try {
                    if (!e.target.checked) {
                        disabled = [...disabled, comp];
                    } else {
                        disabled = disabled.filter(d => d != comp);
                    }
                    chrome.storage.sync.set({disabled});
                } catch(e) {}
            });
        };
        await func();
    }
}

go();
