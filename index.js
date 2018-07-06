// <3 Pinkie Pie :3 - fork by Haku, Includes skip-cutscenes for problematic zones
const Command = require('command');

module.exports = function QuickLoad(dispatch) {
	const command = Command(dispatch);
	const config = require('./config.json');
	let lastZone = -1,
		quick = false,
		modified = false,
		lastLocation = null,
		correctLocation = null,
		myGameId = null,
		correctAngle = null,
		enabled = true;

	command.add(['ql','quickload'], () => {
		if(enabled) {
			enabled = false;
			command.message('[quick-load] Module disabled.');
		} else if(!enabled) {
			enabled = true;
			command.message('[quick-load] Module enabled.');
		};
	});

	dispatch.hook('S_LOGIN', 'raw', () => {
		lastZone = -1;
		lastLocation = null;
	})

	dispatch.hook('S_LOAD_TOPO', 3, {order: 100}, event => {
		quick = event.quick;
		if(enabled && event.zone === lastZone && (config.loadExtra || event.loc.dist3D(lastLocation) <= config.loadDistance) && !config.blockedZones.includes(event.zone)) {
			return modified = event.quick = true; 
		    };

		lastZone = event.zone;
		modified = false;
	});

	dispatch.hook('S_SPAWN_ME', 3, {order: 100}, event => {
		myGameId = event.gameId;
		if(!quick) {
			correctLocation = event.loc;
			correctAngle = event.w;
		};

		if(modified) {
			if(!lastLocation || event.loc.dist3D(lastLocation) > config.loadDistance) {
				process.nextTick(() => { dispatch.toClient('S_ADMIN_HOLD_CHARACTER', 2, {hold: true}) })
			}
			else modified = false;

			dispatch.toClient('S_SPAWN_ME', 3, event) // Bring our character model back from the void
			dispatch.toServer('C_PLAYER_LOCATION', 5, { // Update our position on the server
				loc: event.loc,
				w: event.w,
				lookDirection: 0,
				dest: event.loc,
				type: 7,
				jumpDistance: 0,
				inShuttle: 0,
				time: 0
			});
		};
	});

	dispatch.hook('S_ADMIN_HOLD_CHARACTER', 'raw', () => !modified && undefined);

	dispatch.hook('C_PLAYER_LOCATION', 5, event => {
		if(correctLocation) {
			// Did we accidentally spawn under the map? Let's fix that!
			if(event.loc.z !== correctLocation.z) {
				dispatch.toClient('S_INSTANT_MOVE', 3, {
					gameId: myGameId,
					loc: correctLocation,
					w: correctAngle
				});
				correctLocation = null;
				return false;
			};
			correctLocation = null;
		};
	});

	dispatch.hook('C_PLAYER_LOCATION', 5, {order: 100, filter: {fake: null}}, event => {
		lastLocation = event.loc;
	});

	dispatch.hook('C_VISIT_NEW_SECTION', 'raw', () => {
		// If our client doesn't send C_PLAYER_LOCATION before this packet, then it's most likely user input
		correctLocation = null;

		if(modified) {
			setTimeout(() => { dispatch.toClient('S_ADMIN_HOLD_CHARACTER', 2, {hold: false}) }, config.loadExtraMs);
			modified = false;
		}
	})
	dispatch.hook('S_PLAY_MOVIE', 1, {order: 100}, event => {
		if(config.skipCutscenesZones.includes(lastZone) && config.skipCutscenes && enabled) {
			
			dispatch.toServer('C_END_MOVIE', 1, Object.assign({ unk: true }, event));
			return false;
		};
	});
	this.destructor = () => {command.remove(['ql','quickload'])}
};