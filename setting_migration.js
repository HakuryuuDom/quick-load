'use strict'

let DefaultSettings = {
	"enabled": true,
	"loadExtra": false,
	"safeMode": true,
	"blockedZones": [
		9950
	],
	"loadExtraMs": {
		"value": 1000,
		"name": "Load Extra Ms"
	},
	"loadDistance": {
		"value": 1000,
		"name": "Load Distance"
	}
	
}

module.exports = function MigrateSettings(from_ver, to_ver, settings) {
	if(from_ver === undefined) {
		return Object.assign(Object.assign({}, DefaultSettings), settings);
	} else if(from_ver === null) {
		return DefaultSettings;
	} else {
		
        if (from_ver + 1 < to_ver) {

            settings = MigrateSettings(from_ver, from_ver + 1, settings);
            return MigrateSettings(from_ver + 1, to_ver, settings);
        }

        switch(to_ver)
        {
            case 2:
            	settings.enabled = true;
				break;
			case 3: //safe mode and new config format
				settings.options = {
					loadDistance: {
						name: "Load Distance",
						value: settings.loadDistance
					},
					loadExtraMs: {
						name: "Load Extra Ms",
						value: settings.loadExtraMs
					}
				};
				settings.safeMode = true;
				delete settings.loadDistance;
				delete settings.loadExtraMs;
				delete settings.skipCutscenes;
				delete settings.skipCutscenesZones;
				break;
			case 4: //remove redundant options
				settings.loadDistance = {
					name: settings.options.loadDistance.name,
					value: settings.options.loadDistance.value
				};
				settings.loadExtraMs = {
					name: settings.options.loadExtraMs.name,
					value: settings.options.loadExtraMs.value
				};
				delete settings.options;
        }
        
        return settings;

	}
}