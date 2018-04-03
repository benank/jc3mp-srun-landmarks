let landmark_ui;
let map_ui;
let shop_ui;
let prompt_ui;


jcmp.events.Add('pirate/load_ready', () => 
{
    landmark_ui = new WebUIWindow('landmarks', `package://landmarks/ui/landmark/index.html`, new Vector2(jcmp.viewportSize.x, jcmp.viewportSize.y));
    landmark_ui.autoResize = true;

    map_ui = new WebUIWindow('map', `package://landmarks/ui/map/index.html`, new Vector2(jcmp.viewportSize.x, jcmp.viewportSize.y));
    map_ui.autoResize = true;

    shop_ui = new WebUIWindow('shop', `package://landmarks/ui/shop/index.html`, new Vector2(jcmp.viewportSize.x, jcmp.viewportSize.y));
    shop_ui.autoResize = true;
    shop_ui.hidden = true;

    prompt_ui = new WebUIWindow('prompt', `package://landmarks/ui/prompt/index.html`, new Vector2(jcmp.viewportSize.x, jcmp.viewportSize.y));
    prompt_ui.autoResize = true;
    prompt_ui.hidden = true;

    AddUISubscriptions();
})

let ui_loaded = 0; // Must wait for all uis to load

const landmarks = [];
jcmp.in_landmark = -1;

let waypoint_marker;

const chest_pois = []; // Array of chest pois


function AddUISubscriptions()
{
    shop_ui.AddEvent('buy', (landmark_name, shop_name, item_index, cost) => 
    {
        if (cost > jcmp.money || jcmp.in_landmark == -1) {return;}

        jcmp.events.CallRemote(`landmark/buy_item_${landmarks[jcmp.in_landmark].name}`, landmark_name, shop_name, item_index);
    })

    map_ui.AddEvent('set_marker', (x, z) => 
    {
        waypoint_marker = new POI(10, new Vector3f(ConvertFromMap(x),1025,ConvertFromMap(z)), '');
        waypoint_marker.minDistance = 5;
        waypoint_marker.maxDistance = 9999999;
        waypoint_marker.clampedToScreen = true;
    })

    map_ui.AddEvent('hide_marker', () => 
    {
        waypoint_marker.minDistance = 9999999;
    })

    jcmp.ui.AddEvent('chat_input_state', (s) => {
        map_ui.CallEvent('toggle_enabled', s);
    })

    map_ui.AddEvent('toggle_map', (open) => 
    {
        jcmp.localPlayer.controlsEnabled = !open;
        map_ui.BringToFront();
    })

    landmark_ui.AddEvent('ready', () => 
    {
        ui_loaded++;
        CheckIfUILoaded();
    })

    map_ui.AddEvent('ready', () => 
    {
        ui_loaded++;
        CheckIfUILoaded();
        jcmp.events.CallRemote('pirate/map_ready');
    })

    jcmp.events.AddRemoteCallable('pirate/sync_bought_maps', (map_data) => 
    {
        shop_ui.CallEvent('init_bought_maps', map_data);
    })

    shop_ui.AddEvent('ready', () => 
    {
        ui_loaded++;
        CheckIfUILoaded();
    })

    jcmp.events.AddRemoteCallable('pirate/change_money', (money) => 
    {
        shop_ui.CallEvent('update_gold', money);
        landmark_ui.CallEvent('update_gold', money);
    })

    // Initial sync with all landmark data
    jcmp.events.AddRemoteCallable('landmark/sync', (data) => 
    {
        data = JSON.parse(data);
        data.pos = new Vector3f(data.pos.x, 0, data.pos.z);
        landmarks.push(data);

        const d = JSON.stringify({
            x: ConvertToMap(data.pos.x),
            y: ConvertToMap(data.pos.z),
            name: data.name,
            discovered: data.discovered,
            radius: data.radius,
            icon: data.icon
        });

        map_ui.CallEvent('add', d);
        shop_ui.CallEvent('add_landmark', d);
        shop_ui.CallEvent('update_gold', jcmp.money || 0);
        landmark_ui.CallEvent('update_gold', jcmp.money || 0);
        let shop_done = false;

        for (let i = 0; i < data.buildings.length; i++)
        {
            const building = data.buildings[i];

            if (building.from_map) {continue;} // Only from bought maps, so don't display until the map is bought
            if (building.type == "CHEST") {continue;} // No pois for chests
            
            let poi_type = 16;

            if (building.type == "CHEST_SELL") {poi_type = 9; building.pos.y += 1.5;}
            else if (building.type == "MAP_BUY") {poi_type = 6; building.pos.y += 1.5;}
            else if (building.type == "WEAPON_BUY") {poi_type = 7; building.pos.y += 1.5;}
            else if (building.type == "CHEST") {poi_type = 16;}
            else if (building.type == "AMMO_PEACEMAKER") {poi_type = 24;}
            else if (building.type == "AMMO_STUPKA") {poi_type = 24;}

            building.pos = new Vector3f(building.pos.x, building.pos.y, building.pos.z);

            const poi = new POI(poi_type, building.pos, building.name);
            poi.minDistance = building.radius;
            poi.maxDistance = building.viewradius;


            // If this is a map store, then add the items to the store
            if (building.type == "MAP_BUY" && !shop_done)
            {
                if (!building.items) {continue;}
                for (let j = 0; j < building.items.length; j++)
                {
                    const item = building.items[j];

                    shop_ui.CallEvent('add', JSON.stringify({
                        landmark_name: item.landmark,
                        cost: item.cost,
                        bought: item.bought
                    }))
                }
                shop_done = true;
            }

        }

    })

    jcmp.events.AddRemoteCallable('landmark/map_buy', (data) => 
    {
        shop_ui.CallEvent('buy_map', data);
    })

    jcmp.events.AddRemoteCallable('landmark/chest_poi', (data) => 
    {
        data = JSON.parse(data);

        map_ui.CallEvent('add_treasure', JSON.stringify({
            name: 'Treasure',
            x: ConvertToMap(data.pos.x),
            y: ConvertToMap(data.pos.z),
            hint: data.hint,
            chest_index: data.chest_index,
            landmark_name: data.landmark_name
        }))
        
        
    })

    jcmp.events.AddRemoteCallable('pirate/toggle_holding_chest', (holding_chest, data) => 
    {
        jcmp.carrying_chest = holding_chest;
        
        jcmp.ui.CallEvent('landmark/toggle_carrying_chest', jcmp.carrying_chest);

        if (jcmp.carrying_chest)
        {
            jcmp.current_chest = JSON.parse(data);
            landmark_ui.CallEvent('update_carrying', jcmp.current_chest.chest_type);
        }
        else
        {
            jcmp.current_chest = null;
        }

        landmark_ui.CallEvent('toggle_carrying', jcmp.carrying_chest);
    })

    jcmp.events.AddRemoteCallable('landmark/discover_chest', (chest_type, landmark_name, chest_index) => 
    {
        landmark_ui.CallEvent('chest_found_sfx');
        map_ui.CallEvent('found_treasure', JSON.stringify({
            landmark_name: landmark_name,
            chest_index: chest_index
        }))
    })

    jcmp.events.AddRemoteCallable('landmark/sync_discovered', (name) => 
    {
        for (let i = 0; i < landmarks.length; i++)
        {
            if (landmarks[i].name == name)
            {
                landmarks[i].discovered = true;
                map_ui.CallEvent('update_discovered', landmark.name);
                shop_ui.CallEvent('set_discovered', landmark.name);
            }
        }
    })

    
    // Update player position on map
    jcmp.ui.AddEvent('SecondTick', () => 
    {
        const pos = jcmp.localPlayer.position;
        UpdateMapPos(pos);
        CheckIfInLandmark(pos);
    })
    
    jcmp.ui.AddEvent('KeyPress', (key) => 
    {
        if ((key == 101 || key == 69) && (!prompt_ui.hidden || (!shop_ui.hidden && prompt_ui.hidden)) && jcmp.in_landmark > -1) // E
        {
            ToggleShopUI();
        }
    })

}

jcmp.carrying_chest = false;
jcmp.dropped_chests = [];

jcmp.events.AddRemoteCallable('pirate/chest_picked_up', (data) => 
{
    data = JSON.parse(data);

    for (let i = 0; i < jcmp.dropped_chests.length; i++)
    {
        const chest = jcmp.dropped_chests[i];
        if (chest.index == data.index && chest.chest_type == data.chest_type && data.landmark == chest.landmark)
        {
            chest.poi.maxDistance = 0;
            chest.poi.minDistance = 0;
            chest.poi.Destroy();

            jcmp.dropped_chests.splice(i, 1);
            break;
        }
    };
})

jcmp.events.AddRemoteCallable('pirate/chest_dropped', (data) => 
{
    data = JSON.parse(data);


    const poi = new POI(19, new Vector3f(data.pos.x, data.pos.y, data.pos.z), `${data.chest_type}'s Chest`);
    poi.minDistance = 2;
    poi.maxDistance = 25;
    poi.flashing = true;

    data.poi = poi;

    data.position = new Vector3f(data.pos.x, data.pos.y, data.pos.z);

    jcmp.dropped_chests.push(data);

})

function CheckIfUILoaded()
{
    if (ui_loaded == 3) // If all uis have loaded
    {
        jcmp.events.CallRemote('landmarks/ready'); // Ready for data
    }
}

function ConvertToMap(pos)
{
    return Math.max(0, Math.min(100 * ((pos + 16383) / 32767), 100)); // Convert to percent
}

function ConvertFromMap(pos)
{
    return (pos / 100) * 32767 - 16383; // Convert to coords
}

// Update's ship position on the map
function UpdateMapPos(pos)
{
    map_ui.CallEvent('update_pos', JSON.stringify({
        x: ConvertToMap(pos.x),
        y: ConvertToMap(pos.z)
    }));
}

// Checks if a player is in a landmark
function CheckIfInLandmark(pos)
{
    const pos2 = new Vector3f(pos.x, pos.y, pos.z);

    if (jcmp.loading != 0) {return;}
    pos.y = 0;
    if (jcmp.in_landmark == -1) // We are not in a landmark
    {
        for (let i = 0; i < landmarks.length; i++)
        {
            const landmark = landmarks[i];
            if (landmark.pos.sub(pos).length < landmark.radius)
            {
                jcmp.in_landmark = i;
                landmark_ui.BringToFront();
                landmark_ui.CallEvent('update', landmark.name, landmark.discovered, landmark.icon);
                landmark_ui.CallEvent('show');
                map_ui.CallEvent('update_discovered', landmark.name);
                shop_ui.CallEvent('set_discovered', landmark.name);
                jcmp.events.CallRemote(`landmark/enter_${landmark.name}`);

                if (!landmark.discovered)
                {
                    landmark.discovered = true;
                    jcmp.events.CallRemote(`landmark/discover_${landmark.name}`);

                    if (landmark.icon == 'bullseye')
                    {
                        jcmp.notify({
                            title: `${landmark.name} Discovered`,
                            subtitle: `You can now buy treasure maps for this area`,
                            preset: 'landmark_discover'
                        });
                    }
                    else
                    {
                        jcmp.notify({
                            title: `${landmark.name} Discovered`,
                            subtitle: `You can now use the shops in this area`,
                            preset: 'landmark_discover_port'
                        });
                    }

                }

                break;
            }
        };
    }
    else // We are currently in a landmark
    {
        const landmark = landmarks[jcmp.in_landmark];

        if (landmark.pos.sub(pos).length >= landmark.radius)
        {
            jcmp.in_landmark = -1;
            landmark_ui.CallEvent('hide_indicator');
            
            if (!prompt_ui.hidden)
            {
                prompt_ui.hidden = true;
                ToggleShopUIBool(true);
            }
        }
        else
        {
            let in_range = false;

            for (let i = 0; i < landmark.buildings.length; i++)
            {
                const building = landmark.buildings[i];

                const radius = (building.radius > 0) ? building.radius : 3;

                if ((building.type == "MAP_BUY" || building.type ==  "WEAPON_BUY" || building.type ==  "CHEST_SELL") 
                    && building.pos.sub(pos2).length < radius)
                {
                    in_range = true;
                    jcmp.near_shop = building.type;

                    if (building.type == "CHEST_SELL" && !jcmp.carrying_chest)
                    {
                        prompt_ui.CallEvent('set_type', "CHEST_SELL_NOPE");
                    }
                    else
                    {
                        prompt_ui.CallEvent('set_type', building.type);
                    }
                    
                    if (shop_ui.hidden && prompt_ui.hidden)
                    {
                        prompt_ui.hidden = false;
                    }

                    shop_ui.CallEvent('set_name', building.name);

                    break;
                }
            }

            if (!in_range)
            {
                jcmp.near_shop = null;
            }

            let chest_near = false;

            jcmp.dropped_chests.forEach((chest) => 
            {
                if (pos2.sub(chest.position).length < 3 && !jcmp.carrying_chest) // In range to pick up chest
                {
                    chest_near = true;
                }
            });

            landmark_ui.CallEvent('toggle_pickup_chest', chest_near);

            if (!in_range && !prompt_ui.hidden)
            {
                prompt_ui.hidden = true;
                ToggleShopUIBool(true)
            }
        }
    }
}

function ToggleShopUIBool(hidden)
{
    if (shop_ui.hidden == hidden) {return;}

    shop_ui.BringToFront();
    shop_ui.hidden = hidden;
    jcmp.localPlayer.controlsEnabled = shop_ui.hidden;
    prompt_ui.hidden = !shop_ui.hidden;
}

function ToggleShopUI()
{
    if (jcmp.near_shop != "MAP_BUY") {return;}
    shop_ui.BringToFront();
    shop_ui.hidden = !shop_ui.hidden;
    jcmp.localPlayer.controlsEnabled = shop_ui.hidden;
    prompt_ui.hidden = !shop_ui.hidden;

    shop_ui.CallEvent('toggle_mouse', !shop_ui.hidden);
}