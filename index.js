// <3 Pinkie Pie :3 - fork by Haku
module.exports = function QuickLoad(mod) {
    
    let lastZone = null;
    let isQuick = false;
    let isModified = false;
    let lastLocation = null;
    let correctLocation = null;

    function resetAll() {
        lastZone = null;
        lastLocation = null;
    }

    function message(text) {
        mod.command.message(text);
    }

    function parseArgs(option, data) {
        let input = Number(data);
        if (isNaN(input)) {
            message(option.name + ': ' + option.value.toString());
            return option.value;
        }
        else if (input <= 0) {
            message('Error: ' + option.name + ' cannot be negative or zero.');
            return option.value;
        }
        else {
            message(option.name + ' set to: ' + input.toString() + '.');
            return input;
        }
    }

    function updatePos(event) {
        mod.send('C_PLAYER_LOCATION', 5, {
            loc: event.loc,
            w: event.w || lastLocation.w || 0,
            lookDirection: 0,
            dest: event.loc,
            type: 7,
            jumpDistance: 0,
            inShuttle: false,
            time: 0
        })
    }

    mod.command.add(['ql', 'quickload'], {
        $none() {
            mod.settings.enabled = !mod.settings.enabled;
            message('Module ' + (mod.settings.enabled ? 'en' : 'dis') + 'abled');
            mod.saveSettings();
        },

        $default(arg) {
            message('Error: ' + arg + ' is not a valid command!');
        },

        block(zone) {
            let addZone = !zone ? lastZone : Number(zone);
            if (isNaN(addZone)) {
                message('Error: ' + zone.toString() + ' is not a number!');
            }
            else if (!mod.settings.blockedZones.includes(addZone)) {
                mod.settings.blockedZones.push(addZone);
                message('Added zone ' + addZone.toString() + ' to blocked zone list.');
            } else {
                message('Error: Zone ' + addZone.toString() + ' is already being blocked.');
            }
            mod.saveSettings();

        },

        unblock(zone) {
            let delZone = !zone ? lastZone : Number(zone);
            if (isNaN(delZone)) {
                message('Error: ' + zone.toString() + ' is not a number!');
            }
            else if (mod.settings.blockedZones.includes(delZone)) {
                mod.settings.blockedZones.splice(mod.settings.blockedZones.indexOf(delZone), 1);
                message('Removed zone ' + delZone.toString() + ' from blocked zone list.');
            }
            else {
                message('Error: Zone ' + delZone.toString() + ' is not currently being blocked.');
            }
            mod.saveSettings();
        },

        loaddistance(distance) {
            mod.settings.loadDistance.value = parseArgs(mod.settings.loadDistance, distance);
            mod.saveSettings();
        },

        loadextrams(ms) {
            mod.settings.loadExtraMs.value = parseArgs(mod.settings.loadExtraMs, ms);
            mod.saveSettings();
        },

        loadextra() {
            mod.settings.loadExtra = !mod.settings.loadExtra;
            message('Load Extra: ' + (mod.settings.loadExtra ? 'en' : 'dis') + 'abled');
            mod.saveSettings();
        },

        safe() {
            mod.settings.safeMode = !mod.settings.safeMode;
            message('Safe Mode: ' + (mod.settings.safeMode ? 'en' : 'dis') + 'abled');
            mod.saveSettings();
        }

    });

    mod.game.on('enter_game', () => {
        resetAll();
    });

    mod.hook('S_LOAD_TOPO', 3, { order: 100 }, event => {
        isQuick = event.quick;
        if (mod.settings.enabled && event.zone === lastZone && (mod.settings.loadExtra || event.loc.dist3D(lastLocation.loc) <= mod.settings.loadDistance) && !mod.settings.blockedZones.includes(event.zone)) {
            updatePos(event); //ladder fix
            mod.send('S_INSTANT_MOVE', 3, {
                gameId: mod.game.me.gameId,
                loc: event.loc,
                w: lastLocation.w || 0
            })
            
            return isModified = event.quick = true;
        }

        lastZone = event.zone;
        isModified = false;
    });

    mod.hook('S_SPAWN_ME', 3, event => {
        if(!isQuick || mod.settings.safeMode) correctLocation = event;
        if(isModified) {
            if(!lastLocation || event.loc.dist3D(lastLocation.loc) > mod.settings.loadDistance.value) {
                process.nextTick(() => { mod.send('S_ADMIN_HOLD_CHARACTER', 2, {hold: true}) })
            }
            else isModified = false;

            mod.send('S_SPAWN_ME', 3, event) // Bring our character model back from the void
            updatePos(event); // Update our position on the server
        }
    });

    mod.hook('S_ADMIN_HOLD_CHARACTER', 'raw', () => !isModified && undefined);

    mod.hook('C_PLAYER_LOCATION', 5, event => {
        if(correctLocation) {
            // Did we accidentally spawn under the map? Let's fix that!
            if(event.loc.z !== correctLocation.loc.z) {
                mod.send('S_INSTANT_MOVE', 3, {
                    gameId: mod.game.me.gameId,
                    loc: correctLocation.loc,
                    w: correctLocation.w
                });
                correctLocation = null;
                return false;
            }
            correctLocation = null;
        }
    });

    mod.hook('C_PLAYER_LOCATION', 5, {order: 100, filter: {fake: null}}, event => {
        lastLocation = event;
    });

    mod.hook('C_VISIT_NEW_SECTION', 'raw', () => {
        // If our client doesn't send C_PLAYER_LOCATION before this packet, then it's most likely user input
        correctLocation = null;

        if(isModified) {
            setTimeout(() => { mod.send('S_ADMIN_HOLD_CHARACTER', 2, {hold: false}) }, mod.settings.loadExtraMs.value);
            isModified = false;
        }
    });

    this.destructor = () => { mod.command.remove(['ql', 'quickload']) };
};