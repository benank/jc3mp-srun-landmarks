$(document).ready(function() 
{
    $('html').css('visibility', 'visible');

    $('div.border').hide();
    $('div.landmark-indicator').hide();
    $('div.carrying-indicator-drop').hide();

    let audio;
    let audio_coins;

    const SHOW_TIME = 10000;

    function Update(landmark_name, discovered, _icon)
    {
        $('#landmark-name').text(landmark_name);
        $('div.border.top span.title.sandcolor').text(!discovered ? 'LANDMARK DISCOVERED' : '');

        const icon = _icon ? _icon : 'anchor';
        $('.title-a').removeClass('fa-anchor').removeClass('fa-bullseye').addClass(`fa-${icon}`);

        $('#landmark-name2').text(landmark_name);
    }

    function Show()
    {   
        if (audio)
        {
            audio.pause();
        }

        audio = new Audio('landmark.ogg');
        audio.volume = 0.25;
        audio.play();

        setTimeout(() => {
            audio.remove();
        }, audio.duration * 1000);

        $('div.border.top').show("slide", { direction: "up" }, 1500);
        $('div.border.bottom').show("slide", { direction: "down" }, 1500);

        setTimeout(() => {
            $('div.landmark-indicator').show();
        }, 3000);

        setTimeout(() => {
            $('div.border.top').hide("slide", { direction: "up" }, 1500);
            $('div.border.bottom').hide("slide", { direction: "down" }, 1500);
        }, SHOW_TIME);
    }

    jcmp.AddEvent('update', (name, discovered, _icon) => 
    {
        Update(name, discovered, _icon);
    })

    jcmp.AddEvent('show', () => 
    {
        Show();
    })

    jcmp.AddEvent('hide_indicator', () => 
    {
        $('div.landmark-indicator').hide("fade", 1000);
    })

    jcmp.AddEvent('update_gold', (money) => 
    {
        if (audio_coins)
        {
            audio_coins.pause();
        }

        audio_coins = new Audio('coins.ogg');
        audio_coins.volume = 0.75;
        audio_coins.play();

        $('#money-amount').text(money);
    })

    jcmp.AddEvent('update_carrying', (name) => 
    {
        $('div.carrying-indicator>font.chest-type').text(`${name}'s Chest`);
    })

    jcmp.AddEvent('toggle_carrying', (showing) => 
    {
        if (showing)
        {
            $('div.carrying-indicator').show();
            $('div.carrying-indicator-drop').show();

            const audio_coins = new Audio('pickup_chest.ogg');
            audio_coins.volume = 0.75;
            audio_coins.play();    

        }
        else
        {
            $('div.carrying-indicator').hide();
            $('div.carrying-indicator-drop').hide();

            const audio_coins = new Audio('drop_chest.ogg');
            audio_coins.volume = 0.75;
            audio_coins.play();    
        }
    })

    jcmp.AddEvent('chest_found_sfx', () => 
    {
        const audio_chest = new Audio('chest.ogg');
        audio_chest.volume = 0.5;
        audio_chest.play();
    })

    jcmp.AddEvent('toggle_pickup_chest', (showing) => 
    {
        if (showing)
        {
            $('div.prompt-container').show();
        }
        else
        {
            $('div.prompt-container').hide();
        }
    })

    $('div.carrying-indicator').hide();
    $('div.prompt-container').hide();

    jcmp.CallLocalEvent('ready');
    jcmp.CallEvent('ui_ready', 'landmark');
})