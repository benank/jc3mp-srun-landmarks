// Player loaded all landmark UI, so let's send them data
jcmp.events.AddRemoteCallable('landmarks/ready', (player) => 
{
    lm.landmarks.forEach((landmark) => 
    {
        landmark.sync(player); // Send all landmarks to the player
    });
})