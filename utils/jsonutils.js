const fs = require('fs');

// Loads landmarks from landmarks/data
function LoadLandmarks()
{
    let basePath = __dirname + '/../data/';
    let files_needed = -1;

    fs.readdir(basePath, function(err, filenames)
    {
        if (err) throw err;
        files_needed = filenames.length;
        filenames.forEach(function(filename) 
        {
            fs.readFile(basePath + filename, 'utf8', function (err, data)
            {
                if (err) throw err;
                let obj = JSON.parse(data);
                if (obj.enabled)
                {
                    lm.landmark_data.push(obj);
                    lm.landmarks.push(new lm.Landmark(obj));
                }
                files_needed--;
            });
        })
    });

    const load_interval = setInterval(() => 
    {
        if (files_needed == 0)
        {
            clearInterval(load_interval);
            jcmp.landmarks = lm.landmarks;
            console.log(`[LANDMARKS] Loaded ${lm.landmark_data.length} landmarks.`);
        }
    }, 100);
}

// Saves landmarks to landmarks/data
function SaveLandmarks()
{
    console.log('[LANDMARKS] Saving landmarks...');
    let basePath = __dirname + '/../data/';
    
    for (let i = 0; i < lm.landmark_data.length; i++) 
    {
        const landmark = lm.landmark_data[i];
        console.log(landmark);
        
        fs.writeFileSync(basePath + landmark.name + '.json', JSON.stringify(landmark, null, '\t'));
    }

    console.log(`[LANDMARKS] Saved ${lm.landmark_data.length} landmarks.`);
}

module.exports = 
{
    LoadLandmarks,
    SaveLandmarks
}