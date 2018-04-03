global.lm = 
{
    config: require('./config'),
    Landmark: require('./classes/landmark'),
    landmarks: [], // classes
    landmark_data: [], // json parsed data
    utils:
    {
        json: require('./utils/jsonutils')
    },
    chat: jcmp.events.Call('get_chat')[0]
}

//require('./events/chat');
require('./events/network');

lm.utils.json.LoadLandmarks(); // Load landmarks from file