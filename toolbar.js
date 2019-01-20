const $ = window.jQuery;

const games = {
    'plo': 'PLO',
    'nlh': 'NLH',
    'aof-holdem': 'AoF Holdem',
    'aof-omaha': 'AoF Omaha',
};

const BETS_TO_STR = {
    'no-limit': 'NL{{shortname}}',
    'pot-limit': 'PL{{shortname}}',
    'allin-or-fold': 'AoF {{fullname}}',
    '*':'{{fullname}}'
}

const TYPE_TO_SHORT_STR = {
    'texas-holdem': 'H',
     'omaha-holdem': 'O',
}

const TYPE_TO_LONG_STR = {
    'texas-holdem': 'Holdem',
     'omaha-holdem': 'Omaha',
}

const FORMAT_TO_STR = {
    'cash': ' (cash games only)',
    'tournament': ' (tournaments only)',
    '*': ''
}

$('#addservicebutton').on('click', showAddServicePanel);
$('#addservicepane input').on('keydown', inputKeyDown);
$('#addservicepane #okbutton').on('click', onAddService);
const servicesManager = new ServicesManager();

function gamesToString(games) {
    return games.map(g => {
        const bet = (BETS_TO_STR[g.bet] || '').replace(/{{shortname}}/, TYPE_TO_SHORT_STR[g.type]).replace(/{{fullname}}/, TYPE_TO_LONG_STR[g.type]);
        return (bet || '') + (FORMAT_TO_STR[g.format] || '');
    }).join(',');
}

async function go() {
    let disabled = [];
    let services = [];
    const allServices = await servicesManager.getAllServices();
    let activeServices = await servicesManager.getActiveServices();

    for (let i = 0 ; i < allServices.length ; i++) {
        const comp = allServices[i];
        addServiceToDOM(comp, activeServices);
    }
}

async function addServiceToDOM(comp, activeServices) {
    const elm = $(
        '<div style="display:flex; align-items: center; padding: 6px 0px;">' +
        '   <div class="mdc-switch">' +
        '       <div class="mdc-switch__track"></div>' +
        '       <div class="mdc-switch__thumb-underlay">' + 
        '           <div class="mdc-switch__thumb">' +
        '               <input type="checkbox" id="switch-'+Math.random()+'" class="mdc-switch__native-control" role="switch" />' +
        '           </div>' +
        '       </div>' +
        '   </div>' +
        '   <div style="margin-left:12px; flex: 1">' +
        '       <div>' + comp.metadata.title + '</div>' +
        '       <div style="font-size: 11px">' +
        (comp.metadata.author.url ? 
            '       By <a style="text-decoration: none;color: black;" href="' + comp.metadata.author.url + '" target="_blank">' + comp.metadata.author.name + '</a>' : 
            '       By ' + comp.metadata.author.name) + 
        (comp.metadata.author.email ? 
            '           (<a style="text-decoration: none;color: black;" href="mailto:' + comp.metadata.author.email + '"><i class="far fa-envelope"></i></a>)' :
            '') +
        '       </div>' +
        '   </div>' +
        '   <div>' + gamesToString(comp.metadata.games) + '</div>' +
        '</div>'
    );
    elm.appendTo($('#installed-services'));
    const a = mdc.switchControl.MDCSwitch.attachTo(elm.find('.mdc-switch')[0]);
    a.checked = activeServices.indexOf(comp) > -1;
    elm.find('input').on('change', (e) => {
        try {
            if (!e.target.checked) {
                activeServices = activeServices.filter(s => s != comp);
            } else {
                activeServices = [...activeServices, comp];
            }
            const disabled = allServices.filter(s => activeServices.indexOf(s) === -1).map(s => s.serviceUrl);
            chrome.storage.sync.set({ disabled });
        } catch(e) {}
    });
}

function showAddServicePanel() {
    $('#addservicebutton').css('display', 'none');
    $('#addservicepane').css('display', 'block');
    $('#addservicepane input').focus();
}

function inputKeyDown(e) {
    $('#addservicepane #errormsg').css('display', 'none');
    if (e.keyCode === 13) {
        onAddService();
    }
}

async function onAddService() {
    const url = $('#addservicepane input').val();
    try {
        const service = await servicesManager.addService('https://' + url);
        let activeServices = await servicesManager.getActiveServices();
        addServiceToDOM(service, activeServices);
        $('#addservicepane').css('display', 'none');
        $('#addservicebutton').css('display', 'block');
    } catch(e) {
        $('#addservicepane #errormsg').css('display', 'block');
    }
}

go();
