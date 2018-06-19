// <3 Pinkie Pie :3 - fork by Haku, Includes skip-cutscenes for problematic zones
const Vec3 = require('tera-vec3');

module.exports = function QuickLoad(dispatch) {
	const config = require('./config.json');
	let zone = -1,
		quick = false,
		modified = false,
		lastLocation = new Vec3(null),
		correctLocation = null,
		myGameId = null,
		correctAngle = null

	dispatch.hook('S_LOGIN', 'raw', () => {
		zone = -1
		lastLocation = null
	})

	dispatch.hook('S_LOAD_TOPO', 3, {order: 100}, event => {
		quick = event.quick;
		loc = new Vec3(event.loc);
		console.log('[quick-load] event.zone: ' + event.zone);
		console.log('[quick-load] zone: ' + zone);
		console.log('[quick-load] config.loadExtra: ' + config.loadExtra);
		console.log('[quick-load] loc.dist3D: ' + loc.dist3D(lastLocation));
		console.log('[quick-load] config.loadDistance: ' + config.loadDistance);
		console.log('[quick-load] config.blockedZones: ' + config.blockedZones);

		if(event.zone === zone && (config.loadExtra || loc.dist3D(lastLocation) <= config.loadDistance) && event.zone !== config.blockedZones) {
		        return modified = event.quick = true;
		        console.log('[quick-load] bypassing loading screen.');
		    };

		zone = event.zone
		modified = false
		console.log('[quick-load] Ready for next loading screen.');
	});

	dispatch.hook('S_SPAWN_ME', 3, {order: 100}, event => {
		loc = new Vec3(event.loc);
		if(!quick) {
			correctLocation = new Vec3(event.loc);
			correctAngle = event.w
			myGameId = event.gameId
		}

		if(modified) {
			if(!lastLocation || loc.dist3D(lastLocation) > config.loadDistance) {
				process.nextTick(() => { dispatch.toClient('S_ADMIN_HOLD_CHARACTER', 2, {hold: true}) })
				console.log('[quick-load] Distance is too far or player location is not set.');
			}
			else modified = false

			dispatch.toClient('S_SPAWN_ME', 3, event) // Bring our character model back from the void
			dispatch.toServer('C_PLAYER_LOCATION', 5, { // Update our position on the server
				loc: new Vec3(loc),
				w: event.w,
				unk2: 0,
				dest: new Vec3(loc),
				type: 7,
				jumpDistance: 0,
				inShuttle: 0,
				time: 0
			});
			console.log('[quick-load] Updating server position.')
		}
	})

	dispatch.hook('S_ADMIN_HOLD_CHARACTER', 'raw', () => !modified && undefined)

	dispatch.hook('C_PLAYER_LOCATION', 5, event => {
		loc = new Vec3(event.loc)
		if(correctLocation) {
			// Did we accidentally spawn under the map? Let's fix that!
			if(loc.z !== correctLocation.z) {
				dispatch.toClient('S_INSTANT_MOVE', 3, {
					gameId: myGameId,
					loc: new Vec3(correctLocation),
					w: correctAngle
				});
				console.log('[quick-load] Fixing player location. Current loc: ' + loc.z.toString() + '. Correct loc: ' + correctLocation.z.toString() + '.');
				correctLocation = null
				return false
			}
			correctLocation = null
		}
	})

	dispatch.hook('C_PLAYER_LOCATION', 5, {order: 100, filter: {fake: null}}, event => {
		lastLocation = new Vec3(event.loc);
	})

	dispatch.hook('C_VISIT_NEW_SECTION', 'raw', () => {
		// If our client doesn't send C_PLAYER_LOCATION before this packet, then it's most likely user input
		correctLocation = null

		if(modified) {
			setTimeout(() => { dispatch.toClient('S_ADMIN_HOLD_CHARACTER', 2, {hold: false}) }, config.loadExtraMs)
			modified = false
		}
	})
	dispatch.hook('S_PLAY_MOVIE', 1, {order: 100}, event => {
		if(zone === config.skipCutscenesZones && config.skipCutscenes) {
			
			dispatch.toServer('C_END_MOVIE', Object.assign({ unk: true }, event));
			return false;
		}
	});
}
