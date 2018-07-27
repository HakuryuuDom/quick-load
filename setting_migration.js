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
		settings.enabled = true;
		return Object.assign(Object.assign({}, DefaultSettings), settings);
	} else if(from_ver === null) {
			return DefaultSettings;
	} else {
		throw new Error('So far there is only one settings version and this should never be reached!');
	}
}