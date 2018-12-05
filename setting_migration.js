'use strict'

let DefaultSettings = {
	"enabled": true,
	"loadExtra": true,
	"safeMode": true,
	"blockedZones": [
		9950
	],

	"options": {
		"loadExtraMs": {
			"value": 1000,
			"name": "Load Extra Ms"
		},
		"loadDistance": {
			"value": 1000,
			"name": "Load Distance"
		}
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
			case 3:
				settings.options.loadDistance.value = settings.loadDistance;
				settings.options.loadDistance.name = "Load Distance";
				settings.options.loadExtraMs.value = settings.loadExtraMs;
				settings.options.loadExtraMs.name = "Load Extra Ms";
				settings.safeMode = true;
				delete settings.loadDistance;
				delete settings.loadExtraMs;
				delete settings.skipCutscenes;
				delete settings.skipCutscenesZones;
				break;
			
        }
        
        return settings;

	}
}