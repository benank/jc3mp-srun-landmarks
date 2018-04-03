module.exports = class Landmark
{
    constructor (data)
    {
        this.name = data.name;
        this.radius = data.radius;
        this.icon = data.icon;
        this.pos = new Vector3f(data.pos.x, 0, data.pos.z);
        this.buildings = [];
        this.spawns = data.spawns;

        // Read building data
        data.buildings.forEach((building) => 
        {
            this.buildings.push({
                name: building.name,
                pos: new Vector3f(building.pos.x, building.pos.y, building.pos.z),
                type: building.type,
                chest_type: building.chest_type,
                from_map: building.from_map,
                radius: building.radius,
                viewradius: building.viewradius || this.radius * 0.33,
                items: building.items || []
            })
        });

        // When a player goes to a landmark for the first time
        jcmp.events.AddRemoteCallable(`landmark/discover_${this.name}`, (player) => 
        {
            this.discover(player);
        })

        // When a player goes to a landmark
        jcmp.events.AddRemoteCallable(`landmark/enter_${this.name}`, (player) => 
        {
            this.enter(player);
        })

        jcmp.events.Add('search/complete', (player) => 
        {
            this.search(player);
        })

        jcmp.events.AddRemoteCallable(`landmark/buy_item_${this.name}`, (player, landmark_name, shop_name, item_index) => 
        {
            this.buy_item(player, landmark_name, shop_name, item_index);
        })
    }

    /**
     * Called when a player searches.
     * @param {*} player 
     */
    search(player)
    {
        const pos = player.position;

        // Loop through chests
        for (let i = 0; i < this.buildings.length; i++)
        {
            const building = this.buildings[i];
            if (building.type == "CHEST" && building.pos.sub(pos).length < building.radius)
            {
                this.discover_chest(player, i, building);
                return;
            }
        }

        // Loop through vehicles if they searched a vehicle
        for (let i = 0; i < jcmp.vehicles.length; i++)
        {
            const v = jcmp.vehicles[i];
            if (v.ship && v.ship.searched_by.indexOf(player.networkId) == -1 && v.position.sub(pos).length < 10)
            {
                v.ship.search(player); // Call the search on the ship
                return;
            }
        }
    }


    /**
     * Called when a player discovers a chest after searching.
     * 
     * @param {*} player 
     * @param {*} index 
     * @param {*} building 
     */
    discover_chest(player, index, building)
    {
        if (player.discovered_chests && player.discovered_chests[this.name] && player.discovered_chests[this.name].indexOf(index) > -1)
        {
            // Already discovered the chest, so they don't get it again
            return;
        }

        jcmp.notify(player, {
            title: `${building.chest_type}'s chest found!`,
            subtitle: 'This chest can be sold for gold at a port',
            preset: 'chest_find'
        })

        const chest = JSON.parse(JSON.stringify(building));
        chest.pos = {x: building.pos.x, y: building.pos.y, z: building.pos.z};
        chest.index = index;
        chest.landmark = this.name;
        chest.gold = Math.ceil(Math.random() * (lm.config.chests[chest.chest_type].max - lm.config.chests[chest.chest_type].min) 
            + lm.config.chests[chest.chest_type].min);
        chest.weight = Math.ceil(chest.gold * 0.6 + lm.config.chests[chest.chest_type].base_weight);

        player.chest = chest;

        jcmp.events.CallRemote('landmark/discover_chest', player, chest.chest_type, this.name, index);
        jcmp.events.CallRemote('pirate/toggle_holding_chest', player, true, JSON.stringify(chest));

        jcmp.events.Call('landmark/discover_chest', player, this.name, index);
    }

    buy_item (player, landmark_name, shop_name, item_index)
    {
        const landmark = jcmp.landmarks.find((b) => b.name == 'Parley Port');
        let building = landmark.buildings.find((b) => b.type == "MAP_BUY");

        if (!building) {return;} // Didn't find a matching shop
        if (!building.items) {return;} // Building doesn't have any items
        
        if (player.bought_maps[landmark_name] && player.bought_maps[landmark_name].indexOf(item_index) > -1) {return;}

        const items = [];

        for (let i = 0; i < building.items.length; i++)
        {
            if (building.items[i].landmark == landmark_name)
            {
                items.push(building.items[i]);
            }
        }

        let item = items[item_index];

        if (!item) {return;} // No matching item found
        if (item.cost > player.money) {return;} // Can't afford it

        if (item.type == "TREASURE_MAP")
        {
            const target_landmark = lm.landmarks.find((e) => e.name === item.landmark);
            if (!target_landmark.buildings[item.chest_index]) // No matching chest at the target landmark found
            {
                lm.chat.send(player, `An error has occurred! (lm1831) Please report this to an administrator!`, new RGB(255,0,0));
                return;
            }

            const chest_data = 
            {
                pos: target_landmark.buildings[item.chest_index].pos,
                name: target_landmark.buildings[item.chest_index].name,
                radius: target_landmark.buildings[item.chest_index].radius,
                viewradius: target_landmark.buildings[item.chest_index].viewradius,
                hint: item.hint,
                landmark_name: target_landmark.name,
                chest_index: item.chest_index
            }

            player.SubtractMoney(item.cost);

            jcmp.events.CallRemote('landmark/map_buy', player, JSON.stringify(
                {landmark_name: landmark_name, shop_name: shop_name, index: item_index}));
            jcmp.events.CallRemote('landmark/chest_poi', player, JSON.stringify(chest_data));

            jcmp.events.Call('landmark/buy_map', player, landmark_name, item_index);
        }
        else if (item.type == "WEAPON_AMMO")
        {
            // TODO
        }




    }

    /**
     * Called when the player tries to sell a chest to a shop here
     * @param {*} player 
     * @param {*} chest 
     */
    sell_chest (player, chest)
    {
        // Called from chest.js after checking that they are actually there, so no checks here
        player.AddMoney(chest.gold);

        jcmp.notify(player, {
            title: 'Chest sold!',
            subtitle: `You received ${chest.gold} gold for the ${chest.chest_type}'s Chest.`,
            preset: 'success',
            time: 3000
        })
    }

    /**
     * Called when a player enters the landmark
     * @param {*} player 
     */
    enter (player)
    {
        if (this.icon == 'bullseye') {return;} // Not a port
        if (player.general.last_visited_landmark == this.name) {return;} // Already here

        player.general.last_visited_landmark = this.name;
        jcmp.events.Call('landmark/update_last_visited', player);
    }

    /**
     * Called when a player discovers a landmark for the first time.
     * @param {*} player 
     */
    discover (player)
    {
        if (player.general.discovered_landmarks.indexOf(this.name) > -1) {return;} // They already discovered this landmark
        if (this.pos.sub(new Vector3f(player.position.x, 0, player.position.z)).length > this.radius * 1.1) {return;} 
        // Player is too far, can't be real

        jcmp.events.Call('landmark/discover', player, this.name); // Call event to update to db
        this.sync_discovered(player);
    }

    get_player_spawn()
    {
        return this.spawns.player[Math.floor(this.spawns.player.length * Math.random())];
    }

    /**
     * Gets a nice object to sync to a player.
     */
    get_sync_data (player)
    {
        const obj = {
            name: this.name,
            radius: this.radius,
            pos: {x: this.pos.x, z: this.pos.z},
            buildings: [],
            discovered: player.general.discovered_landmarks.indexOf(this.name) > -1
        }

        if (this.icon) {obj.icon = this.icon;}

        this.buildings.forEach((building) => 
        {
            const building_data = JSON.parse(JSON.stringify({
                name: building.name,
                pos: {x: building.pos.x, y: building.pos.y, z: building.pos.z},
                type: building.type,
                radius: building.radius,
                viewradius: building.viewradius,
                items: building.items
            }));

            const items = {};

            for (let i = 0; i < building_data.items.length; i++)
            {
                if (!items[building_data.items[i].landmark])
                {
                    items[building_data.items[i].landmark] = [];
                }

                items[building_data.items[i].landmark].push(building_data.items[i]);
            }

            
            for (const landmark_name in items) 
            {
                if (!items.hasOwnProperty(landmark_name)) {return;}

                const building_items = items[landmark_name];

                // Sync bought maps
                for (let i = 0; i < building_items.length; i++)
                {
                    if (player.bought_maps[landmark_name] && player.bought_maps[landmark_name].indexOf(i) > -1)
                    {
                        building_items[i].bought = true;

                        if (building_items[i].type != "TREASURE_MAP") {continue;}
                        // Check if they have discovered the corresponding chest

                        const chest_index = building_items[i].chest_index;
                        const target_landmark = jcmp.landmarks.find((lm) => lm.name == building_items[i].landmark);

                        if (player.discovered_chests[target_landmark.name] 
                            && player.discovered_chests[target_landmark.name].indexOf(chest_index) > -1) {continue;}

                        const chest_data = 
                        {
                            pos: target_landmark.buildings[chest_index].pos,
                            name: target_landmark.buildings[chest_index].name,
                            radius: target_landmark.buildings[chest_index].radius,
                            viewradius: target_landmark.buildings[chest_index].viewradius,
                            hint: building_items[i].hint,
                            landmark_name: target_landmark.name,
                            chest_index: chest_index
                        }

                        jcmp.events.CallRemote('landmark/chest_poi', player, JSON.stringify(chest_data));
                    }
                }

            }



            obj.buildings.push(building_data);
        });

        return obj;
    }

    /**
     * Syncs the landmark to a player.
     */
    sync (player)
    {
        jcmp.events.CallRemote('landmark/sync', player, JSON.stringify(this.get_sync_data(player)));
    }

    /**
     * When a player discovers a landmark, this syncs it to the player so the map can update
     * @param {*} player 
     */
    sync_discovered (player)
    {
        jcmp.events.CallRemote('landmark/sync_discovered', player, this.name);
    }
}