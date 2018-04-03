jcmp.events.Add('chat_command', (player, msg, channel) => 
{
    if (msg == '/landmark')
    {
        player.lm_data = 
        {
            name: 'None',
            radius: 100,
            pos: {x: player.position.x, z: player.position.z},
            buildings: 
            [
                // additional buildings, like treasure seller or weapon shop
                // {name: 'Treasure n things', type: 'treasure_sell', pos: {x: 0, y: 0, z: 0}, radius: 5}
            ],
            enabled: true
        };
        player.lm_place = 1;
        lm.chat.send(player, 'You have started creating a landmark at your location. Please type the name of the landmark.');
    }
})

jcmp.events.Add('chat_message', (player, msg, channel) => 
{
    if (player.lm_place == 1)
    {
        player.lm_data.name = msg;
        player.lm_place = 2;
        lm.chat.send(player, `Set name to ${msg}. Now please travel the distance away from your position that you want the radius to be and type set.`);
        return false;
    }
    else if (player.lm_place == 2)
    {
        const base = new Vector3f(player.lm_data.pos.x, 0, player.lm_data.pos.z);
        const cur_pos = new Vector3f(player.position.x, 0, player.position.z);

        player.lm_data.radius = base.sub(cur_pos).length;
        lm.chat.send(player, `Set radius to ${player.lm_data.radius}. Saving landmark...`);

        lm.landmark_data.push(player.lm_data);
        lm.utils.json.SaveLandmarks();
        player.lm_place = null;

        return false;
    }
})