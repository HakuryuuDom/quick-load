// <3 Pinkie Pie :3 - fork by Haku, Includes skip-cutscenes for problematic zones
const Vec3 = require('tera-vec3');

module.exports = function QuickLoad(dispatch) {
	const config = require('./config.json');
	let lastZone = -1,
		quick = false,
		modified = false,
		lastLocation = new Vec3(null),
		correctLocation = null,
		myGameId = null,
		correctAngle = null

	dispatch.hook('S_LOGIN', 'raw', () => {
		lastZone = -1
		lastLocation = null
	})

	dispatch.hook('S_LOAD_TOPO', 3, {order: 100}, event => {
		quick = event.quick;
		loc = new Vec3(event.loc);

		if(event.zone === lastZone && (config.loadExtra || loc.dist3D(lastLocation) <= config.loadDistance) && !config.blockedZones.includes(event.zone)) {
		        return modified = event.quick = true;
		        
		    };

		lastZone = event.zone
		modified = false
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
		if(config.skipCutscenesZones.includes(lastZone) && config.skipCutscenes) {
			
			dispatch.toServer('C_END_MOVIE', Object.assign({ unk: true }, event));
			return false;
		}
	});
}
