// <3 Pinkie Pie :3 - fork by Haku, Includes skip-cutscenes for problematic zones
module.exports = function QuickLoad(mod) {
	let lastZone = -1,
		quick = false,
		modified = false,
		lastLocation = null,
		correctLocation = null,
		correctAngle = null;

	mod.command.add(['ql','quickload'], () => {

		mod.settings.enabled = !mod.settings.enabled;
		mod.command.message('Module ' + (mod.settings.enabled ? 'en' : 'dis') + 'abled')
	});

	mod.game.on('enter_game', () => {
		lastZone = -1;
		lastLocation = null;
	})

	mod.hook('S_LOAD_TOPO', 3, {order: 100}, event => {
		quick = event.quick;
		if(mod.settings.enabled && event.zone === lastZone && (mod.settings.loadExtra || event.loc.dist3D(lastLocation) <= mod.settings.loadDistance) && !mod.settings.blockedZones.includes(event.zone)) {
			return modified = event.quick = true; 
		    };

		lastZone = event.zone;
		modified = false;
	});

	mod.hook('S_SPAWN_ME', 3, {order: 100}, event => {
		if(!quick) {
			correctLocation = event.loc;
			correctAngle = event.w;
		};

		if(modified) {
			if(!lastLocation || event.loc.dist3D(lastLocation) > mod.settings.loadDistance) {
				process.nextTick(() => { mod.send('S_ADMIN_HOLD_CHARACTER', 2, {hold: true}) })
			}
			else modified = false;

			mod.send('S_SPAWN_ME', 3, event) // Bring our character model back from the void
			mod.send('C_PLAYER_LOCATION', 5, { // Update our position on the server
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

	mod.hook('S_ADMIN_HOLD_CHARACTER', 'raw', () => !modified && undefined);

	mod.hook('C_PLAYER_LOCATION', 5, event => {
		if(correctLocation) {
			// Did we accidentally spawn under the map? Let's fix that!
			if(event.loc.z !== correctLocation.z) {
				mod.send('S_INSTANT_MOVE', 3, {
					gameId: mod.game.me.gameId,
					loc: correctLocation,
					w: correctAngle
				});
				correctLocation = null;
				return false;
			};
			correctLocation = null;
		};
	});

	mod.hook('C_PLAYER_LOCATION', 5, {order: 100, filter: {fake: null}}, event => {
		lastLocation = event.loc;
	});

	mod.hook('C_VISIT_NEW_SECTION', 'raw', () => {
		// If our client doesn't send C_PLAYER_LOCATION before this packet, then it's most likely user input
		correctLocation = null;

		if(modified) {
			setTimeout(() => { mod.send('S_ADMIN_HOLD_CHARACTER', 2, {hold: false}) }, mod.settings.loadExtraMs);
			modified = false;
		}
	})
	mod.hook('S_PLAY_MOVIE', 1, {order: 100}, event => {
		if(mod.settings.skipCutscenesZones.includes(lastZone) && mod.settings.skipCutscenes && mod.settings.enabled) {
			
			mod.send('C_END_MOVIE', 1, Object.assign({ unk: true }, event));
			return false;
		};
	});
	this.destructor = () => {mod.command.remove(['ql','quickload'])}
};