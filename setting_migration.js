'use strict'

let DefaultSettings = {
	"enabled": true,
	"loadDistance": 1000,
	"loadExtra": true,
	"loadExtraMs": 1000,
	"blockedZones": [
		9950
	],
	"skipCutscenes": false,
	"skipCutscenesZones": [
		9735,
		9935
	]
}

module.exports = function MigrateSetting(from_ver, to_ver, settings) {
	if(from_ver === undefined) {
		return Object.assign(Object.assign({}, DefaultSettings), settings);
	} else if(from_ver === null) {
			return DefaultSettings;
	} else {
		        // Migrate from older version (using the new system) to latest one
        if (from_ver + 1 < to_ver) {
            // Recursively upgrade in one-version steps
            settings = MigrateSettings(from_ver, from_ver + 1, settings);
            return MigrateSettings(from_ver + 1, to_ver, settings);
        }
        
        // If we reach this point it's guaranteed that from_ver === to_ver - 1, so we can implement
        // a switch for each version step that upgrades to the next version. This enables us to
        // upgrade from any version to the latest version without additional effort!
        switch(to_ver)
        {
            case 2:
             settings.enabled = true;
             break;
        }
        
        return settings;

	}
}