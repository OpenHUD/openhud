const $ = window.jQuery;

const games = {
    'plo': 'PLO',
    'nlh': 'NLH',
    'aof-holdem': 'AoF Holdem',
    'aof-omaha': 'AoF Omaha',
};

async function go() {
    let disabled = [];
    let services = [];
    const servicesManager = new ServicesManager();
    const allServices = await servicesManager.getAllServices();
    let activeServices = await servicesManager.getActiveServices();

    for (let i = 0 ; i < allServices.length ; i++) {
        const comp = allServices[i];
        const elm = $(
            '<div style="display:flex; align-items: center; padding: 6px 0px;">' +
            '   <div class="mdc-switch">' +
            '       <div class="mdc-switch__track"></div>' +
            '       <div class="mdc-switch__thumb-underlay">' + 
            '           <div class="mdc-switch__thumb">' +
            '               <input type="checkbox" id="switch-'+i+'" class="mdc-switch__native-control" role="switch" />' +
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
            '   <div>' + comp.metadata.games.map(g => games[g]).join(',') + '</div>' +
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
}

go();
